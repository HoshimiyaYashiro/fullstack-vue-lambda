# Floci Local Cloud Environment (`tools/floci`)

This directory provides the local cloud test harness for emulating **11 core AWS services** offline using **Floci**, designed with dual-mode execution for teams with or without Docker.

---

## 1. Dual-Mode Architecture

| Feature | Mode 1: Docker Compose (Recommended) | Mode 2: Native Floci CLI (Lightweight) |
|---|---|---|
| **Prerequisites** | Docker Desktop, Rancher Desktop, or Podman Desktop | `floci` CLI executable installed on host |
| **AWS Services (In-Process)** | S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS | S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS |
| **Stateful Services (Containerized)** | **AWS Lambda, Aurora PostgreSQL, ECS Fargate** | **Requires local alternatives** (Node.js for Lambda, native PostgreSQL) |
| **Seeding Mechanism** | Manual init scripts via `pnpm floci:seed` | Executed via `pnpm floci:seed` against `http://localhost:4566` |
| **Ports** | `4566` (AWS wire protocol), `5432` (PostgreSQL) | `4566` (AWS wire protocol) |

---

## 2. Quick Start

### Starting the Local Cloud
Start Floci from the repository root, then seed explicitly when you want the development resources:

```bash
pnpm floci:up
pnpm floci:seed
```

* **If Docker is running**: Starts `floci/floci:latest-compat` and mounts init scripts outside Floci's automatic hook directories. Init runs only when you execute `pnpm floci:seed`.
* **If Docker is NOT running**: Detects `floci` binary on the host and boots in-process services without seeding. Run `pnpm floci:seed` separately when ready.
* **If neither is installed**: Prints direct installation links for both options.

### Common Commands

| Command | Action |
|---|---|
| `pnpm floci:up` | Boots Floci in Docker or CLI mode and waits for health |
| `pnpm floci:down` | Gracefully terminates Floci containers or background process |
| `pnpm floci:seed` | Manually runs all init scripts; uses the shell scripts in Docker mode and the Node.js seeder in native CLI mode |
| `pnpm floci:logs` | Streams live container logs or CLI output |
| `pnpm floci:doctor` | Performs health and environment diagnostics |

---

## 3. Emulated AWS Services & Ports

* **AWS Endpoint**: `http://localhost:4566`
* **Region**: `ap-southeast-1`
* **Credentials**: Access Key `test`, Secret Key `test`
* **Aurora PostgreSQL**: `localhost:5432` (database: `enterprise_db`, user: `postgres`, password: `postgres`)

---

## 4. Manual Initialization (`tools/floci/init/`)

These scripts do not execute at startup. Run `pnpm floci:seed` from the repository root to execute them sequentially:

1. `01-init-s3.sh`: Creates `enterprise-public-assets`, `enterprise-private-uploads`, `enterprise-export-reports` with CORS.
2. `02-init-dynamodb.sh`: Provisions `enterprise-app-table` (with GSI1 & Streams) and `enterprise-audit-logs` (with TTL).
3. `03-init-cognito.sh`: Provisions separate `enterprise-admin-user-pool` and `enterprise-user-pool` pools with their own public clients; `Operator` and `TenantAdmin` accounts go to the admin pool, while `User` accounts go to the user pool.
4. `04-init-sns-sqs.sh`: Provisions SNS FIFO and Standard topics, DLQ, and worker queues.
5. `05-init-eventbridge.sh`: Provisions `enterprise-event-bus` and event routing rules.
6. `06-init-ses.sh`: Verifies mock email identities and registers `OtpVerificationTemplate`.
7. `07-init-cloudwatch.sh`: Configures log groups with 7-day retention.
8. `08-init-aurora.sh`: Ensures database exists and applies foundational tenant/user schema.
9. `09-init-fargate.sh`: Registers ECS cluster and worker task definition.
10. `10-init-gateway.sh`: Provisions HTTP API v2 with CORS rules.
