import { runMigrations } from '@repo/database';
import { flociConfig } from '../config.js';

export async function seedDatabase() {
  console.log('[PostgreSQL] Applying schema and sample data...');
  try {
    await runMigrations(flociConfig.databaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  -> PostgreSQL was not seeded: ${message}`);
  }
}
