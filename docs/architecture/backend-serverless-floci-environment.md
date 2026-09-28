# Enterprise Serverless Backend Architecture & Floci Local Cloud Environment

This document defines the architecture, repository layout, and local emulation harness for developing and testing the serverless backend across **11 core AWS services** using **Floci** within this application source repository.

---

## 1. Architectural Boundaries & Repository Scope

> [!IMPORTANT]
> **Separation of Concerns: Application Code vs. Cloud Infrastructure**
> - **External Infrastructure Repository**: Production and staging AWS Cloud infrastructure (AWS CDK / Terraform pipelines, VPCs, IAM roles, production Aurora clusters, Route53, and CI/CD deployment stacks) resides in a dedicated, external infrastructure repository.
> - **This Application Repository (`fullstack-vue-lambda`)**: Exclusively houses application source code (frontends, serverless Lambda handlers, worker tasks, shared packages) and a **self-contained local cloud emulation harness (`tools/floci/`)** designed for developer ergonomics, offline testing, and local integration verification.

### 1.1 Objective
Establish a lightweight, high-fidelity local cloud test harness that allows developers to write and test code against all 11 target AWS services locally without requiring cloud account credentials, cloud spend, or an active connection to AWS.

### 1.2 Local Cloud Emulator: Floci (`floci/floci:latest-compat`)
- **Technology**: Native GraalVM & Quarkus microservice architecture.
- **Port**: Standard AWS wire protocol on port `4566`.
- **Aurora/PostgreSQL Port**: Mapped directly to port `5432` for local DB clients and ORM tooling.
- **Docker Engine Integration**: Native Docker socket binding (`/var/run/docker.sock`) enabling real containerized execution for AWS Lambda and Fargate tasks.
- **Zero Overhead**: ~24ms startup time, ~13MB idle RAM, MIT licensed, zero telemetry, zero auth tokens.

### 1.3 Target AWS Services Under Local Emulation

| # | AWS Service | Local Role in This Repo | Floci Emulation Behavior |
|---|---|---|---|
| 1 | **API Gateway** | HTTP API v2 entrypoint for frontend requests | Simulates routes, CORS headers, and Cognito JWT authorizer verification |
| 2 | **AWS Lambda** | Node.js 20 ESM serverless functions | Executed in local container or direct hot-reload Node.js process |
| 3 | **EventBridge** | Custom Event Bus (`app-event-bus`) | Simulates asynchronous domain event publishing and target rule routing |
| 4 | **AWS Fargate (ECS)** | Containerized background worker tasks | Simulates batch execution via Docker runner for long-running jobs |
| 5 | **Amazon Aurora** | Multi-tenant relational persistence | PostgreSQL 16 container with Drizzle ORM migrations and seed data |
| 6 | **DynamoDB** | NoSQL single-table storage & audit logs | Local DynamoDB engine with GSI support and event stream triggers |
| 7 | **CloudWatch** | Centralized logging and metrics | Collects log streams for Lambda, Fargate, and API Gateway |
| 8 | **Amazon SES** | Mock transactional email & OTP service | Simulates identity verification, template rendering, and intercepts emails |
| 9 | **Amazon SNS** | Pub/Sub messaging topics | Fanout to SQS queues, Lambda functions, and mock email alerts |
| 10 | **Amazon S3** | Object storage buckets & pre-signed URLs | Media uploads, public CDN assets, and temporary export storage |
| 11 | **Amazon Cognito** | Authentication directory & JWT issuance | User Pool, App Clients (SPA), custom tenant attributes, and seed accounts |

---

## 2. Monorepo Structural Blueprint

The repository remains cleanly focused on application code, with local cloud fixtures isolated inside `tools/floci/`:

