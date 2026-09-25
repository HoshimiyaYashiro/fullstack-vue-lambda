/**
 * Universal Floci Cloud Seeder (TypeScript / Node.js)
 * Provisions all 11 AWS services idempotently via official AWS SDK v3.
 * Runs identically on Windows, macOS, and Linux without needing bash or .sh scripts.
 */

import {
  ApiGatewayV2Client,
  CreateApiCommand,
  CreateStageCommand,
  GetApisCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  CreateGroupCommand,
  CreateUserPoolClientCommand,
  CreateUserPoolCommand,
  ListUserPoolClientsCommand,
  ListUserPoolsCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CreateClusterCommand,
  ECSClient,
  RegisterTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  CreateEventBusCommand,
  EventBridgeClient,
  PutRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  type BucketLocationConstraint,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  CreateTemplateCommand,
  DeleteTemplateCommand,
  SESClient,
  VerifyEmailIdentityCommand,
} from '@aws-sdk/client-ses';
import { CreateTopicCommand, SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import { CreateQueueCommand, GetQueueAttributesCommand, SQSClient } from '@aws-sdk/client-sqs';

const ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const REGION = process.env.AWS_REGION || 'ap-southeast-1';

const clientConfig = {
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
};

const s3 = new S3Client({
  ...clientConfig,
  forcePathStyle: true,
});
const dynamo = new DynamoDBClient(clientConfig);
const cognito = new CognitoIdentityProviderClient(clientConfig);
const sns = new SNSClient(clientConfig);
const sqs = new SQSClient(clientConfig);
const eventbridge = new EventBridgeClient(clientConfig);
const ses = new SESClient(clientConfig);
const logs = new CloudWatchLogsClient(clientConfig);
const ecs = new ECSClient(clientConfig);
const apigw = new ApiGatewayV2Client(clientConfig);

console.log('===============================================================');
console.log('       Floci Universal Local Cloud Seeder (TypeScript)         ');
console.log('===============================================================');
console.log(`Target Endpoint: ${ENDPOINT}`);
console.log(`Target Region:   ${REGION}\n`);

async function seedS3() {
  console.log('[1/10] Seeding Amazon S3 Buckets...');
  const buckets = [
    'enterprise-public-assets',
    'enterprise-private-uploads',
    'enterprise-export-reports',
  ];

  for (const bucket of buckets) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`  -> S3 bucket already exists: ${bucket}`);
    } catch {
      await s3.send(
        new CreateBucketCommand({
          Bucket: bucket,
          CreateBucketConfiguration: { LocationConstraint: REGION as BucketLocationConstraint },
        })
      );
      console.log(`  -> Created S3 bucket: ${bucket}`);
    }
  }

  // Put CORS on private uploads bucket
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: 'enterprise-private-uploads',
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      })
    );
    console.log('  -> Configured CORS on enterprise-private-uploads.');
  } catch (err: unknown) {
    console.warn(`  -> CORS configuration warning: ${(err as Error).message}`);
  }
}

