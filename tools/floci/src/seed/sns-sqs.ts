import { CreateTopicCommand, SubscribeCommand } from '@aws-sdk/client-sns';
import { CreateQueueCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { flociConfig } from '../config.js';
import { sns, sqs } from './clients.js';

export async function seedSnsSqs() {
  console.log('[SNS/SQS] Creating queues, topics, and subscription...');
  await sqs.send(new CreateQueueCommand({ QueueName: flociConfig.messaging.deadLetterQueue }));
  const queue = await sqs.send(
    new CreateQueueCommand({ QueueName: flociConfig.messaging.workerQueue })
  );
  const queueUrl = queue.QueueUrl;
  if (!queueUrl) throw new Error('SQS did not return a URL for the worker queue.');

  const alerts = await sns.send(new CreateTopicCommand({ Name: flociConfig.messaging.alertTopic }));
  await sns.send(
    new CreateTopicCommand({
      Name: flociConfig.messaging.notificationTopic,
      Attributes: { FifoTopic: 'true', ContentBasedDeduplication: 'true' },
    })
  );
  const queueAttributes = await sqs.send(
    new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['QueueArn'] })
  );

  if (alerts.TopicArn && queueAttributes.Attributes?.QueueArn) {
    await sns.send(
      new SubscribeCommand({
        TopicArn: alerts.TopicArn,
        Protocol: 'sqs',
        Endpoint: queueAttributes.Attributes.QueueArn,
      })
    );
  }
}
