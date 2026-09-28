import { CreateLogGroupCommand, PutRetentionPolicyCommand } from '@aws-sdk/client-cloudwatch-logs';
import { cloudWatch } from './clients.js';
import { createIfMissing } from './errors.js';

export async function seedCloudWatch() {
  console.log('[CloudWatch] Creating log groups and retention policies...');
  for (const logGroupName of [
    '/aws/lambda/enterprise-worker-lambda',
    '/aws/ecs/enterprise-fargate-worker',
    '/aws/apigateway/enterprise-http-api',
    '/aws/events/enterprise-audit',
  ]) {
    await createIfMissing(
      () => cloudWatch.send(new CreateLogGroupCommand({ logGroupName })),
      `CloudWatch log group ${logGroupName}`
    );
    await cloudWatch.send(new PutRetentionPolicyCommand({ logGroupName, retentionInDays: 7 }));
  }
}