```
fullstack-vue-lambda/
├── apps/
│   ├── admin-web/                     # Back-office admin portal (Vue 3 + Naive UI)
│   ├── user-web/                      # Customer-facing web portal (Vue 3 + Naive UI)
│   ├── worker-lambda/                    # Serverless AWS Lambda backend handlers
│   │   ├── src/
│   │   │   ├── core/                  # Core utilities & isomorphic AWS SDK client factory
│   │   │   │   ├── aws-clients.ts     # SDK v3 client factory (auto-targets Floci if local)
│   │   │   │   ├── errors.ts
│   │   │   │   ├── response.ts
│   │   │   │   └── types.ts
│   │   │   ├── db/                    # Aurora PostgreSQL (Drizzle ORM)
│   │   │   │   ├── schema/            # Database schema definitions (tenants, users, etc.)
│   │   │   │   ├── client.ts          # Serverless connection pool (max: 1, prepare: false)
│   │   │   │   └── migrations/        # Drizzle SQL migration files
│   │   │   ├── handlers/              # Thin Lambda entrypoints
│   │   │   │   ├── admin/             # Admin management handlers
│   │   │   │   ├── auth/              # Authentication & OTP handlers
│   │   │   │   ├── events/            # EventBridge and DynamoDB stream handlers
│   │   │   │   ├── users/             # User domain handlers
│   │   │   │   └── health.ts          # Health probe handler
│   │   │   ├── middleware/            # Auth, tenant context, CORS, error handling
│   │   │   ├── modules/               # Domain services and repositories
│   │   │   └── local-server.ts        # Instant local HTTP dev server (tsx hot-reload)
│   │   ├── tsup.config.ts             # ESM bundle config for Lambda handlers
│   │   └── package.json
│   └── worker-fargate/                # (Optional) Containerized ECS Fargate background worker
│       ├── src/
│       │   ├── index.ts               # Worker entrypoint (SQS/EventBridge consumer / batch job)
│       │   └── tasks/                 # Background task implementations
│       ├── Dockerfile                 # Distroless or Alpine Node.js 20 container image
│       ├── tsconfig.json
│       └── package.json
│
├── tools/                             # Developer Tooling & Local Test Harness
│   └── floci/                         # Floci Local Cloud Emulation Engine
│       ├── docker-compose.yml         # Floci container definition & volume bindings
│       ├── .env.floci                 # Environment defaults for local AWS emulation
│       ├── package.json               # @repo/floci-tooling workspace package
│       ├── src/
│       │   ├── config.ts              # Shared Floci and seed configuration
│       │   └── seed.ts                # Manual AWS SDK and PostgreSQL seeder
│       ├── scripts/
│       │   └── floci-runner.mjs       # Cross-platform Docker/CLI lifecycle runner
│       └── data/                      # Persistent storage volume (gitignored)
│
├── packages/
│   ├── api-client/                    # TanStack Query SDK for Vue apps
│   ├── shared/                        # Schemas, DTOs, domain models, and constants
│   ├── tsconfig/                      # Shared TSConfigs (base.json, node.json, vue.json)
│   └── ui/                            # Shared design system components
│
├── docs/
│   └── architecture/
│       └── backend-serverless-floci-environment.md # This architecture specification
│
├── biome.json
├── package.json                       # Monorepo root scripts (floci:up, floci:down, dev:all, etc.)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 3. Floci Local Cloud Setup (`tools/floci/`)

### 3.1 Docker Compose (`tools/floci/docker-compose.yml`)

```yaml
version: '3.8'

services:
  floci:
    container_name: enterprise-floci
    image: floci/floci:latest-compat
    ports:
      - '4566:4566'            # Standard AWS wire-protocol gateway
      - '5432:5432'            # Direct Aurora PostgreSQL port mapping
    environment:
      - FLOCI_STORAGE_MODE=persistent
      - FLOCI_SERVICES_LAMBDA_HOT_RELOAD_ENABLED=true
      - DOCKER_HOST=unix:///var/run/docker.sock
      - AWS_DEFAULT_REGION=ap-southeast-1
      - DEFAULT_REGION=ap-southeast-1
      - LAMBDA_EXECUTOR=docker
      - LAMBDA_DOCKER_NETWORK=enterprise-network
      - POSTGRES_PORT=5432
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=enterprise_db
      - DEBUG=1
    volumes:
      # Docker socket required for Lambda and Fargate container runners
      - /var/run/docker.sock:/var/run/docker.sock
      # Floci persistence layer
      - ./data:/app/data
    networks:
      - enterprise-network

networks:
  enterprise-network:
    name: enterprise-network
    driver: bridge
