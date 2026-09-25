#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLOCI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$FLOCI_DIR/docker-compose.yml"

echo "[Floci Down] Stopping Floci services..."

if docker info >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" down
fi

if command -v floci >/dev/null 2>&1; then
  floci stop 2>/dev/null || true
fi

echo "✅ Floci stopped successfully."
