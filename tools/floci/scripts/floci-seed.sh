#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLOCI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INIT_DIR="$FLOCI_DIR/init"

echo "==============================================================="
echo "       Floci Local Cloud Seeder (Unix / Bash)                  "
echo "==============================================================="
echo ""

if docker inspect -f '{{.State.Running}}' enterprise-floci >/dev/null 2>&1; then
  echo "[Mode: Container Exec] Re-running initialization hooks inside enterprise-floci..."
  for file in "$INIT_DIR"/*.sh; do
    fname=$(basename "$file")
    echo "  -> Running /etc/floci/init/ready.d/$fname..."
    docker exec enterprise-floci /bin/bash "/etc/floci/init/ready.d/$fname"
  done
  echo ""
  echo "✅ All initialization hooks executed inside container."
else
  echo "[Mode: Universal Node.js] Executing seed.mjs via Node.js..."
  node "$SCRIPT_DIR/seed.mjs"
fi
