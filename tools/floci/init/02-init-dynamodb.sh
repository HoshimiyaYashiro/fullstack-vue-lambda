#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing DynamoDB Tables..."

# 1. Single-Table Design Table
if ! $AWS dynamodb describe-table --table-name "enterprise-app-table" 2>/dev/null; then
  echo "  -> Creating enterprise-app-table with GSI1 & Streams..."
  $AWS dynamodb create-table \
    --table-name enterprise-app-table \
    --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
      AttributeName=GSI1PK,AttributeType=S \
      AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
    --global-secondary-indexes '[
      {
        "IndexName": "GSI1",
        "KeySchema": [
          {"AttributeName": "GSI1PK", "KeyType": "HASH"},
          {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]'
else
  echo "  -> Table enterprise-app-table already exists."
fi

# 2. Audit Logs Table with TTL
if ! $AWS dynamodb describe-table --table-name "enterprise-audit-logs" 2>/dev/null; then
  echo "  -> Creating enterprise-audit-logs table..."
  $AWS dynamodb create-table \
    --table-name enterprise-audit-logs \
    --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
    --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST

  echo "  -> Enabling TTL on enterprise-audit-logs (attribute: ttl)..."
  $AWS dynamodb update-time-to-live \
    --table-name enterprise-audit-logs \
    --time-to-live-specification "Enabled=true,AttributeName=ttl"
else
  echo "  -> Table enterprise-audit-logs already exists."
fi

echo "[Floci Init] DynamoDB initialization completed successfully."
