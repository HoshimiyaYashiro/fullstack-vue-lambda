#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing Amazon SNS & SQS..."

# 1. SQS Queues
DLQ_URL=$($AWS sqs create-queue --queue-name enterprise-dlq --query "QueueUrl" --output text 2>/dev/null || echo "")
WORKER_QUEUE_URL=$($AWS sqs create-queue --queue-name enterprise-worker-queue --query "QueueUrl" --output text 2>/dev/null || echo "")

WORKER_QUEUE_ARN=$($AWS sqs get-queue-attributes --queue-url "$WORKER_QUEUE_URL" --attribute-names QueueArn --query "Attributes.QueueArn" --output text 2>/dev/null || echo "")

# 2. SNS Topics
ALERTS_TOPIC_ARN=$($AWS sns create-topic --name enterprise-system-alerts --query "TopicArn" --output text 2>/dev/null || echo "")
NOTIFICATIONS_FIFO_ARN=$($AWS sns create-topic --name enterprise-notifications.fifo --attributes FifoTopic=true,ContentBasedDeduplication=true --query "TopicArn" --output text 2>/dev/null || echo "")

echo "  -> Subscribing worker queue to alerts topic..."
if [ -n "$ALERTS_TOPIC_ARN" ] && [ -n "$WORKER_QUEUE_ARN" ]; then
  $AWS sns subscribe \
    --topic-arn "$ALERTS_TOPIC_ARN" \
    --protocol sqs \
    --notification-endpoint "$WORKER_QUEUE_ARN" 2>/dev/null || true
fi

echo "[Floci Init] SNS & SQS initialization completed successfully."
