import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { env } from './env.js';

const endpoint = env.AWS_ENDPOINT_URL || (env.isLocal ? 'http://localhost:4566' : undefined);

const baseConfig = {
  region: env.AWS_REGION,
  ...(endpoint ? { endpoint } : {}),
  ...(env.isLocal
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
        },
        forcePathStyle: true,
      }
    : {}),
};

export const sqsClient = new SQSClient(baseConfig);
export const s3Client = new S3Client(baseConfig);
export const eventBridgeClient = new EventBridgeClient(baseConfig);
