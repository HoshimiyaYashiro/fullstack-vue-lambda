#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing Amazon API Gateway (HTTP API v2)..."

API_NAME="enterprise-http-api"

# 1. Create or query HTTP API v2
API_ID=$($AWS apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId" --output text 2>/dev/null || echo "")

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
  echo "  -> Creating HTTP API v2: $API_NAME..."
  API_ID=$($AWS apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type HTTP \
    --cors-configuration '{
      "AllowOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "AllowMethods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      "AllowHeaders": ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"],
      "AllowCredentials": true,
      "MaxAge": 300
    }' \
    --query "ApiId" --output text 2>/dev/null || echo "")
  echo "  -> API Gateway created with ID: $API_ID"
else
  echo "  -> Using existing API Gateway ID: $API_ID"
fi

# 2. Create Default Stage with auto-deploy
if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
  $AWS apigatewayv2 create-stage \
    --api-id "$API_ID" \
    --stage-name '$default' \
    --auto-deploy 2>/dev/null || true
fi

echo "[Floci Init] API Gateway initialization completed successfully."
