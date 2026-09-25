#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing Amazon Cognito User Pool & Clients..."

USER_POOL_NAME="enterprise-user-pool"
CLIENT_NAME="enterprise-web-client"

# 1. Create or Find User Pool
USER_POOL_ID=$($AWS cognito-idp list-user-pools --max-results 10 --query "UserPools[?Name=='$USER_POOL_NAME'].Id" --output text 2>/dev/null || echo "")

if [ -z "$USER_POOL_ID" ] || [ "$USER_POOL_ID" == "None" ]; then
  echo "  -> Creating Cognito User Pool: $USER_POOL_NAME..."
  USER_POOL_ID=$($AWS cognito-idp create-user-pool \
    --pool-name "$USER_POOL_NAME" \
    --username-attributes email \
    --auto-verified-attributes email \
    --schema '[
      {"Name": "email", "AttributeDataType": "String", "DeveloperOnlyAttribute": false, "Mutable": true, "Required": true},
      {"Name": "tenant_id", "AttributeDataType": "String", "DeveloperOnlyAttribute": false, "Mutable": true, "Required": false}
    ]' \
    --query "UserPool.Id" --output text)
  echo "  -> User Pool created with ID: $USER_POOL_ID"
else
  echo "  -> Using existing User Pool ID: $USER_POOL_ID"
fi

# 2. Create User Pool Client (SPA without secret)
CLIENT_ID=$($AWS cognito-idp list-user-pool-clients --user-pool-id "$USER_POOL_ID" --query "UserPoolClients[?ClientName=='$CLIENT_NAME'].ClientId" --output text 2>/dev/null || echo "")

if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" == "None" ]; then
  echo "  -> Creating SPA Client: $CLIENT_NAME..."
  CLIENT_ID=$($AWS cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$CLIENT_NAME" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH \
    --query "UserPoolClient.ClientId" --output text)
  echo "  -> Client created with ID: $CLIENT_ID"
else
  echo "  -> Using existing Client ID: $CLIENT_ID"
fi

# 3. Create Security Groups
create_group() {
  local group_name=$1
  local description=$2
  if ! $AWS cognito-idp get-group --user-pool-id "$USER_POOL_ID" --group-name "$group_name" 2>/dev/null; then
    echo "  -> Creating group: $group_name"
    $AWS cognito-idp create-group --user-pool-id "$USER_POOL_ID" --group-name "$group_name" --description "$description"
  fi
}

create_group "Operator" "Platform Super Administrators"
create_group "TenantAdmin" "Enterprise Tenant Administrators"
create_group "User" "Standard Consumer Identities"

# 4. Provision Seed Test Users
create_seed_user() {
  local username=$1
  local password=$2
  local group=$3
  local tenant_id=$4

  echo "  -> Provisioning seed user: $username ($group)..."
  if ! $AWS cognito-idp admin-get-user --user-pool-id "$USER_POOL_ID" --username "$username" 2>/dev/null; then
    $AWS cognito-idp admin-create-user \
      --user-pool-id "$USER_POOL_ID" \
      --username "$username" \
      --user-attributes Name=email,Value="$username" Name=email_verified,Value=true Name=custom:tenant_id,Value="$tenant_id" \
      --message-action SUPPRESS 2>/dev/null || true

    $AWS cognito-idp admin-set-user-password \
      --user-pool-id "$USER_POOL_ID" \
      --username "$username" \
      --password "$password" \
      --permanent 2>/dev/null || true

    $AWS cognito-idp admin-add-user-to-group \
      --user-pool-id "$USER_POOL_ID" \
      --username "$username" \
      --group-name "$group" 2>/dev/null || true
  fi
}

create_seed_user "operator@enterprise.local" "Password123!" "Operator" "global"
create_seed_user "admin@tenant1.local" "Password123!" "TenantAdmin" "tenant_1"
create_seed_user "user@tenant1.local" "Password123!" "User" "tenant_1"

echo "[Floci Init] Cognito initialization completed successfully."
