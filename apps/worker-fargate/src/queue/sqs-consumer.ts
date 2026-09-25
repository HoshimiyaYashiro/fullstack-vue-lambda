import {
  DeleteMessageCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import { sqsClient } from '../config/aws.js';
import type { JobProcessor } from '../jobs/base.processor.js';
import type { BaseJobMessage } from './types.js';

export class SqsConsumer {
  private isRunning = false;
  private queueUrl?: string;

  constructor(
    private readonly processor: JobProcessor<unknown>,
    private readonly pollWaitSeconds = 20,
    private readonly visibilityTimeout = 300 // 5 minutes for heavy batch tasks
  ) {}

  async start(): Promise<void> {
    this.isRunning = true;
    console.log(
      `[SqsConsumer] Starting consumer for job '${this.processor.jobName}' on queue '${this.processor.queueName}'`
    );

    this.queueUrl = await this.resolveQueueUrl(this.processor.queueName);
    if (!this.queueUrl) {
      console.warn(
        `[SqsConsumer] Queue '${this.processor.queueName}' not found. Polling will retry.`
      );
    }

    // Main long-polling loop
    while (this.isRunning) {
      try {
        if (!this.queueUrl) {
          this.queueUrl = await this.resolveQueueUrl(this.processor.queueName);
          if (!this.queueUrl) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
        }

        const res = await sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 5,
            WaitTimeSeconds: this.pollWaitSeconds,
            VisibilityTimeout: this.visibilityTimeout,
          })
        );

        if (!this.isRunning) break;

        const messages = res.Messages || [];
        for (const msg of messages) {
          if (!msg.Body || !msg.ReceiptHandle) continue;

          await this.handleMessage(msg.Body, msg.ReceiptHandle, msg.MessageId || 'unknown');
        }
      } catch (err: unknown) {
        if (!this.isRunning) break;
        console.warn(
          `[SqsConsumer:${this.processor.jobName}] Polling notice: ${(err as Error).message}`
        );
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    console.log(`[SqsConsumer:${this.processor.jobName}] Consumer stopped gracefully.`);
  }

  stop(): void {
    this.isRunning = false;
  }

  private async handleMessage(
    rawBody: string,
    receiptHandle: string,
    messageId: string
  ): Promise<void> {
    try {
      let parsed: BaseJobMessage;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        parsed = {
          jobId: messageId,
          jobType: this.processor.jobName,
          createdAt: new Date().toISOString(),
          payload: { raw: rawBody },
        };
      }

      // Execute processor
      const result = await this.processor.process(parsed);

      // Delete message upon successful execution
      if (result.status === 'SUCCESS' && this.queueUrl) {
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle,
          })
        );
      }
    } catch (err: unknown) {
      console.error(
        `[SqsConsumer:${this.processor.jobName}] Error processing message [${messageId}]:`,
        (err as Error).message
      );
    }
  }

  private async resolveQueueUrl(queueName: string): Promise<string | undefined> {
    try {
      const res = await sqsClient.send(new GetQueueUrlCommand({ QueueName: queueName }));
      return res.QueueUrl;
    } catch {
      return undefined;
    }
  }
}