async function seedDynamoDB() {
  console.log('\n[2/10] Seeding Amazon DynamoDB Tables...');

  // 1. Single-Table
  try {
    await dynamo.send(new DescribeTableCommand({ TableName: 'enterprise-app-table' }));
    console.log('  -> DynamoDB table already exists: enterprise-app-table');
  } catch {
    await dynamo.send(
      new CreateTableCommand({
        TableName: 'enterprise-app-table',
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'GSI1PK', AttributeType: 'S' },
          { AttributeName: 'GSI1SK', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamEnabled: true,
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log('  -> Created DynamoDB single-table: enterprise-app-table (with GSI1 & Streams)');
  }

  // 2. Audit logs with TTL
  try {
    await dynamo.send(new DescribeTableCommand({ TableName: 'enterprise-audit-logs' }));
    console.log('  -> DynamoDB table already exists: enterprise-audit-logs');
  } catch {
    await dynamo.send(
      new CreateTableCommand({
        TableName: 'enterprise-audit-logs',
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );
    await dynamo.send(
      new UpdateTimeToLiveCommand({
        TableName: 'enterprise-audit-logs',
        TimeToLiveSpecification: {
          Enabled: true,
          AttributeName: 'ttl',
        },
      })
    );
    console.log('  -> Created DynamoDB table: enterprise-audit-logs (with TTL enabled)');
  }
}

async function seedCognito() {
  console.log('\n[3/10] Seeding Amazon Cognito User Pool & Clients...');
  const poolName = 'enterprise-user-pool';
  const clientName = 'enterprise-web-client';

  let poolId: string | undefined;
  const listPools = await cognito.send(new ListUserPoolsCommand({ MaxResults: 10 }));
  const existingPool = listPools.UserPools?.find((p) => p.Name === poolName);

  if (existingPool) {
    poolId = existingPool.Id;
    console.log(`  -> Using existing Cognito User Pool ID: ${poolId}`);
  } else {
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
    poolId = createdPool.UserPool?.Id;
    console.log(`  -> Created Cognito User Pool with ID: ${poolId}`);
  }

  // App Client
  const listClients = await cognito.send(
    new ListUserPoolClientsCommand({ UserPoolId: poolId, MaxResults: 10 })
  );
  const existingClient = listClients.UserPoolClients?.find((c) => c.ClientName === clientName);

  if (!existingClient) {
    const createdClient = await cognito.send(
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
    console.log(`  -> Created SPA Client ID: ${createdClient.UserPoolClient?.ClientId}`);
  } else {
    console.log(`  -> Using existing SPA Client ID: ${existingClient.ClientId}`);
  }

  // Groups
  const groups = [
    { name: 'Operator', desc: 'Platform Super Administrators' },
    { name: 'TenantAdmin', desc: 'Enterprise Tenant Administrators' },
    { name: 'User', desc: 'Standard Consumer Identities' },
  ];

  for (const g of groups) {
    try {
      await cognito.send(
        new CreateGroupCommand({
          UserPoolId: poolId,
          GroupName: g.name,
          Description: g.desc,
        })
      );
      console.log(`  -> Created Group: ${g.name}`);
    } catch {
      // Group already exists
    }
  }

  // Seed Users
  const seedUsers = [
    {
      email: 'operator@enterprise.local',
      pass: 'Password123!',
      group: 'Operator',
      tenant: 'global',
    },
    {
      email: 'admin@tenant1.local',
      pass: 'Password123!',
      group: 'TenantAdmin',
      tenant: 'tenant_1',
    },
    {
      email: 'user@tenant1.local',
      pass: 'Password123!',
      group: 'User',
      tenant: 'tenant_1',
    },
  ];

  for (const u of seedUsers) {
    try {
      await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: poolId,
          Username: u.email,
          UserAttributes: [
            { Name: 'email', Value: u.email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'custom:tenant_id', Value: u.tenant },
          ],
          MessageAction: 'SUPPRESS',
        })
      );
      await cognito.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: poolId,
          Username: u.email,
          Password: u.pass,
          Permanent: true,
        })
      );
      await cognito.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: poolId,
          Username: u.email,
          GroupName: u.group,
        })
      );
      console.log(`  -> Provisioned seed user: ${u.email} (${u.group})`);
    } catch {
      // User already exists
    }
  }
}

async function seedSnsSqs() {
  console.log('\n[4/10] Seeding Amazon SNS & SQS...');
  const _dlq = await sqs.send(new CreateQueueCommand({ QueueName: 'enterprise-dlq' }));
  const workerQueue = await sqs.send(
    new CreateQueueCommand({ QueueName: 'enterprise-worker-queue' })
  );

  const alertsTopic = await sns.send(new CreateTopicCommand({ Name: 'enterprise-system-alerts' }));
  await sns.send(
    new CreateTopicCommand({
      Name: 'enterprise-notifications.fifo',
      Attributes: { FifoTopic: 'true', ContentBasedDeduplication: 'true' },
    })
  );

  const queueAttrs = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: workerQueue.QueueUrl,
      AttributeNames: ['QueueArn'],
    })
  );

  if (alertsTopic.TopicArn && queueAttrs.Attributes?.QueueArn) {
    try {
      await sns.send(
        new SubscribeCommand({
          TopicArn: alertsTopic.TopicArn,
          Protocol: 'sqs',
          Endpoint: queueAttrs.Attributes.QueueArn,
        })
      );
      console.log('  -> Subscribed enterprise-worker-queue to enterprise-system-alerts.');
    } catch (err: unknown) {
      console.warn(`  -> Subscription warning: ${(err as Error).message}`);
    }
  }
  console.log('  -> Created SNS Topics & SQS Queues.');
}

async function seedEventBridge() {
  console.log('\n[5/10] Seeding Amazon EventBridge...');
  try {
    await eventbridge.send(new CreateEventBusCommand({ Name: 'enterprise-event-bus' }));
    console.log('  -> Created EventBus: enterprise-event-bus');
  } catch {
    console.log('  -> EventBus enterprise-event-bus already exists.');
  }

  try {
    await eventbridge.send(
      new PutRuleCommand({
        Name: 'enterprise-domain-events-rule',
        EventBusName: 'enterprise-event-bus',
        EventPattern: JSON.stringify({ source: [{ prefix: 'enterprise.' }] }),
        State: 'ENABLED',
      })
    );
    console.log('  -> Registered rule: enterprise-domain-events-rule.');
  } catch (err: unknown) {
    console.warn(`  -> Event rule warning: ${(err as Error).message}`);
  }
}

async function seedSes() {
  console.log('\n[6/10] Seeding Amazon SES...');
  const emails = [
    'noreply@enterprise.local',
    'admin@enterprise.local',
    'developer@enterprise.local',
  ];

  for (const email of emails) {
    try {
      await ses.send(new VerifyEmailIdentityCommand({ EmailAddress: email }));
      console.log(`  -> Verified mock email: ${email}`);
    } catch {
      // Ignored
    }
  }

  try {
    await ses.send(new DeleteTemplateCommand({ TemplateName: 'OtpVerificationTemplate' }));
  } catch {
    // Ignored
  }

  try {
    await ses.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: 'OtpVerificationTemplate',
          SubjectPart: 'Your Verification Code: {{otp}}',
          HtmlPart:
            '<h1>Security Verification</h1><p>Your one-time code is: <strong>{{otp}}</strong></p>',
          TextPart: 'Your one-time code is: {{otp}}.',
        },
      })
    );
    console.log('  -> Registered SES Template: OtpVerificationTemplate.');
  } catch (err: unknown) {
    console.warn(`  -> SES Template warning: ${(err as Error).message}`);
  }
}

