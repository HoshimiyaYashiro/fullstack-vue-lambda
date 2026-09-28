# Floci Local Cloud Environment (`tools/floci`)

This directory provides the local cloud test harness for emulating **11 core AWS services** offline using **Floci**, designed with dual-mode execution for teams with or without Docker.

---

## 1. Dual-Mode Architecture

| Feature | Mode 1: Docker Compose (Recommended) | Mode 2: Native Floci CLI (Lightweight) |
|---|---|---|
| **Prerequisites** | Docker Desktop, Rancher Desktop, or Podman Desktop | `floci` CLI executable installed on host |
| **AWS Services (In-Process)** | S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS | S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS |
| **Stateful Services (Containerized)** | **AWS Lambda, Aurora PostgreSQL, ECS Fargate** | **Requires local alternatives** (Node.js for Lambda, native PostgreSQL) |
| **Seeding Mechanism** | Manual TypeScript seeder via `pnpm floci:seed` | Manual TypeScript seeder via `pnpm floci:seed` |
| **Ports** | `4566` (AWS wire protocol), `5432` (PostgreSQL) | `4566` (AWS wire protocol) |

---

## 2. Quick Start

### Starting the Local Cloud
Start Floci from the repository root, then seed explicitly when you want the development resources:

```bash
pnpm floci:up
pnpm floci:seed
```

* **If Docker is running**: Starts `floci/floci:latest-compat`. Resource seeding remains a separate manual step.
* **If Docker is NOT running**: Detects the `floci` binary on the host and boots in-process services without seeding. Run `pnpm floci:seed` separately when ready.
* **If neither is installed**: Prints direct installation links for both options.

### Common Commands

| Command | Action |
|---|---|
| `pnpm floci:up` | Boots Floci in Docker or CLI mode and waits for health |
| `pnpm floci:down` | Gracefully terminates Floci containers or background process |
| `pnpm floci:seed` | Manually runs the same TypeScript/AWS SDK seeder against the active Floci endpoint in either mode |
| `pnpm floci:logs` | Streams live container logs or CLI output |
| `pnpm floci:doctor` | Performs health and environment diagnostics |

---

## 3. Emulated AWS Services & Ports

* **AWS Endpoint**: `http://localhost:4566`
* **Region**: `ap-southeast-1`
* **Credentials**: Access Key `test`, Secret Key `test`
* **Aurora PostgreSQL**: `localhost:5432` (database: `enterprise_db`, user: `postgres`, password: `postgres`)

---

## 4. Seeder Configuration

The shared configuration is in `tools/floci/.env.floci`. Copy the example values when setting up a new environment, then edit endpoint, database, and resource names as needed. Environment variables already set by the shell take precedence.

The TypeScript seeder lives in `tools/floci/src/seed/`, with one module per service and a shared CLI in `tools/floci/src/seed/index.ts`. It uses AWS SDK v3 for Floci services plus `@repo/database` for PostgreSQL migrations. `pnpm floci:up` never seeds automatically; developers explicitly run a seed command after Floci is ready.

```bash
pnpm floci:seed                         # Seed all services
pnpm floci:seed -- cognito              # Seed one service
pnpm floci:seed -- s3 cognito database  # Seed multiple services
pnpm floci:seed -- --help               # List available services
```

Available service selectors: `s3`, `dynamodb`, `cognito`, `sns-sqs`, `eventbridge`, `ses`, `cloudwatch`, `ecs`, `api-gateway`, and `database`.