```

### 3.2 Manual Startup & Seeding (`tools/floci/`)

`pnpm floci:up` starts Floci through Docker Compose when Docker is available, or through the native Floci CLI otherwise. It waits for the gateway health check and does not create development resources.

After Floci is running, `pnpm floci:seed` checks the configured endpoint and invokes the same TypeScript seeder in both modes. The seeder uses AWS SDK v3 for emulated AWS services and `@repo/database` for PostgreSQL schema and sample data. Configuration is loaded from `tools/floci/.env.floci`, with existing shell environment variables taking precedence. No Bash, PowerShell, or Floci startup hook is used for initialization.

---

## 4. Application Integration & Zero-Contamination Architecture

### 4.1 Isomorphic AWS Client Factory (`apps/worker-lambda/src/core/aws-clients.ts`)

Application code remains 100% agnostic to whether it is running on a developer's machine with Floci or deployed into production AWS. The SDK client factory detects local execution via `AWS_ENDPOINT_URL`:

```typescript
// apps/worker-lambda/src/core/aws-clients.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { SNSClient } from '@aws-sdk/client-sns';
import { SESClient } from '@aws-sdk/client-ses';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.NODE_ENV !== 'production' && !!process.env.AWS_ENDPOINT_URL;

const baseConfig = {
  region: process.env.AWS_REGION || 'ap-southeast-1',
  ...(isLocal && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  }),
};

export const s3Client = new S3Client(baseConfig);
export const eventBridgeClient = new EventBridgeClient(baseConfig);
export const snsClient = new SNSClient(baseConfig);
export const sesClient = new SESClient(baseConfig);
export const cognitoClient = new CognitoIdentityProviderClient(baseConfig);

const rawDynamoClient = new DynamoDBClient(baseConfig);
export const dynamoDocClient = DynamoDBDocumentClient.from(rawDynamoClient, {
  marshallOptions: { removeUndefinedValues: true },
});
```

### 4.2 Aurora PostgreSQL Connection Configuration (`apps/worker-lambda/src/db/client.ts`)

```typescript
// apps/worker-lambda/src/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/enterprise_db';

// Optimized for Serverless execution (Aurora Serverless v2 / RDS Proxy parity)
const sql = postgres(connectionString, {
  max: 1, // Single connection per Lambda container to prevent connection saturation
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Essential for compatibility with AWS RDS Proxy
});

