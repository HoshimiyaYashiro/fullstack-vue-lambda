import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

loadDotEnv({ path: path.resolve(currentDirectory, '../.env.floci') });

const getValue = (name: string, fallback: string) => process.env[name] || fallback;

export const flociConfig = {
  endpoint: getValue('AWS_ENDPOINT_URL', 'http://localhost:4566'),
  region: getValue('AWS_REGION', getValue('AWS_DEFAULT_REGION', 'ap-southeast-1')),
  credentials: {
    accessKeyId: getValue('AWS_ACCESS_KEY_ID', 'test'),
    secretAccessKey: getValue('AWS_SECRET_ACCESS_KEY', 'test'),
  },
  databaseUrl: process.env.DATABASE_URL,
  buckets: {
    publicAssets: getValue('S3_PUBLIC_ASSETS_BUCKET', 'enterprise-public-assets'),
    privateUploads: getValue('S3_PRIVATE_UPLOADS_BUCKET', 'enterprise-private-uploads'),
    exportReports: getValue('S3_EXPORT_REPORTS_BUCKET', 'enterprise-export-reports'),
  },
  dynamodb: {
    applicationTable: getValue('DYNAMODB_TABLE_NAME', 'enterprise-app-table'),
    auditTable: getValue('DYNAMODB_AUDIT_TABLE', 'enterprise-audit-logs'),
  },
  cognito: {
    adminPool: getValue('COGNITO_ADMIN_USER_POOL_NAME', 'enterprise-admin-user-pool'),
    adminClient: getValue('COGNITO_ADMIN_CLIENT_NAME', 'enterprise-admin-web-client'),
    userPool: getValue('COGNITO_USER_POOL_NAME', 'enterprise-user-pool'),
    userClient: getValue('COGNITO_CLIENT_NAME', 'enterprise-web-client'),
  },
  messaging: {
    eventBus: getValue('EVENT_BUS_NAME', 'enterprise-event-bus'),
    alertTopic: getValue('SNS_ALERTS_TOPIC', 'enterprise-system-alerts'),
    notificationTopic: getValue('SNS_NOTIFICATIONS_TOPIC', 'enterprise-notifications.fifo'),
    workerQueue: getValue('SQS_WORKER_QUEUE', 'enterprise-worker-queue'),
    deadLetterQueue: getValue('SQS_DLQ', 'enterprise-dlq'),
  },
  ecs: {
    cluster: getValue('ECS_CLUSTER_NAME', 'enterprise-fargate-cluster'),
    taskFamily: getValue('ECS_TASK_FAMILY', 'enterprise-worker-task'),
  },
};
