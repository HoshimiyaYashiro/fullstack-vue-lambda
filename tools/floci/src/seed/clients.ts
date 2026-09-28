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
import { flociConfig } from '../config.js';

const clientConfig = {
  region: flociConfig.region,
  endpoint: flociConfig.endpoint,
  credentials: flociConfig.credentials,
};

export const apiGateway = new ApiGatewayV2Client(clientConfig);
export const cloudWatch = new CloudWatchLogsClient(clientConfig);
export const cognito = new CognitoIdentityProviderClient(clientConfig);
export const dynamodb = new DynamoDBClient(clientConfig);
export const ecs = new ECSClient(clientConfig);
export const eventBridge = new EventBridgeClient(clientConfig);
export const s3 = new S3Client({ ...clientConfig, forcePathStyle: true });
export const ses = new SESClient(clientConfig);
export const sns = new SNSClient(clientConfig);
export const sqs = new SQSClient(clientConfig);

export async function closeAwsClients() {
  await Promise.all([
    apiGateway.destroy(),
    cloudWatch.destroy(),
    cognito.destroy(),
    dynamodb.destroy(),
    ecs.destroy(),
    eventBridge.destroy(),
    s3.destroy(),
    ses.destroy(),
    sns.destroy(),
    sqs.destroy(),
  ]);
}
