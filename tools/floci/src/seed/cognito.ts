import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CreateGroupCommand,
  CreateUserPoolClientCommand,
  CreateUserPoolCommand,
  ListUserPoolClientsCommand,
  ListUserPoolsCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { flociConfig } from '../config.js';
import { cognito } from './clients.js';
import { createIfMissing, errorName } from './errors.js';

async function getOrCreatePool(poolName: string) {
  const pools = await cognito.send(new ListUserPoolsCommand({ MaxResults: 60 }));
  const existingPool = pools.UserPools?.find((pool) => pool.Name === poolName);
  if (existingPool?.Id) return existingPool.Id;

  const createdPool = await cognito.send(
    new CreateUserPoolCommand({
      PoolName: poolName,
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
      Schema: [
        {
          Name: 'email',
          AttributeDataType: 'String',
          DeveloperOnlyAttribute: false,
          Mutable: true,
          Required: true,
        },
        {
          Name: 'tenant_id',
          AttributeDataType: 'String',
          DeveloperOnlyAttribute: false,
          Mutable: true,
          Required: false,
        },
      ],
    })
  );
  if (!createdPool.UserPool?.Id) throw new Error(`No ID returned for Cognito pool ${poolName}.`);
  console.log(`  -> Created Cognito pool ${poolName}: ${createdPool.UserPool.Id}`);
  return createdPool.UserPool.Id;
}

async function getOrCreateClient(poolId: string, clientName: string) {
  const clients = await cognito.send(
    new ListUserPoolClientsCommand({ UserPoolId: poolId, MaxResults: 60 })
  );
  if (clients.UserPoolClients?.some((client) => client.ClientName === clientName)) return;

  const client = await cognito.send(
    new CreateUserPoolClientCommand({
      UserPoolId: poolId,
      ClientName: clientName,
      GenerateSecret: false,
      ExplicitAuthFlows: [
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_PASSWORD_AUTH',
      ],
    })
  );
  console.log(`  -> Created Cognito client ${clientName}: ${client.UserPoolClient?.ClientId}`);
}

async function createGroup(poolId: string, name: string, description: string) {
  await createIfMissing(
    () =>
      cognito.send(
        new CreateGroupCommand({ UserPoolId: poolId, GroupName: name, Description: description })
      ),
    `Cognito group ${name}`
  );
}

async function seedUser(poolId: string, email: string, group: string, tenantId: string) {
  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: poolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:tenant_id', Value: tenantId },
        ],
        MessageAction: 'SUPPRESS',
      })
    );
  } catch (error) {
    if (errorName(error) !== 'UsernameExistsException') throw error;
  }

  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: poolId,
      Username: email,
      Password: 'Password123!',
      Permanent: true,
    })
  );
  await cognito.send(
    new AdminAddUserToGroupCommand({ UserPoolId: poolId, Username: email, GroupName: group })
  );
  console.log(`  -> Ensured seed user ${email} is in ${group}.`);
}

export async function seedCognito() {
  console.log('[Cognito] Creating pools, clients, groups, and sample users...');
  const adminPoolId = await getOrCreatePool(flociConfig.cognito.adminPool);
  const userPoolId = await getOrCreatePool(flociConfig.cognito.userPool);
  await getOrCreateClient(adminPoolId, flociConfig.cognito.adminClient);
  await getOrCreateClient(userPoolId, flociConfig.cognito.userClient);

  await createGroup(adminPoolId, 'Operator', 'Platform Super Administrators');
  await createGroup(adminPoolId, 'TenantAdmin', 'Enterprise Tenant Administrators');
  await createGroup(userPoolId, 'User', 'Standard Consumer Identities');
  await seedUser(adminPoolId, 'operator@enterprise.local', 'Operator', 'global');
  await seedUser(adminPoolId, 'admin@tenant1.local', 'TenantAdmin', 'tenant_1');
  await seedUser(userPoolId, 'user@tenant1.local', 'User', 'tenant_1');
}
