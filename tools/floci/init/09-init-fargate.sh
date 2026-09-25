#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing AWS Fargate (Amazon ECS Cluster & Tasks)..."

CLUSTER_NAME="enterprise-fargate-cluster"

# 1. Create ECS Cluster
if ! $AWS ecs describe-clusters --clusters "$CLUSTER_NAME" --query "clusters[0].clusterName" --output text 2>/dev/null | grep -q "$CLUSTER_NAME"; then
  echo "  -> Creating ECS Cluster: $CLUSTER_NAME..."
  $AWS ecs create-cluster --cluster-name "$CLUSTER_NAME" 2>/dev/null || true
else
  echo "  -> ECS Cluster $CLUSTER_NAME already exists."
fi

# 2. Register Fargate Task Definition
echo "  -> Registering Task Definition: enterprise-worker-task..."
$AWS ecs register-task-definition \
  --family enterprise-worker-task \
  --requires-compatibilities FARGATE \
  --network-mode awsvpc \
  --cpu "256" \
  --memory "512" \
  --container-definitions '[
    {
      "name": "enterprise-worker",
      "image": "enterprise-worker:latest",
      "essential": true,
      "environment": [
        {"name": "NODE_ENV", "value": "development"},
        {"name": "AWS_REGION", "value": "ap-southeast-1"},
        {"name": "AWS_ENDPOINT_URL", "value": "http://floci:4566"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/enterprise-fargate-worker",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "worker"
        }
      }
    }
  ]' 2>/dev/null || true

echo "[Floci Init] Fargate initialization completed successfully."
