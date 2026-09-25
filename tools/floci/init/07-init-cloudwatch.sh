#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing Amazon CloudWatch..."

create_log_group() {
  local log_group=$1
  echo "  -> Creating Log Group: $log_group..."
  $AWS logs create-log-group --log-group-name "$log_group" 2>/dev/null || true
  $AWS logs put-retention-policy --log-group-name "$log_group" --retention-in-days 7 2>/dev/null || true
}

create_log_group "/aws/lambda/enterprise-worker-lambda"
create_log_group "/aws/ecs/enterprise-fargate-worker"
create_log_group "/aws/apigateway/enterprise-http-api"
create_log_group "/aws/events/enterprise-audit"

echo "[Floci Init] CloudWatch initialization completed successfully."
