import { CreateClusterCommand, RegisterTaskDefinitionCommand } from '@aws-sdk/client-ecs';
import { flociConfig } from '../config.js';
import { ecs } from './clients.js';
import { createIfMissing } from './errors.js';

export async function seedEcs() {
  console.log('[ECS] Creating cluster and registering worker task definition...');
  await createIfMissing(
    () => ecs.send(new CreateClusterCommand({ clusterName: flociConfig.ecs.cluster })),
    `ECS cluster ${flociConfig.ecs.cluster}`
  );
  await ecs.send(
    new RegisterTaskDefinitionCommand({
      family: flociConfig.ecs.taskFamily,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      containerDefinitions: [
        {
          name: 'enterprise-worker',
          image: 'enterprise-worker:latest',
          essential: true,
          environment: [
            { name: 'NODE_ENV', value: 'development' },
            { name: 'AWS_REGION', value: flociConfig.region },
            { name: 'AWS_ENDPOINT_URL', value: 'http://floci:4566' },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': '/aws/ecs/enterprise-fargate-worker',
              'awslogs-region': flociConfig.region,
              'awslogs-stream-prefix': 'worker',
            },
          },
        },
      ],
    })
  );
}
