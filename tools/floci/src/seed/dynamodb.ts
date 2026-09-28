import {
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { flociConfig } from '../config.js';
import { dynamodb } from './clients.js';
import { isNotFound } from './errors.js';

export async function seedDynamoDB() {
  console.log('[DynamoDB] Creating tables and indexes...');
  const applicationTable = flociConfig.dynamodb.applicationTable;
  try {
    await dynamodb.send(new DescribeTableCommand({ TableName: applicationTable }));
    console.log(`  -> Table already exists: ${applicationTable}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await dynamodb.send(
      new CreateTableCommand({
        TableName: applicationTable,
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'GSI1PK', AttributeType: 'S' },
          { AttributeName: 'GSI1SK', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`  -> Created table: ${applicationTable}`);
  }

  const auditTable = flociConfig.dynamodb.auditTable;
  try {
    await dynamodb.send(new DescribeTableCommand({ TableName: auditTable }));
    console.log(`  -> Table already exists: ${auditTable}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await dynamodb.send(
      new CreateTableCommand({
        TableName: auditTable,
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );
    await dynamodb.send(
      new UpdateTimeToLiveCommand({
        TableName: auditTable,
        TimeToLiveSpecification: { Enabled: true, AttributeName: 'ttl' },
      })
    );
    console.log(`  -> Created table: ${auditTable}`);
  }
}
