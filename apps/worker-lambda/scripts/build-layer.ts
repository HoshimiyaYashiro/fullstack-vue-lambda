import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZipArchive } from 'archiver';
import { build } from 'tsup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(rootDir, '../..');
const sharedPkgDir = path.resolve(repoRoot, 'packages/shared');
const dbPkgDir = path.resolve(repoRoot, 'packages/database');
const customLayersBaseDir = path.resolve(rootDir, 'src/layers');
const distDir = path.resolve(rootDir, 'dist');
const layersBaseDir = path.resolve(distDir, 'layers');

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDirectorySize(dirPath: string): number {
  let total = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirectorySize(full);
    } else if (entry.isFile()) {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

function createZipArchive(
  outputPath: string,
  addFiles: (archive: ZipArchive) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const output = fs.createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => {
      resolve(archive.pointer());
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    addFiles(archive);
    archive.finalize();
  });
}

interface BaseLayerDefinition {
  id: string;
  name: string;
  zipFile: string;
  description: string;
  includeShared: boolean;
  includeDatabase?: boolean;
  filterDeps: (pkgName: string) => boolean;
}

interface CustomLayerDefinition {
  id: string;
  name: string;
  zipFile: string;
  dir: string;
}

function findCustomLayers(): CustomLayerDefinition[] {
  if (!fs.existsSync(customLayersBaseDir)) return [];
  const entries = fs.readdirSync(customLayersBaseDir, { withFileTypes: true });
  const results: CustomLayerDefinition[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const entryFile = path.join(customLayersBaseDir, entry.name, 'index.ts');
      if (fs.existsSync(entryFile)) {
        results.push({
          id: entry.name,
          name: `@layers/${entry.name}`,
          zipFile: `${entry.name}-layer.zip`,
          dir: path.join(customLayersBaseDir, entry.name),
        });
      }
    }
  }
  return results;
}

