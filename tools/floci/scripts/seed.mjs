#!/usr/bin/env node

/**
 * Universal Floci Cloud Seeder Proxy
 * Invokes the TypeScript cloud seeder located in apps/worker-lambda/scripts/seed-floci.ts.
 * Runs identically on Windows, macOS, and Linux without needing bash or .sh scripts.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..', '..');

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const res = spawnSync(pnpmCmd, ['--filter=@repo/worker-lambda', 'seed:floci'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(res.status ?? 0);
