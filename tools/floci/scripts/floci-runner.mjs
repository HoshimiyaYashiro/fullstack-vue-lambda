#!/usr/bin/env node

/**
 * Floci Local Cloud Runner
 * Cross-platform orchestrator supporting both Docker Compose and Native Floci CLI modes.
 */

import { execSync, spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FLOCI_DIR = path.resolve(__dirname, '..');
const COMPOSE_FILE = path.join(FLOCI_DIR, 'docker-compose.yml');
loadDotEnv({ path: path.join(FLOCI_DIR, '.env.floci') });

const FLOCI_ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

const action = process.argv[2] || 'up';

function isDockerRunning() {
  try {
    const res = spawnSync('docker', ['info'], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

function isFlociCliAvailable() {
  try {
    const cmd = process.platform === 'win32' ? 'where floci' : 'which floci';
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkHealth(endpoint = 'http://localhost:4566', timeoutMs = 25000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const req = http.get(endpoint, (_res) => {
        clearInterval(interval);
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      });
      req.setTimeout(1000, () => req.destroy());
    }, 1000);
  });
}

async function runSeed() {
  const seedArgs = process.argv.slice(3).filter((arg) => arg !== '--');
  const isHelpRequest = seedArgs.includes('--help') || seedArgs.includes('-h');

  if (!isHelpRequest) console.log(`\n[Floci Seed] Checking ${FLOCI_ENDPOINT}...`);
  if (!isHelpRequest && !(await checkHealth(FLOCI_ENDPOINT, 5000))) {
    console.error(
      '\n[Floci Seed Error] Floci is not responding. Start it with "pnpm floci:up" first.'
    );
    process.exitCode = 1;
    return;
  }

  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const seedCommand = ['--filter', '@repo/floci-tooling', 'seed'];
  if (seedArgs.length > 0) seedCommand.push('--', ...seedArgs);
  const result = spawnSync(pnpmCmd, seedCommand, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(
      `[Floci Seed Error] Could not start the TypeScript seeder: ${result.error.message}`
    );
    process.exitCode = 1;
  } else if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

function getComposeCommand(composeArgs) {
  const dockerArgs = ['compose', '-f', COMPOSE_FILE, ...composeArgs];
  const hasNativeCompose =
    process.platform !== 'win32' ||
    spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' }).status === 0;

  if (hasNativeCompose) {
    return { command: 'docker', args: dockerArgs };
  }

  const wslComposeFile = COMPOSE_FILE.replace(
    /^([A-Za-z]):\\/,
    (_, drive) => `/mnt/${drive.toLowerCase()}/`
  ).replaceAll('\\', '/');

  return {
    command: 'wsl.exe',
    args: ['--', 'docker', 'compose', '-f', wslComposeFile, ...composeArgs],
  };
}

async function handleUp() {
  console.log('===============================================================');
  console.log('       Floci Local Cloud Orchestrator (Dual-Mode)             ');
  console.log('===============================================================\n');

  const hasDocker = isDockerRunning();

  if (hasDocker) {
    console.log('[Mode: Docker Compose] Active Docker engine detected.');
    console.log('[Mode: Docker Compose] Starting Floci container with full 11-service parity...');

    const { command, args } = getComposeCommand(['up', '-d']);
    const upProcess = spawn(command, args, { stdio: 'inherit' });

    upProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`[Error] Docker compose failed with exit code ${code}`);
        process.exit(code);
      }

      console.log('\n[Floci Health] Waiting for Floci gateway on port 4566...');
      const healthy = await checkHealth();

      if (healthy) {
        console.log('\n✅ Floci is READY on port 4566!');
        console.log('   - AWS Gateway: http://localhost:4566');
        console.log('   - Aurora PostgreSQL: localhost:5432 (database: enterprise_db)');
        console.log('   - Resource seeding is manual: run "pnpm floci:seed" when ready.\n');
      } else {
        console.warn('⚠️ Floci did not respond in time. Check logs using: pnpm floci:logs\n');
      }
    });
  } else {
    console.warn('[Notice] Docker engine is NOT detected on this machine.');
    const hasCli = isFlociCliAvailable();

    if (hasCli) {
      console.log('[Mode: Native Floci CLI] Found "floci" executable in system PATH.');
      console.log('[Mode: Native Floci CLI] Starting in-process services...');
      console.log('   -> S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS are active.');
      console.log('   -> Lambda: Run "pnpm dev:lambda" for direct Node.js execution.');
      console.log('   -> Aurora: Connect to a local PostgreSQL instance at localhost:5432.\n');

      const cliProcess = spawn('floci', ['start'], { stdio: 'inherit', detached: true });
      cliProcess.unref();

      console.log('[Floci Health] Waiting for Floci CLI on port 4566...');
      const healthy = await checkHealth();

      if (healthy) {
        console.log('\n✅ Floci CLI is running on http://localhost:4566!');
        console.log('   -> Resource seeding is manual: run "pnpm floci:seed" when ready.');
      } else {
        console.warn('⚠️ Floci CLI did not respond in time.');
      }
    } else {
      console.error('\n❌ Neither Docker nor Floci CLI is available on your machine.\n');
      console.log('Please choose one of the following options to enable the local cloud:');
      console.log('-------------------------------------------------------------------');
      console.log('Option 1 (Recommended for full 11-service parity):');
      console.log('   Install Docker Desktop, Rancher Desktop, or Podman Desktop.');
      console.log('   Download: https://www.docker.com/products/docker-desktop/');
      console.log('             https://rancherdesktop.io/');
      console.log('             https://podman-desktop.io/\n');
      console.log('Option 2 (Native lightweight CLI mode - no Docker required):');
      console.log('   Windows (PowerShell): iwr https://floci.io/install.ps1 | iex');
      console.log('   macOS / Linux:        curl -fsSL https://floci.io/install.sh | sh\n');
      process.exit(1);
    }
  }
}