// Ensure @repo/shared is built
function ensureSharedCompiled() {
  console.log('▶ [Build] Compiling @repo/shared package...');
  execSync('pnpm --filter @repo/shared build', {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  const sharedDist = path.resolve(sharedPkgDir, 'dist');
  if (!fs.existsSync(sharedDist)) {
    throw new Error(`Compiled shared package not found at ${sharedDist}`);
  }
  console.log('  -> @repo/shared compilation verified.');
}

// Ensure @repo/database is built
function ensureDatabaseCompiled() {
  console.log('▶ [Build] Compiling @repo/database package...');
  execSync('pnpm --filter @repo/database build', {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  const dbDist = path.resolve(dbPkgDir, 'dist');
  if (!fs.existsSync(dbDist)) {
    throw new Error(`Compiled database package not found at ${dbDist}`);
  }
  console.log('  -> @repo/database compilation verified.');
}

async function buildCustomCodeLayer(layer: CustomLayerDefinition) {
  const startTime = Date.now();
  console.log(`\n===============================================================`);
  console.log(`📦 Building Custom Modular Layer: ${layer.name}`);
  console.log(`===============================================================`);
  console.log(`Source:   src/layers/${layer.id}/index.ts`);

  const layerDir = path.resolve(layersBaseDir, layer.id);
  const nodejsDir = path.resolve(layerDir, 'nodejs');
  const targetModuleDir = path.resolve(nodejsDir, `node_modules/@layers/${layer.id}`);

  // Clean output directory
  if (fs.existsSync(layerDir)) {
    fs.rmSync(layerDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetModuleDir, { recursive: true });

  // Compile with tsup
  await build({
    entry: { index: path.join(layer.dir, 'index.ts') },
    outDir: targetModuleDir,
    format: ['esm'],
    target: 'node20',
    sourcemap: true,
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    external: [
      '@repo/shared',
      '@repo/database',
      '@layers/*',
      '@aws-sdk/*',
      'drizzle-orm',
      'postgres',
      'zod',
    ],
    silent: true,
  });

  // Package manifest for Node.js resolution
  const pkgJson = {
    name: layer.name,
    version: '1.0.0',
    type: 'module',
    main: './index.js',
    exports: {
      '.': './index.js',
    },
  };
  fs.writeFileSync(
    path.join(targetModuleDir, 'package.json'),
    JSON.stringify(pkgJson, null, 2),
    'utf-8'
  );

  // Archive
  const zipPath = path.resolve(layersBaseDir, layer.zipFile);
  const zipSize = await createZipArchive(zipPath, (archive) => {
    archive.directory(nodejsDir, 'nodejs');
  });

  const uncompressedSize = getDirectorySize(nodejsDir);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✅ [${layer.name}] Built in ${elapsed}s!`);
  console.log(
    `   Unpacked: ${formatBytes(uncompressedSize)} | ZIP: ${formatBytes(zipSize)} -> dist/layers/${layer.zipFile}`
  );
}

async function buildBaseDependencyLayer(
  layer: BaseLayerDefinition,
  allDependencies: Record<string, string>
) {
  const startTime = Date.now();
  console.log(`\n===============================================================`);
  console.log(`📦 Building Base Dependency Layer: ${layer.name}`);
  console.log(`===============================================================`);
  console.log(`Description: ${layer.description}`);

  const layerDir = path.resolve(layersBaseDir, layer.id);
  const nodejsDir = path.resolve(layerDir, 'nodejs');

  // Clean output directory
  if (fs.existsSync(layerDir)) {
    fs.rmSync(layerDir, { recursive: true, force: true });
  }
  fs.mkdirSync(nodejsDir, { recursive: true });

  // Filter dependencies for this specific layer
  const layerDeps: Record<string, string> = {};
  for (const [pkgName, version] of Object.entries(allDependencies)) {
    if (pkgName !== '@repo/shared' && pkgName !== '@repo/database' && layer.filterDeps(pkgName)) {
      layerDeps[pkgName] = version;
    }
  }

  const pkgCount = Object.keys(layerDeps).length;
  console.log(
    `  -> Selected ${pkgCount} external package(s): ${Object.keys(layerDeps).join(', ') || '(none)'}`
  );

  // Create package.json for layer
  const layerPkgJson = {
    name: layer.name,
    version: '1.0.0',
    type: 'module',
    description: layer.description,
    dependencies: layerDeps,
  };

  fs.writeFileSync(
    path.join(nodejsDir, 'package.json'),
    JSON.stringify(layerPkgJson, null, 2),
    'utf-8'
  );

  // Install dependencies if any
  if (pkgCount > 0) {
    console.log('  -> Installing production packages into layer nodejs/node_modules...');
    execSync('npm install --omit=dev --no-package-lock --silent', {
      cwd: nodejsDir,
      stdio: 'inherit',
    });
  } else {
    fs.mkdirSync(path.join(nodejsDir, 'node_modules'), { recursive: true });
  }

  // Embed @repo/shared if requested
  if (layer.includeShared) {
    const sharedDist = path.resolve(sharedPkgDir, 'dist');
    const targetSharedDir = path.resolve(nodejsDir, 'node_modules/@repo/shared');
    fs.mkdirSync(targetSharedDir, { recursive: true });
    fs.cpSync(sharedDist, path.join(targetSharedDir, 'dist'), { recursive: true });

    const sharedPkgJson = {
      name: '@repo/shared',
      version: '1.0.0',
      type: 'module',
      main: './dist/index.js',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
          default: './dist/index.js',
        },
      },
    };
    fs.writeFileSync(
      path.join(targetSharedDir, 'package.json'),
      JSON.stringify(sharedPkgJson, null, 2),
      'utf-8'
    );
    console.log('  -> Embedded @repo/shared isomorphic package.');
  }

  // Embed @repo/database if requested
  if (layer.includeDatabase) {
    const dbDist = path.resolve(dbPkgDir, 'dist');
    const targetDbDir = path.resolve(nodejsDir, 'node_modules/@repo/database');
    fs.mkdirSync(targetDbDir, { recursive: true });
    fs.cpSync(dbDist, path.join(targetDbDir, 'dist'), { recursive: true });

    const dbPkgJson = {
      name: '@repo/database',
      version: '1.0.0',
      type: 'module',
      main: './dist/index.js',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
          default: './dist/index.js',
        },
      },
    };
    fs.writeFileSync(
      path.join(targetDbDir, 'package.json'),
      JSON.stringify(dbPkgJson, null, 2),
      'utf-8'
    );
    console.log('  -> Embedded @repo/database centralized package.');
  }

  // Create ZIP archive
  console.log(`  -> Compressing ${layer.zipFile}...`);
  const zipPath = path.resolve(layersBaseDir, layer.zipFile);
  const zipSize = await createZipArchive(zipPath, (archive) => {
    archive.directory(nodejsDir, 'nodejs');
  });

  const uncompressedSize = getDirectorySize(nodejsDir);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✅ [${layer.name}] Built in ${elapsed}s!`);
  console.log(
    `   Unpacked: ${formatBytes(uncompressedSize)} | ZIP: ${formatBytes(zipSize)} -> dist/layers/${layer.zipFile}`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const targetArg = args.find((a) => !a.startsWith('--'))?.toLowerCase();

  // Read dependencies from worker-lambda package.json
  const workerPkgPath = path.resolve(rootDir, 'package.json');
  const workerPkg = JSON.parse(fs.readFileSync(workerPkgPath, 'utf-8'));
  const allDependencies: Record<string, string> = workerPkg.dependencies || {};

  const baseLayers: BaseLayerDefinition[] = [
    {
      id: 'shared',
      name: 'enterprise-shared-layer',
      zipFile: 'shared-layer.zip',
      description: 'Shared domain models, Zod validation schemas, and constants',
      includeShared: true,
      filterDeps: (pkg) => pkg === 'zod',
    },
    {
      id: 'database',
      name: 'enterprise-database-layer',
      zipFile: 'database-layer.zip',
      description:
        'Aurora PostgreSQL Serverless v2 driver (postgres.js), Drizzle ORM & @repo/database',
      includeShared: false,
      includeDatabase: true,
      filterDeps: (pkg) => pkg === 'drizzle-orm' || pkg === 'postgres',
    },
    {
      id: 'aws-sdk',
      name: 'enterprise-aws-sdk-layer',
      zipFile: 'aws-sdk-layer.zip',
      description: 'AWS SDK v3 Modular Clients for S3, DynamoDB, Cognito, EventBridge, etc.',
      includeShared: false,
      filterDeps: (pkg) => pkg.startsWith('@aws-sdk/'),
    },
    {
      id: 'common',
      name: 'enterprise-common-layer',
      zipFile: 'common-layer.zip',
      description: 'Monolithic layer containing all dependencies + @repo/shared + @repo/database',
      includeShared: true,
      includeDatabase: true,
      filterDeps: () => true,
    },
  ];

  const customLayers = findCustomLayers();

  console.log('===============================================================');
  console.log('       AWS Lambda Modular Layer Orchestrator                  ');
  console.log('===============================================================');
  console.log(`Custom Layers Detected: ${customLayers.map((c) => c.id).join(', ') || '(none)'}`);
  console.log(`Base Dependency Layers:  ${baseLayers.map((b) => b.id).join(', ')}\n`);

  ensureSharedCompiled();
  ensureDatabaseCompiled();

  const totalStart = Date.now();

  // If specific target provided:
  if (targetArg && targetArg !== 'all') {
    const matchedCustom = customLayers.find(
      (c) => c.id === targetArg || c.name === targetArg || c.zipFile === targetArg
    );
    const matchedBase = baseLayers.find(
      (b) => b.id === targetArg || b.name === targetArg || b.zipFile === targetArg
    );

    if (matchedCustom) {
      await buildCustomCodeLayer(matchedCustom);
    } else if (matchedBase) {
      await buildBaseDependencyLayer(matchedBase, allDependencies);
    } else {
      console.error(`\n❌ Unknown layer target '${targetArg}'!`);
      console.error('\nAvailable layer targets:');
      console.error('Custom code layers (from src/layers/*):');
      for (const c of customLayers) {
        console.error(`  - ${c.id} (${c.name} -> ${c.zipFile})`);
      }
      console.error('Base dependency layers:');
      for (const b of baseLayers) {
        console.error(`  - ${b.id} (${b.name} -> ${b.zipFile})`);
      }
      console.error('  - all (builds all custom and base layers)\n');
      process.exit(1);
    }
  } else {
    // Build all custom layers
    for (const c of customLayers) {
      await buildCustomCodeLayer(c);
    }
    // Build modular base layers (shared and database)
    for (const b of baseLayers.filter((b) => b.id === 'shared' || b.id === 'database')) {
      await buildBaseDependencyLayer(b, allDependencies);
    }
  }

  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(2);
  console.log('\n===============================================================');
  console.log(`🎉 Lambda Layer Build Finished in ${totalElapsed}s!`);
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Layer build error:', err);
  process.exit(1);
});