export const db = drizzle(sql, { schema });
```

### 4.3 Modular Lambda Handler Bundler & Multi-Layer Architecture

AWS Lambda supports attaching **up to 5 distinct layers** per function. Bundling all dependencies into a single monolithic layer is suboptimal because:
- Handlers that only do simple logic or S3 operations do not need the heavy database driver (`postgres` + `drizzle-orm`).
- Frequent changes to domain models (`@repo/shared`) would invalidate and require re-uploading a massive 11+ MB layer.
- Caching on AWS execution environments is per-layer; smaller, decoupled layers reduce cold starts and drastically speed up CI/CD deployments.

The monorepo provides a **Modular Multi-Layer Architecture**:

1. **`shared-layer.zip` (`enterprise-shared-layer`)**:
   - Contains: `@repo/shared` isomorphic compiled package and `zod` runtime validator.
   - Size: ~874 KB (uncompressed: 3.4 MB).
   - Target Functions: **All handlers**. Build time: **<6 seconds**.
   - Built via: `pnpm build:lambda:layer shared`

2. **`database-layer.zip` (`enterprise-database-layer`)**:
   - Contains: Aurora PostgreSQL Serverless v2 driver (`postgres.js`) and `drizzle-orm`.
   - Size: ~3.32 MB (uncompressed: 10.3 MB).
   - Target Functions: Only handlers querying the relational database (`auth/login`, `users/get-profile`, `admin/list-users`).
   - Built via: `pnpm build:lambda:layer database`

3. **`aws-sdk-layer.zip` (`enterprise-aws-sdk-layer`)**:
   - Contains: Modular `@aws-sdk/client-*` and `@aws-sdk/lib-dynamodb`.
   - Target Functions: Handlers requiring specific AWS SDK client versions beyond the Lambda runtime defaults.
   - Built via: `pnpm build:lambda:layer aws-sdk`

4. **Custom Code Layers (`apps/worker-lambda/src/layers/`)**:
   - Developers can create arbitrary custom layers by adding a folder containing `index.ts` in `src/layers/<layer-name>/`.
   - Mapped automatically in `tsconfig.json` under path alias `@layers/*` (instant hot-reloading during local dev).
   - Bundled by `tsup` and zipped into `dist/layers/<layer-name>-layer.zip` in **~0.3 seconds**.
   - Built via: `pnpm build:lambda:layer <layer-name>` (e.g. `pnpm build:lambda:layer error-handler`, `pnpm build:lambda:layer role-guard`).
   - Included implementations:
     - `src/layers/error-handler/`: Standard `AppError`, `ValidationError`, `NotFoundError`, and error response formatters (~3.2 KB).
     - `src/layers/role-guard/`: Authorization guards (`requireRole`, `requireAdmin`, `assertAuthenticated`) (~3.6 KB).

5. **`common-layer.zip` (`enterprise-common-layer`)**:
   - Monolithic all-in-one layer containing all dependencies for convenience during initial onboarding.
   - Built via: `pnpm build:lambda:layer common`

6. **Modular Handler Bundling (`dist/zips/<handler>.zip`)**:
   - Built natively via `tsup` with dynamic entry discovery in `src/handlers/**/*.ts`.
   - Externalizes layer dependencies (`@layers/*`, `@repo/shared`, `@aws-sdk/*`, database drivers), keeping individual handler zips between **4.7 KB and 15 KB**.
   - Built via:
     - Specific handler: `pnpm build:lambda:handler <name>` (e.g. `health`, `auth/login`)
     - All handlers: `pnpm build:lambda:handlers`

---

## 5. Developer Workflows & Turborepo Scripts

Integration into the root `package.json` gives developers single-command workflows:

| Command | Action |
|---|---|
| `pnpm floci:up` | Boots Floci container or native CLI and runs seed hooks |
| `pnpm floci:down` | Gracefully shuts down Floci |
| `pnpm floci:logs` | Streams live logs from Floci services |
| `pnpm floci:seed` | Manually runs the shared TypeScript seeder against running Floci |
| `pnpm db:migrate` | Runs Drizzle ORM migrations against Aurora PostgreSQL |
| `pnpm build:lambda` | Builds full Lambda suite (Common Layer + all handlers + ZIPs) |
| `pnpm build:lambda:handlers` | Builds all discovered Lambda handlers |
| `pnpm build:lambda:handler <name>` | Builds a specific Lambda handler (e.g., `auth/login`, `health`) |
| `pnpm build:lambda:layer` | Compiles `@repo/shared` and packages `common-layer.zip` |
| `pnpm dev:lambda` | Starts local Lambda HTTP development server (`http://localhost:4000`) |
| `pnpm dev:fargate` | Starts ECS Fargate background worker (SQS long-polling) |
| `pnpm dev:backend` | Boots Floci and starts Lambda dev server (`http://localhost:4000`) |
| `pnpm dev:all` | Boots Floci + Lambda + Admin Web + User Web concurrently |
| `pnpm test:integration` | Runs test suite against local Floci AWS endpoints |

---

## 6. Implementation Roadmap

### Phase 1: Local Cloud Emulation Harness (`tools/floci/`)
1. Create the `tools/floci` workspace package, Docker Compose configuration, and shared environment config.
2. Create `.env.floci.example` and `.env.floci`.
3. Implement one manual TypeScript/AWS SDK seeder for both Docker Compose and native CLI endpoints.
4. Implement one Node.js host runner for Floci lifecycle commands and health checks.
5. Keep root `package.json` commands (`floci:up`, `floci:down`, `floci:logs`, `floci:seed`) as developer entrypoints.

### Phase 2: Backend SDK & Database Integration (`apps/worker-lambda/`)
1. Add AWS SDK v3 client dependencies (`@aws-sdk/client-*`) to `apps/worker-lambda`.
2. Implement centralized `src/core/aws-clients.ts` supporting `AWS_ENDPOINT_URL`.
3. Set up Drizzle ORM and `postgres.js` in `apps/worker-lambda/src/db/` for Aurora PostgreSQL.
4. Set up database schema (`tenants`, `users`) with migration script.
5. Implement Cognito JWT verification middleware in `apps/worker-lambda/src/middleware/`.

### Phase 3: Fargate Worker Container Setup (`apps/worker-fargate/`)
1. Initialize `apps/worker-fargate` with TypeScript configuration.
2. Implement SQS/EventBridge task consumer worker.
3. Provide Dockerfile and local build script.

### Phase 4: Verification & Integration Testing
1. Boot Floci via `pnpm floci:up` and verify all 11 services respond on port `4566`.
2. Verify Aurora PostgreSQL on port `5432` and apply initial migrations.
3. Execute end-to-end local test flow: Cognito login $\rightarrow$ JWT issued $\rightarrow$ API Gateway / Lambda $\rightarrow$ Aurora / DynamoDB $\rightarrow$ EventBridge event emitted.
4. Verify code formatting and linting with Biome (`pnpm lint`) and TypeScript checks (`pnpm check`).