async function seedCloudWatch() {
  console.log('\n[7/10] Seeding Amazon CloudWatch Logs...');
  const groups = [
    '/aws/lambda/enterprise-worker-lambda',
    '/aws/ecs/enterprise-fargate-worker',
    '/aws/apigateway/enterprise-http-api',
    '/aws/events/enterprise-audit',
  ];

  for (const g of groups) {
    try {
      await logs.send(new CreateLogGroupCommand({ logGroupName: g }));
      await logs.send(new PutRetentionPolicyCommand({ logGroupName: g, retentionInDays: 7 }));
      console.log(`  -> Created Log Group: ${g} (7-day retention)`);
    } catch {
      console.log(`  -> Log Group already exists: ${g}`);
    }
  }
}

async function seedECS() {
  console.log('\n[8/10] Seeding AWS Fargate (Amazon ECS)...');
  try {
    await ecs.send(new CreateClusterCommand({ clusterName: 'enterprise-fargate-cluster' }));
    console.log('  -> Created ECS Cluster: enterprise-fargate-cluster');
  } catch {
    console.log('  -> ECS Cluster enterprise-fargate-cluster already exists.');
  }

  try {
    await ecs.send(
      new RegisterTaskDefinitionCommand({
        family: 'enterprise-worker-task',
        requiresCompatibilities: ['FARGATE'],
        networkMode: 'awsvpc',
        cpu: '256',
        memory: '512',
        containerDefinitions: [
          {
            name: 'enterprise-worker',
            image: 'enterprise-worker:latest',
            essential: true,
            environment: [
              { name: 'NODE_ENV', value: 'development' },
              { name: 'AWS_REGION', value: REGION },
              { name: 'AWS_ENDPOINT_URL', value: 'http://floci:4566' },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': '/aws/ecs/enterprise-fargate-worker',
                'awslogs-region': REGION,
                'awslogs-stream-prefix': 'worker',
              },
            },
          },
        ],
      })
    );
    console.log('  -> Registered Task Definition: enterprise-worker-task.');
  } catch (err: unknown) {
    console.warn(`  -> ECS Task Definition warning: ${(err as Error).message}`);
  }
}

async function seedApiGateway() {
  console.log('\n[9/10] Seeding Amazon API Gateway (HTTP API v2)...');
  const apiName = 'enterprise-http-api';

  try {
    const existing = await apigw.send(new GetApisCommand({}));
    const found = existing.Items?.find((i) => i.Name === apiName);

    if (found) {
      console.log(`  -> Using existing HTTP API v2 ID: ${found.ApiId}`);
    } else {
      const created = await apigw.send(
        new CreateApiCommand({
          Name: apiName,
          ProtocolType: 'HTTP',
          CorsConfiguration: {
            AllowOrigins: ['http://localhost:3000', 'http://localhost:3001'],
            AllowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            AllowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
            AllowCredentials: true,
            MaxAge: 300,
          },
        })
      );
      if (created.ApiId) {
        await apigw.send(
          new CreateStageCommand({
            ApiId: created.ApiId,
            StageName: '$default',
            AutoDeploy: true,
          })
        );
        console.log(`  -> Created HTTP API v2 ID: ${created.ApiId} with stage $default.`);
      }
    }
  } catch (err: unknown) {
    console.warn(`  -> API Gateway warning: ${(err as Error).message}`);
  }
}

async function seedAurora() {
  console.log('\n[10/10] Checking Amazon Aurora (PostgreSQL Serverless v2)...');
  console.log('  -> Connection String: postgres://postgres:postgres@localhost:5432/enterprise_db');
  try {
    const { runMigrations } = await import('../src/db/migrate.js');
    await runMigrations();
  } catch (err: unknown) {
    console.warn(`  -> Aurora PostgreSQL notice: ${(err as Error).message}`);
    console.warn(
      '     (Aurora requires Docker container or local PostgreSQL instance on port 5432)'
    );
  }
}

async function main() {
  const startTime = Date.now();
  try {
    await seedS3();
    await seedDynamoDB();
    await seedCognito();
    await seedSnsSqs();
    await seedEventBridge();
    await seedSes();
    await seedCloudWatch();
    await seedECS();
    await seedApiGateway();
    await seedAurora();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n===============================================================`);
    console.log(`✅ Floci Universal Seeding Completed in ${elapsed}s!`);
    console.log(`===============================================================\n`);
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    if (
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ENOTFOUND')
    ) {
      console.error(`\n❌ Could not connect to Floci at ${ENDPOINT}.`);
      console.error(`   Please ensure Floci is running first via: pnpm floci:up\n`);
    } else {
      console.error(`\n❌ Seeding failed: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
