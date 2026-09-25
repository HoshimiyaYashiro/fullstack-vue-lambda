# Floci Local Cloud Environment (`tools/floci`)

This directory provides the local cloud test harness for emulating **11 core AWS services** offline using **Floci**, designed with dual-mode execution for teams with or without Docker.

---

## 1. Dual-Mode Architecture

| Feature | Mode 1: Docker Compose (Recommended) | Mode 2: Native Floci CLI (Lightweight) |
|---|---|---|
| **Prerequisites** | Docker Desktop, Rancher Desktop, or Podman Desktop | `floci` CLI executable installed on host |
| **AWS Services (In-Process)** | S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS | S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS |
| **Stateful Services (Containerized)** | **AWS Lambda, Aurora PostgreSQL, ECS Fargate** | **Requires local alternatives** (Node.js for Lambda, native PostgreSQL) |
| **Seeding Mechanism** | Automatic boot hooks mounted to `/etc/floci/init/ready.d/` | Executed via `pnpm floci:seed` against `http://localhost:4566` |
| **Ports** | `4566` (AWS wire protocol), `5432` (PostgreSQL) | `4566` (AWS wire protocol) |

---

## 2. Quick Start

### Starting the Local Cloud
Run the cross-platform runner script from the root of the repository:

```bash
pnpm floci:up
```

* **If Docker is running**: Automatically spins up `floci/floci:latest-compat` container, mounts the Docker socket, and executes the 10 initialization scripts.
* **If Docker is NOT running**: Detects `floci` binary on the host, boots in-process services, and prints guidance for running local Node.js Lambda execution.
* **If neither is installed**: Prints direct installation links for both options.

### Common Commands

| Command | Action |
|---|---|
| `pnpm floci:up` | Boots Floci in Docker or CLI mode and waits for health |
| `pnpm floci:down` | Gracefully terminates Floci containers or background process |
| `pnpm floci:seed` | Runs the universal Node.js seeder (`seed.mjs`) against `http://localhost:4566` |
| `pnpm floci:logs` | Streams live container logs or CLI output |
| `pnpm floci:doctor` | Performs health and environment diagnostics |

---

## 3. Emulated AWS Services & Ports

* **AWS Endpoint**: `http://localhost:4566`
* **Region**: `ap-southeast-1`
* **Credentials**: Access Key `test`, Secret Key `test`
* **Aurora PostgreSQL**: `localhost:5432` (database: `enterprise_db`, user: `postgres`, password: `postgres`)

---

## 4. Initialization Hooks (`tools/floci/init/`)

The following scripts execute sequentially upon startup:

1. `01-init-s3.sh`: Creates `enterprise-public-assets`, `enterprise-private-uploads`, `enterprise-export-reports` with CORS.
2. `02-init-dynamodb.sh`: Provisions `enterprise-app-table` (with GSI1 & Streams) and `enterprise-audit-logs` (with TTL).
3. `03-init-cognito.sh`: Provisions `enterprise-user-pool`, `enterprise-web-client`, security groups (`Operator`, `TenantAdmin`, `User`), and test accounts (`operator@enterprise.local`, `admin@tenant1.local`).
4. `04-init-sns-sqs.sh`: Provisions SNS FIFO and Standard topics, DLQ, and worker queues.
5. `05-init-eventbridge.sh`: Provisions `enterprise-event-bus` and event routing rules.
6. `06-init-ses.sh`: Verifies mock email identities and registers `OtpVerificationTemplate`.
7. `07-init-cloudwatch.sh`: Configures log groups with 7-day retention.
8. `08-init-aurora.sh`: Ensures database exists and applies foundational tenant/user schema.
9. `09-init-fargate.sh`: Registers ECS cluster and worker task definition.
10. `10-init-gateway.sh`: Provisions HTTP API v2 with CORS rules.
