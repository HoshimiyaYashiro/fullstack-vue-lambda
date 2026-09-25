import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Auto-load .env during local daemon executions
if (process.env.NODE_ENV !== 'production') {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env'),
    path.resolve(process.cwd(), 'apps/worker-fargate/.env'),
  ];
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
      process.loadEnvFile?.(candidate);
      break;
    }
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isLocal:
    process.env.NODE_ENV !== 'production' &&
    (Boolean(process.env.AWS_ENDPOINT_URL) ||
      Boolean(process.env.LOCALSTACK_HOSTNAME) ||
      Boolean(process.env.FLOCI_HOSTNAME)),

  // AWS configuration
  AWS_REGION: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1',
  AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,

  // Worker mode: 'ALL' | 'batch-001' | 'batch-002'
  WORKER_TYPE: process.env.WORKER_TYPE || 'ALL',

  // S3 Storage
  S3_STORAGE_BUCKET: process.env.S3_STORAGE_BUCKET || 'enterprise-public-assets',

  // EventBridge
  EVENT_BUS_NAME: process.env.EVENT_BUS_NAME || 'enterprise-event-bus',

  // SQS Queues
  BATCH_001_QUEUE_NAME: process.env.BATCH_001_QUEUE_NAME || 'batch-001-queue',
  BATCH_002_QUEUE_NAME: process.env.BATCH_002_QUEUE_NAME || 'batch-002-queue',
  DEFAULT_WORKER_QUEUE_NAME: process.env.WORKER_QUEUE_NAME || 'enterprise-worker-queue',
};
