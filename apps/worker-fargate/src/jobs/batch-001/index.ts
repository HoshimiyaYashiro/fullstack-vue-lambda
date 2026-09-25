import readline from 'node:readline';
import { auditLogs, createFargateClient } from '@repo/database';
import { env } from '../../config/env.js';
import { publishDomainEvent } from '../../events/event.publisher.js';
import type { BaseJobMessage, JobResult } from '../../queue/types.js';
import { getS3ObjectStream } from '../../storage/s3.service.js';
import type { JobProcessor } from '../base.processor.js';
import type { Batch001Payload } from './types.js';

export class Batch001Processor implements JobProcessor<Batch001Payload> {
  readonly jobName = 'batch-001';
  readonly queueName = env.BATCH_001_QUEUE_NAME;

  async process(message: BaseJobMessage<Batch001Payload>): Promise<JobResult> {
    const { jobId, tenantId = 'default_tenant', payload } = message;
    console.log(
      `[Batch-001] Starting file ingestion job [${jobId}] from s3://${payload.s3Bucket}/${payload.s3Key}`
    );

    const startTime = Date.now();
    let recordsCount = 0;
    const batchSize = 500;
    let pendingBatch: Array<{
      id: string;
      tenantId: string;
      action: string;
      entity: string;
      entityId: string;
      payload: Record<string, unknown>;
    }> = [];

    const { db } = createFargateClient();

    try {
      // 1. Obtain readable stream from S3 without loading file into memory
      const s3Stream = await getS3ObjectStream(payload.s3Bucket, payload.s3Key);

      // 2. Stream-parse line-by-line (handles massive CSV/JSONL files safely)
      const rl = readline.createInterface({
        input: s3Stream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        recordsCount++;
        pendingBatch.push({
          id: `b1_${jobId}_${recordsCount}`,
          tenantId,
          action: 'BATCH_001_RECORD_IMPORTED',
          entity: payload.targetEntity || 'GenericBatchRecord',
          entityId: `rec_${recordsCount}`,
          payload: { rowContent: trimmed, lineIndex: recordsCount },
        });

        // 3. Flush chunk to Aurora PostgreSQL when batch size is reached
        if (pendingBatch.length >= batchSize) {
          await db.insert(auditLogs).values(pendingBatch);
          pendingBatch = [];
          console.log(
            `  -> [Batch-001] Flushed batch to database. Total lines processed: ${recordsCount}`
          );
        }
      }

      // Flush remaining records
      if (pendingBatch.length > 0) {
        await db.insert(auditLogs).values(pendingBatch);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `✅ [Batch-001] Job [${jobId}] finished in ${elapsed}s! Imported ${recordsCount} records.`
      );

      // 4. Publish completion event
      await publishDomainEvent({
        detailType: 'Batch001Completed',
        detail: {
          jobId,
          status: 'SUCCESS',
          recordsProcessed: recordsCount,
          durationSeconds: Number(elapsed),
          s3Location: `s3://${payload.s3Bucket}/${payload.s3Key}`,
        },
      });

      return {
        jobId,
        status: 'SUCCESS',
        recordsProcessed: recordsCount,
        details: { durationSeconds: Number(elapsed) },
      };
    } catch (err: unknown) {
      const errorMsg = (err as Error).message;
      console.error(`❌ [Batch-001] Job [${jobId}] failed: ${errorMsg}`);

      await publishDomainEvent({
        detailType: 'Batch001Failed',
        detail: {
          jobId,
          status: 'FAILED',
          error: errorMsg,
          recordsProcessed: recordsCount,
        },
      });

      return {
        jobId,
        status: 'FAILED',
        recordsProcessed: recordsCount,
        error: errorMsg,
      };
    }
  }
}

export const batch001Processor = new Batch001Processor();
