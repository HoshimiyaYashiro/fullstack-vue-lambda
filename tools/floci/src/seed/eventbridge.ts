import { CreateEventBusCommand, PutRuleCommand } from '@aws-sdk/client-eventbridge';
import { flociConfig } from '../config.js';
import { eventBridge } from './clients.js';
import { createIfMissing } from './errors.js';

export async function seedEventBridge() {
  console.log('[EventBridge] Creating event bus and rule...');
  await createIfMissing(
    () => eventBridge.send(new CreateEventBusCommand({ Name: flociConfig.messaging.eventBus })),
    `EventBridge bus ${flociConfig.messaging.eventBus}`
  );
  await eventBridge.send(
    new PutRuleCommand({
      Name: 'enterprise-domain-events-rule',
      EventBusName: flociConfig.messaging.eventBus,
      EventPattern: JSON.stringify({ source: [{ prefix: 'enterprise.' }] }),
      State: 'ENABLED',
    })
  );
}
