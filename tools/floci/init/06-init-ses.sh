#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing Amazon SES..."

# 1. Verify Email Identities
verify_email() {
  local email=$1
  echo "  -> Verifying email identity: $email..."
  $AWS ses verify-email-identity --email-address "$email" 2>/dev/null || true
}

verify_email "noreply@enterprise.local"
verify_email "admin@enterprise.local"
verify_email "developer@enterprise.local"

# 2. Create Email OTP Template
echo "  -> Registering template: OtpVerificationTemplate..."
$AWS ses delete-template --template-name "OtpVerificationTemplate" 2>/dev/null || true
$AWS ses create-template --template '{
  "TemplateName": "OtpVerificationTemplate",
  "SubjectPart": "Your Verification Code: {{otp}}",
  "HtmlPart": "<h1>Security Verification</h1><p>Your one-time security code is: <strong>{{otp}}</strong></p><p>This code expires in 10 minutes.</p>",
  "TextPart": "Your one-time security code is: {{otp}}. This code expires in 10 minutes."
}' 2>/dev/null || true

echo "[Floci Init] SES initialization completed successfully."
