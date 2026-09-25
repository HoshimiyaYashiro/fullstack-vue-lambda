import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type PostgresDefaultOptions = postgres.Options<Record<string, never>>;

/**
 * Flexible Database Configuration
 * Supports connection via full URI or discrete parameters.
 * Automatically accommodates AWS RDS Proxy, SSL/TLS, and connection pooling.
 */
export interface DatabaseConfig {
  /**
   * Direct PostgreSQL connection URI.
   * e.g. 'postgres://user:pass@host:5432/dbname?sslmode=require'
   */
  connectionString?: string;

  /** Discrete connection parameters */
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string | (() => string | Promise<string>);

  /** SSL/TLS configuration (Required for AWS RDS Proxy) */
  ssl?: 'require' | 'allow' | 'prefer' | 'verify-full' | boolean | object;

  /** Connection pooling & timeouts */
  max?: number;
  idleTimeout?: number; // seconds
  connectTimeout?: number; // seconds
  maxLifetime?: number; // seconds (socket recycling, essential for RDS Proxy)
  prepare?: boolean;

  /** Additional driver options passed directly to postgres.js */
  driverOptions?: Partial<PostgresDefaultOptions>;
}

export interface DatabaseClientResult {
  sql: postgres.Sql;
  db: ReturnType<typeof drizzle<typeof schema>>;
}

/**
 * Resolves connection options from explicit config or environment variables (ENV).
 * Strictly adheres to fail-fast: throws if required connection info is absent.
 */
export function resolveDatabaseOptions(
  config?: DatabaseConfig,
  defaults?: Partial<DatabaseConfig>
): { connectionString?: string; options: PostgresDefaultOptions } {
  const merged: DatabaseConfig = {
    ...defaults,
    ...config,
  };

  // 1. Check if direct connection URI is supplied
  const connectionString =
    merged.connectionString || process.env.DATABASE_URL || process.env.POSTGRES_URL;

  // 2. Resolve discrete parameters (support DB_* and POSTGRES_*)
  const host =
    merged.host || process.env.DB_HOST || process.env.POSTGRES_HOST || process.env.RDS_PROXY_HOST;

  const port =
    merged.port ||
    (process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined) ||
    (process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined) ||
    5432;

  const database = merged.database || process.env.DB_NAME || process.env.POSTGRES_DB;

  const user = merged.user || process.env.DB_USER || process.env.POSTGRES_USER;

  const password = merged.password || process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;

  // 3. Fail-fast validation: If neither URI nor (host + database + user) is available
  if (!connectionString && (!host || !database || !user)) {
    throw new Error(
      '[DatabaseConfigError] Incomplete database configuration. ' +
        'Please supply DATABASE_URL or discrete variables (DB_HOST, DB_NAME, DB_USER) ' +
        'in environment variables or DatabaseConfig.'
    );
  }

  // 4. Resolve SSL (automatically enforce 'require' for RDS Proxy or Production)
  const isRDSProxy =
    process.env.DB_IS_RDS_PROXY === 'true' ||
    Boolean(process.env.RDS_PROXY_HOST) ||
    (typeof host === 'string' && host.includes('rds.amazonaws.com'));
  const isProd = process.env.NODE_ENV === 'production';
  const envSsl =
    process.env.DB_SSL === 'true' ? 'require' : process.env.DB_SSL === 'false' ? false : undefined;

  const resolvedSsl =
    merged.ssl !== undefined
      ? merged.ssl
      : envSsl !== undefined
        ? envSsl
        : isRDSProxy || isProd
          ? 'require'
          : false;

  // 5. Pooling & timeouts
  const max =
    merged.max ??
    (process.env.DB_MAX_CONNECTIONS ? Number(process.env.DB_MAX_CONNECTIONS) : undefined);

  const idle_timeout =
    merged.idleTimeout ??
    (process.env.DB_IDLE_TIMEOUT ? Number(process.env.DB_IDLE_TIMEOUT) : undefined);

  const connect_timeout =
    merged.connectTimeout ??
    (process.env.DB_CONNECT_TIMEOUT ? Number(process.env.DB_CONNECT_TIMEOUT) : undefined);

  const max_lifetime =
    merged.maxLifetime ??
    (process.env.DB_MAX_LIFETIME ? Number(process.env.DB_MAX_LIFETIME) : undefined);

  const prepare =
    merged.prepare !== undefined
      ? merged.prepare
      : process.env.DB_PREPARE !== undefined
        ? process.env.DB_PREPARE === 'true'
        : undefined;

  const options: PostgresDefaultOptions = {
    ...(host ? { host } : {}),
    ...(port ? { port } : {}),
    ...(database ? { database } : {}),
    ...(user ? { username: user } : {}),
    ...(password !== undefined ? { password } : {}),
    ssl: resolvedSsl,
    ...(max !== undefined ? { max } : {}),
    ...(idle_timeout !== undefined ? { idle_timeout } : {}),
    ...(connect_timeout !== undefined ? { connect_timeout } : {}),
    ...(max_lifetime !== undefined ? { max_lifetime } : {}),
    ...(prepare !== undefined ? { prepare } : {}),
    ...merged.driverOptions,
  };

  return { connectionString, options };
}

/**
 * Creates an Aurora PostgreSQL client optimized for AWS Lambda (Serverless):
 * - max: 1 connection per execution container by default
 * - prepare: false by default (essential for AWS RDS Proxy & PgBouncer transaction pooling)
 * - idle_timeout: 20s
 * - connect_timeout: 10s
 * - max_lifetime: 1800s (socket recycling, essential for RDS Proxy)
 */
export function createLambdaClient(config?: DatabaseConfig): DatabaseClientResult {
  const { connectionString, options } = resolveDatabaseOptions(config, {
    max: 1,
    prepare: false,
    idleTimeout: 20,
    connectTimeout: 10,
    maxLifetime: 1800,
  });

  const sql = connectionString ? postgres(connectionString, options) : postgres(options);

  return {
    sql,
    db: drizzle(sql, { schema }),
  };
}

/**
 * Creates an Aurora PostgreSQL client optimized for AWS Fargate (Container Worker Daemon):
 * - max: 10 connections pool by default for high-throughput batch processing
 * - prepare: true by default (prepared statements enabled for performance)
 * - idle_timeout: 30s
 * - connect_timeout: 10s
 * - max_lifetime: 1800s
 */
export function createFargateClient(config?: DatabaseConfig): DatabaseClientResult {
  const { connectionString, options } = resolveDatabaseOptions(config, {
    max: 10,
    prepare: true,
    idleTimeout: 30,
    connectTimeout: 10,
    maxLifetime: 1800,
  });

  const sql = connectionString ? postgres(connectionString, options) : postgres(options);

  return {
    sql,
    db: drizzle(sql, { schema }),
  };
}

// Lazy singleton client for convenience: only instantiates on first access
let _singletonClient: DatabaseClientResult | null = null;

function getSingletonClient(): DatabaseClientResult {
  if (!_singletonClient) {
    _singletonClient = createLambdaClient();
  }
  return _singletonClient;
}

export const sql: postgres.Sql = new Proxy({} as postgres.Sql, {
  get(_target, prop) {
    const client = getSingletonClient().sql;
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
  apply(_target, thisArg, argArray) {
    const client = getSingletonClient().sql;
    return Reflect.apply(client as unknown as (...args: unknown[]) => unknown, thisArg, argArray);
  },
});

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop) {
      const client = getSingletonClient().db;
      const value = Reflect.get(client, prop);
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

export type DatabaseInstance = ReturnType<typeof drizzle<typeof schema>>;
