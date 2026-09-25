#!/bin/bash
set -e

echo "[Floci Init] Initializing Amazon Aurora (PostgreSQL Serverless v2 emulation)..."

PG_HOST="${POSTGRES_HOST:-localhost}"
PG_PORT="${POSTGRES_PORT:-5432}"
PG_USER="${POSTGRES_USER:-postgres}"
PG_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
PG_DB="${POSTGRES_DB:-enterprise_db}"

if command -v psql >/dev/null 2>&1; then
  export PGPASSWORD="$PG_PASSWORD"
  echo "  -> Verifying PostgreSQL connection at $PG_HOST:$PG_PORT/$PG_DB..."
  if psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c '\q' 2>/dev/null; then
    echo "  -> Connected to PostgreSQL. Applying foundational multi-tenant schema..."
    psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" << 'EOF'
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  cognito_sub VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed foundational records
INSERT INTO tenants (id, name, status) 
VALUES ('tenant_1', 'Enterprise Tenant 1', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, cognito_sub, email, role)
VALUES 
  ('usr_operator', NULL, 'sub_operator_local', 'operator@enterprise.local', 'OPERATOR'),
  ('usr_tenant_admin', 'tenant_1', 'sub_admin_tenant1_local', 'admin@tenant1.local', 'TENANT_ADMIN'),
  ('usr_consumer', 'tenant_1', 'sub_user_tenant1_local', 'user@tenant1.local', 'USER')
ON CONFLICT (id) DO NOTHING;
EOF
    echo "  -> Aurora PostgreSQL schema initialized."
  else
    echo "  -> [Notice] PostgreSQL is not yet accepting connections on $PG_HOST:$PG_PORT. Will retry on demand."
  fi
else
  echo "  -> [Notice] psql client not installed on host. Database will be seeded via Drizzle ORM migrations."
fi

echo "[Floci Init] Aurora initialization step completed."
