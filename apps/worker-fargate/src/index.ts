import { env } from './config/env.js';
import { batch001Processor } from './jobs/batch-001/index.js';
import { batch002Processor } from './jobs/batch-002/index.js';
import { SqsConsumer } from './queue/sqs-consumer.js';

/**
 * Enterprise ECS Fargate Background Task Worker
 *
 * Supports dynamic worker execution based on WORKER_TYPE:
 * - 'batch-001': Dedicated consumer for S3 -> Database file ingestion
 * - 'batch-002': Dedicated consumer for Database -> S3 multipart streaming export
 * - 'ALL': Multi-queue consumer executing all registered batch tasks (default for local development)
 */

console.log('===============================================================');
console.log('       Enterprise ECS Fargate Background Daemon               ');
console.log('===============================================================');
console.log(`Environment: ${env.NODE_ENV}`);
console.log(`Region:      ${env.AWS_REGION}`);
console.log(`Worker Type: ${env.WORKER_TYPE}`);
console.log('===============================================================\n');

const consumers: SqsConsumer[] = [];

if (env.WORKER_TYPE === 'batch-001') {
  consumers.push(new SqsConsumer(batch001Processor));
} else if (env.WORKER_TYPE === 'batch-002') {
  consumers.push(new SqsConsumer(batch002Processor));
} else {
  // 'ALL' mode: instantiate all registered processors
  consumers.push(new SqsConsumer(batch001Processor));
  consumers.push(new SqsConsumer(batch002Processor));
}

// Start consumers
for (const consumer of consumers) {
  consumer.start().catch((err) => {
    console.error('[Daemon Error] Consumer failed:', err);
  });
}

// Graceful shutdown handling for ECS task lifecycle (SIGTERM / SIGINT)
function handleShutdown(signal: string) {
  console.log(`\n[Shutdown] Received ${signal}. Stopping all SQS consumers gracefully...`);
  for (const consumer of consumers) {
    consumer.stop();
  }

  // Allow up to 10 seconds for in-flight tasks before exiting
  setTimeout(() => {
    console.log('[Shutdown] Exiting daemon process.');
    process.exit(0);
  }, 1000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
