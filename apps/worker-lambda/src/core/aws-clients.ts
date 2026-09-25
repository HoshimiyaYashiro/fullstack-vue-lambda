import { ApiGatewayV2Client } from '@aws-sdk/client-apigatewayv2';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ECSClient } from '@aws-sdk/client-ecs';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { SNSClient } from '@aws-sdk/client-sns';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Universal Isomorphic AWS SDK Client Factory
 *
 * Automatically detects whether code is executing in local development (Floci emulation)
 * or in production AWS Lambda / Fargate environments.
 * In local mode, requests are routed to Floci (http://localhost:4566) with dummy credentials.
 * In production mode, standard AWS SDK credential and region resolution applies.
 */

const isLocal =
  process.env.NODE_ENV !== 'production' &&
  (!!process.env.AWS_ENDPOINT_URL ||
    !!process.env.LOCALSTACK_HOSTNAME ||
    !!process.env.FLOCI_HOSTNAME);

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1';
const endpoint = process.env.AWS_ENDPOINT_URL || (isLocal ? 'http://localhost:4566' : undefined);

const baseConfig = {
  region,
  ...(endpoint ? { endpoint } : {}),
  ...(isLocal
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
        },
      }
    : {}),
};

export const s3Client = new S3Client({
  ...baseConfig,
  forcePathStyle: isLocal,
});

export const rawDynamoClient = new DynamoDBClient(baseConfig);
export const dynamoDocClient = DynamoDBDocumentClient.from(rawDynamoClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export const eventBridgeClient = new EventBridgeClient(baseConfig);
export const snsClient = new SNSClient(baseConfig);
export const sqsClient = new SQSClient(baseConfig);
export const sesClient = new SESClient(baseConfig);
export const cognitoClient = new CognitoIdentityProviderClient(baseConfig);
export const cloudWatchLogsClient = new CloudWatchLogsClient(baseConfig);
export const ecsClient = new ECSClient(baseConfig);
export const apiGatewayClient = new ApiGatewayV2Client(baseConfig);
