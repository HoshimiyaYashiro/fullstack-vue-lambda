#!/bin/bash
set -e

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

if command -v awslocal >/dev/null 2>&1; then
  AWS="awslocal"
else
  AWS="aws --endpoint-url=${ENDPOINT_URL} --region=${REGION}"
fi

echo "[Floci Init] Initializing separate Cognito admin and user pools..."

POOL_SCHEMA='[
  {"Name": "email", "AttributeDataType": "String", "DeveloperOnlyAttribute": false, "Mutable": true, "Required": true},
  {"Name": "tenant_id", "AttributeDataType": "String", "DeveloperOnlyAttribute": false, "Mutable": true, "Required": false}
]'

get_or_create_pool() {
  local pool_name=$1

  POOL_ID=$($AWS cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='$pool_name'].Id | [0]" --output text 2>/dev/null || echo "")
  if [ -z "$POOL_ID" ] || [ "$POOL_ID" == "None" ]; then
    echo "  -> Creating Cognito User Pool: $pool_name..."
    POOL_ID=$($AWS cognito-idp create-user-pool \
      --pool-name "$pool_name" \
      --username-attributes email \
      --auto-verified-attributes email \
      --schema "$POOL_SCHEMA" \
      --query "UserPool.Id" --output text)
    echo "  -> User Pool created with ID: $POOL_ID"
  else
    echo "  -> Using existing User Pool $pool_name: $POOL_ID"
  fi
}

get_or_create_client() {
  local pool_id=$1
  local client_name=$2

  CLIENT_ID=$($AWS cognito-idp list-user-pool-clients --user-pool-id "$pool_id" --max-results 60 --query "UserPoolClients[?ClientName=='$client_name'].ClientId | [0]" --output text 2>/dev/null || echo "")
  if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" == "None" ]; then
    echo "  -> Creating public SPA client: $client_name..."
    CLIENT_ID=$($AWS cognito-idp create-user-pool-client \
      --user-pool-id "$pool_id" \
      --client-name "$client_name" \
      --no-generate-secret \
      --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH \
      --query "UserPoolClient.ClientId" --output text)
    echo "  -> Client created with ID: $CLIENT_ID"
  else
    echo "  -> Using existing client $client_name: $CLIENT_ID"
  fi
}

create_group() {
  local pool_id=$1
  local group_name=$2
  local description=$3

  if ! $AWS cognito-idp get-group --user-pool-id "$pool_id" --group-name "$group_name" >/dev/null 2>&1; then
    echo "  -> Creating group $group_name in pool $pool_id"
    $AWS cognito-idp create-group --user-pool-id "$pool_id" --group-name "$group_name" --description "$description" >/dev/null
  fi
}

create_seed_user() {
  local pool_id=$1
  local username=$2
  local password=$3
  local group=$4
  local tenant_id=$5

  echo "  -> Provisioning $username in pool $pool_id ($group)..."
  if ! $AWS cognito-idp admin-get-user --user-pool-id "$pool_id" --username "$username" >/dev/null 2>&1; then
    $AWS cognito-idp admin-create-user \
      --user-pool-id "$pool_id" \
      --username "$username" \
      --user-attributes Name=email,Value="$username" Name=email_verified,Value=true Name=custom:tenant_id,Value="$tenant_id" \
      --message-action SUPPRESS >/dev/null

    $AWS cognito-idp admin-set-user-password \
      --user-pool-id "$pool_id" \
      --username "$username" \
      --password "$password" \
      --permanent >/dev/null
  fi

  $AWS cognito-idp admin-add-user-to-group \
    --user-pool-id "$pool_id" \
    --username "$username" \
    --group-name "$group" >/dev/null 2>&1 || true
}

get_or_create_pool "enterprise-admin-user-pool"
ADMIN_POOL_ID=$POOL_ID
get_or_create_client "$ADMIN_POOL_ID" "enterprise-admin-web-client"
ADMIN_CLIENT_ID=$CLIENT_ID

get_or_create_pool "enterprise-user-pool"
USER_POOL_ID=$POOL_ID
get_or_create_client "$USER_POOL_ID" "enterprise-web-client"
USER_CLIENT_ID=$CLIENT_ID

create_group "$ADMIN_POOL_ID" "Operator" "Platform Super Administrators"
create_group "$ADMIN_POOL_ID" "TenantAdmin" "Enterprise Tenant Administrators"
create_group "$USER_POOL_ID" "User" "Standard Consumer Identities"

create_seed_user "$ADMIN_POOL_ID" "operator@enterprise.local" "Password123!" "Operator" "global"
create_seed_user "$ADMIN_POOL_ID" "admin@tenant1.local" "Password123!" "TenantAdmin" "tenant_1"
create_seed_user "$USER_POOL_ID" "user@tenant1.local" "Password123!" "User" "tenant_1"

echo "  -> Admin User Pool ID: $ADMIN_POOL_ID"
echo "  -> Admin Client ID: $ADMIN_CLIENT_ID"
echo "  -> User User Pool ID: $USER_POOL_ID"
echo "  -> User Client ID: $USER_CLIENT_ID"
echo "[Floci Init] Cognito initialization completed successfully."
