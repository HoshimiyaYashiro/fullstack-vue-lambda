#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing Amazon EventBridge..."

EVENT_BUS_NAME="enterprise-event-bus"

# 1. Create Custom Event Bus
if ! $AWS events describe-event-bus --name "$EVENT_BUS_NAME" 2>/dev/null; then
  echo "  -> Creating custom EventBus: $EVENT_BUS_NAME..."
  $AWS events create-event-bus --name "$EVENT_BUS_NAME"
else
  echo "  -> EventBus $EVENT_BUS_NAME already exists."
fi

# 2. Create Event Rule for Domain Events
echo "  -> Creating rule: enterprise-domain-events-rule..."
$AWS events put-rule \
  --name "enterprise-domain-events-rule" \
  --event-bus-name "$EVENT_BUS_NAME" \
  --event-pattern '{"source": [{"prefix": "enterprise."}]}' \
  --state ENABLED 2>/dev/null || true

echo "[Floci Init] EventBridge initialization completed successfully."
