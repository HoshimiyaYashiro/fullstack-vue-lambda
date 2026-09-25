import { runMigrations } from '@repo/database';

if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export * from '@repo/database';
