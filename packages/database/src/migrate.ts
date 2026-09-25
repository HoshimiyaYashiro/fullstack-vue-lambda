import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { type DatabaseConfig, resolveDatabaseOptions } from './client.js';

// Auto-load .env during local CLI migration executions if variables are not yet loaded
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL && !process.env.DB_HOST) {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../worker-lambda/.env'),
    path.resolve(process.cwd(), 'apps/worker-lambda/.env'),
    path.resolve(process.cwd(), 'tools/floci/.env.floci'),
  ];
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
      process.loadEnvFile?.(candidate);
      break;
    }
  }
}

export async function runMigrations(configOrUrl?: string | DatabaseConfig) {
  const customConfig: DatabaseConfig | undefined =
    typeof configOrUrl === 'string' ? { connectionString: configOrUrl } : configOrUrl;

  const { connectionString, options } = resolveDatabaseOptions(customConfig, {
    max: 1,
    connectTimeout: 10,
  });

  console.log(
    'Connecting to PostgreSQL database at:',
    connectionString
      ? connectionString.replace(/:[^:@]+@/, ':****@')
      : `${options.host}:${options.port}/${options.database}`
  );

  const sql = connectionString ? postgres(connectionString, options) : postgres(options);

  try {
    console.log('Applying database schema for Aurora PostgreSQL...');

    await sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(128) NOT NULL UNIQUE,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'user',
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64),
        user_id VARCHAR(64),
        action VARCHAR(128) NOT NULL,
        entity VARCHAR(128) NOT NULL,
        entity_id VARCHAR(128),
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Seed default tenant
    await sql`
      INSERT INTO tenants (id, name, slug, status)
      VALUES ('tenant_1', 'Enterprise Global', 'enterprise-global', 'active')
      ON CONFLICT (id) DO NOTHING;
    `;

    // Seed default users
    await sql`
      INSERT INTO users (id, tenant_id, email, full_name, role, status)
      VALUES 
        ('user_operator', 'tenant_1', 'operator@enterprise.local', 'System Operator', 'admin', 'active'),
        ('user_admin', 'tenant_1', 'admin@tenant1.local', 'Tenant Administrator', 'admin', 'active'),
        ('user_standard', 'tenant_1', 'user@tenant1.local', 'Standard User', 'user', 'active')
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log('✅ PostgreSQL Schema and initial seeds successfully applied!');
  } catch (err: unknown) {
    console.error('❌ Migration failed:', (err as Error).message);
    throw err;
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
