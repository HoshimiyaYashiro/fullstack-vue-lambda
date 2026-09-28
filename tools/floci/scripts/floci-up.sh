#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLOCI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$FLOCI_DIR/docker-compose.yml"

echo "==============================================================="
echo "       Floci Local Cloud Orchestrator (Unix / Dual-Mode)       "
echo "==============================================================="
echo ""

if docker info >/dev/null 2>&1; then
  echo "[Mode: Docker Compose] Active Docker engine detected."
  echo "[Mode: Docker Compose] Starting Floci container with full 11-service parity..."

  docker compose -f "$COMPOSE_FILE" up -d

  echo ""
  echo "[Floci Health] Probing gateway at http://localhost:4566..."
  for i in {1..25}; do
    sleep 1
    if curl -s http://localhost:4566 >/dev/null 2>&1; then
      echo ""
      echo "✅ Floci is UP and running on port 4566!"
      echo "   - AWS Endpoint:       http://localhost:4566"
      echo "   - Aurora PostgreSQL:  localhost:5432 (enterprise_db)"
      echo "   - Manual init:        Run 'pnpm floci:seed' when ready"
      echo ""
      exit 0
    fi
  done
  echo "⚠️ Floci did not respond within 25 seconds. Run 'pnpm floci:logs' to inspect."
else
  echo "[Notice] Docker daemon is NOT running."

  if command -v floci >/dev/null 2>&1; then
    echo "[Mode: Native Floci CLI] Found 'floci' binary in PATH."
    echo "[Mode: Native Floci CLI] Launching in-process services (S3, DynamoDB, Cognito, EventBridge, CloudWatch, SES, SNS)..."
    echo "[Notice] For Lambda: use 'pnpm dev:lambda' for direct Node.js execution."
    echo "[Notice] For Aurora: ensure local PostgreSQL is running on port 5432."
    echo ""

    floci start &
    sleep 3
    echo "✅ Floci CLI started on http://localhost:4566."
  else
    echo ""
    echo "❌ Neither Docker nor the Floci CLI was found on this system."
    echo ""
    echo "To install Docker / Podman Desktop (Full 11-service parity):"
    echo "   https://podman-desktop.io/ or https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "To install Floci CLI (Lightweight, No-Docker mode):"
    echo "   Run: curl -fsSL https://floci.io/install.sh | sh"
    echo ""
    exit 1
  fi
fi