function handleDown() {
  if (isDockerRunning()) {
    console.log('[Floci Down] Stopping Docker compose...');
    const { command, args } = getComposeCommand(['down']);
    spawnSync(command, args, { stdio: 'inherit' });
  }

  if (isFlociCliAvailable()) {
    console.log('[Floci Down] Stopping Floci CLI if running...');
    spawnSync('floci', ['stop'], { stdio: 'ignore' });
  }

  console.log('✅ Floci stopped successfully.');
}

function handleLogs() {
  if (isDockerRunning()) {
    const { command, args } = getComposeCommand(['logs', '-f']);
    spawn(command, args, { stdio: 'inherit' });
  } else if (isFlociCliAvailable()) {
    spawn('floci', ['logs'], { stdio: 'inherit' });
  } else {
    console.error('No running Floci instance found.');
  }
}

function handleDoctor() {
  console.log('===============================================================');
  console.log('                Floci Environment Diagnostics                  ');
  console.log('===============================================================\n');

  console.log(`OS:               ${process.platform} (${process.arch})`);
  console.log(`Node.js:          ${process.version}`);
  console.log(`Docker Running:   ${isDockerRunning() ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Floci CLI Found:  ${isFlociCliAvailable() ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Compose File:     ${COMPOSE_FILE}`);
  console.log(`Floci Endpoint:   ${FLOCI_ENDPOINT}`);
  console.log(`Seeder:           ${path.resolve(FLOCI_DIR, 'src/seed/index.ts')}\n`);
}

switch (action) {
  case 'up':
    handleUp();
    break;
  case 'down':
    handleDown();
    break;
  case 'logs':
    handleLogs();
    break;
  case 'seed':
    runSeed();
    break;
  case 'doctor':
    handleDoctor();
    break;
  default:
    console.log(`Unknown action: ${action}. Use: up, down, logs, seed, doctor`);
}
