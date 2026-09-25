#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing S3 Buckets..."

create_bucket() {
  local bucket=$1
  if ! $AWS s3api head-bucket --bucket "$bucket" 2>/dev/null; then
    echo "  -> Creating bucket: $bucket"
    $AWS s3api create-bucket \
      --bucket "$bucket" \
      --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || \
    $AWS s3api create-bucket --bucket "$bucket"
  else
    echo "  -> Bucket already exists: $bucket"
  fi
}

create_bucket "enterprise-public-assets"
create_bucket "enterprise-private-uploads"
create_bucket "enterprise-export-reports"

echo "  -> Configuring CORS on enterprise-private-uploads..."
$AWS s3api put-bucket-cors --bucket enterprise-private-uploads --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "[Floci Init] S3 initialization completed successfully."
