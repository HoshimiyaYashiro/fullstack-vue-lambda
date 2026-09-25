import fs from 'node:fs';
import path from 'node:path';
import { ZipArchive } from 'archiver';
import { defineConfig } from 'tsup';

/**
 * Dynamically discover all Lambda handlers under src/handlers/
 */
function getHandlerEntries(dir = 'src/handlers', baseDir = 'src/handlers'): Record<string, string> {
  const entries: Record<string, string> = {};
  if (!fs.existsSync(dir)) return entries;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      Object.assign(entries, getHandlerEntries(fullPath, baseDir));
    } else if (
      item.isFile() &&
      item.name.endsWith('.ts') &&
      !item.name.endsWith('.test.ts') &&
      !item.name.endsWith('.spec.ts') &&
      !item.name.startsWith('_')
    ) {
      const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const entryKey = `handlers/${rel.replace(/\.ts$/, '')}`;
      entries[entryKey] = fullPath.replace(/\\/g, '/');
    }
  }
  return entries;
}

export default defineConfig((options) => {
  const targetHandler = process.env.HANDLER || options.env?.HANDLER;

  let entry: Record<string, string> = {};

  if (targetHandler) {
    const normalized = targetHandler
      .replace(/^src\/handlers\//, '')
      .replace(/\.ts$/, '')
      .replace(/\\/g, '/');
    const entryPath = path.join('src/handlers', `${normalized}.ts`).replace(/\\/g, '/');
    if (fs.existsSync(entryPath)) {
      entry[`handlers/${normalized}`] = entryPath;
    } else {
      throw new Error(`[tsup] Handler '${targetHandler}' not found at '${entryPath}'`);
    }
  } else {
    entry = getHandlerEntries();
  }

  return {
    entry,
    format: ['esm'],
    target: 'node20',
    splitting: false,
    sourcemap: true,
    clean: !targetHandler, // Preserve other built handlers when compiling a single handler
    dts: false,
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    treeshake: true,
    external: [
      '@aws-sdk/*',
      '@aws-sdk/client-*',
      '@aws-sdk/lib-*',
      '@repo/shared',
      '@repo/database',
      /^@layers\//,
      'drizzle-orm',
      'postgres',
      'zod',
    ],
    onSuccess: async () => {
      const zipsDir = path.resolve('dist/zips');
      fs.mkdirSync(zipsDir, { recursive: true });

      for (const [entryKey] of Object.entries(entry)) {
        const handlerName = entryKey.replace(/^handlers\//, '').replace(/\//g, '-');
        const jsFile = path.resolve('dist', `${entryKey}.js`);
        const mapFile = path.resolve('dist', `${entryKey}.js.map`);
        const zipFile = path.resolve(zipsDir, `${handlerName}.zip`);

        if (fs.existsSync(jsFile)) {
          const archive = new ZipArchive({ zlib: { level: 9 } });
          const output = fs.createWriteStream(zipFile);
          await new Promise<void>((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);
            archive.file(jsFile, { name: 'index.mjs' });
            if (fs.existsSync(mapFile)) {
              archive.file(mapFile, { name: 'index.mjs.map' });
            }
            archive.append(JSON.stringify({ type: 'module' }), { name: 'package.json' });
            archive.finalize();
          });
        }
      }
    },
  };
});
