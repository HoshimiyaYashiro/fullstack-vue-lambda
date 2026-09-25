import { PassThrough } from 'node:stream';
import { auditLogs, createFargateClient, desc } from '@repo/database';
import { env } from '../../config/env.js';
import { publishDomainEvent } from '../../events/event.publisher.js';
import type { BaseJobMessage, JobResult } from '../../queue/types.js';
import { uploadS3Stream } from '../../storage/s3.service.js';
import type { JobProcessor } from '../base.processor.js';
import type { Batch002Payload } from './types.js';

export class Batch002Processor implements JobProcessor<Batch002Payload> {
  readonly jobName = 'batch-002';
  readonly queueName = env.BATCH_002_QUEUE_NAME;

  async process(message: BaseJobMessage<Batch002Payload>): Promise<JobResult> {
    const { jobId, payload } = message;
    const bucket = payload.destinationBucket || env.S3_STORAGE_BUCKET;
    const key = `${payload.destinationKeyPrefix || 'exports'}/batch-002-${jobId}-${Date.now()}.csv`;

    console.log(`[Batch-002] Starting database export job [${jobId}] -> s3://${bucket}/${key}`);

    const startTime = Date.now();
    const { db } = createFargateClient();
    const passThrough = new PassThrough();

    // Start multipart upload promise in background
    const uploadPromise = uploadS3Stream(bucket, key, passThrough, 'text/csv');

    let totalExported = 0;

    try {
      // 1. Write CSV Header
      passThrough.write('id,tenant_id,action,entity,entity_id,created_at\n');

      // 2. Query batches from Aurora PostgreSQL and stream directly to S3
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const rows = await db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .limit(pageSize)
          .offset(offset);

        if (rows.length === 0) {
          hasMore = false;
          break;
        }

        for (const row of rows) {
          const csvRow = [
            `"${row.id}"`,
            `"${row.tenantId || ''}"`,
            `"${row.action}"`,
            `"${row.entity}"`,
            `"${row.entityId || ''}"`,
            `"${row.createdAt?.toISOString() || ''}"`,
          ].join(',');

          passThrough.write(`${csvRow}\n`);
          totalExported++;
        }

        offset += rows.length;
        if (rows.length < pageSize) {
          hasMore = false;
        }

        console.log(`  -> [Batch-002] Streamed ${totalExported} records to S3 multipart upload...`);
      }

      // End the stream to finalize S3 upload
      passThrough.end();

      // Wait for S3 upload to finish
      const uploadResult = await uploadPromise;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(
        `✅ [Batch-002] Job [${jobId}] finished in ${elapsed}s! Exported ${totalExported} records to s3://${bucket}/${key}`
      );

      // 3. Publish completion event
      await publishDomainEvent({
        detailType: 'Batch002Completed',
        detail: {
          jobId,
          status: 'SUCCESS',
          recordsProcessed: totalExported,
          s3Location: `s3://${bucket}/${key}`,
          downloadLocation: uploadResult.location,
          durationSeconds: Number(elapsed),
        },
      });

      return {
        jobId,
        status: 'SUCCESS',
        recordsProcessed: totalExported,
        details: { s3Location: `s3://${bucket}/${key}` },
      };
    } catch (err: unknown) {
      passThrough.destroy(err as Error);
      const errorMsg = (err as Error).message;
      console.error(`❌ [Batch-002] Job [${jobId}] failed: ${errorMsg}`);

      await publishDomainEvent({
        detailType: 'Batch002Failed',
        detail: {
          jobId,
          status: 'FAILED',
          error: errorMsg,
          recordsProcessed: totalExported,
        },
      });

      return {
        jobId,
        status: 'FAILED',
        recordsProcessed: totalExported,
        error: errorMsg,
      };
    }
  }
}

export const batch002Processor = new Batch002Processor();
