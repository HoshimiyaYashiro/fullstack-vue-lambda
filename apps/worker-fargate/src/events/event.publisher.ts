import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { eventBridgeClient } from '../config/aws.js';
import { env } from '../config/env.js';

export interface DomainEvent<TDetail = unknown> {
  detailType: string;
  source?: string;
  detail: TDetail;
}

export async function publishDomainEvent<TDetail>(event: DomainEvent<TDetail>): Promise<void> {
  try {
    await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: env.EVENT_BUS_NAME,
            Source: event.source || 'enterprise.fargate.worker',
            DetailType: event.detailType,
            Detail: JSON.stringify(event.detail),
            Time: new Date(),
          },
        ],
      })
    );
    console.log(`[EventPublisher] Emitted '${event.detailType}' to ${env.EVENT_BUS_NAME}`);
  } catch (err: unknown) {
    console.warn(
      `[EventPublisher] Failed to emit event '${event.detailType}': ${(err as Error).message}`
    );
  }
}
