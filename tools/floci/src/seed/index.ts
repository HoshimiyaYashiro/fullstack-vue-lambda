import { seedApiGateway } from './api-gateway.js';
import { closeAwsClients } from './clients.js';
import { seedCloudWatch } from './cloudwatch.js';
import { seedCognito } from './cognito.js';
import { seedDatabase } from './database.js';
import { seedDynamoDB } from './dynamodb.js';
import { seedEcs } from './ecs.js';
import { seedEventBridge } from './eventbridge.js';
import { seedS3 } from './s3.js';
import { seedSes } from './ses.js';
import { seedSnsSqs } from './sns-sqs.js';

const seeders = {
  s3: seedS3,
  dynamodb: seedDynamoDB,
  cognito: seedCognito,
  'sns-sqs': seedSnsSqs,
  eventbridge: seedEventBridge,
  ses: seedSes,
  cloudwatch: seedCloudWatch,
  ecs: seedEcs,
  'api-gateway': seedApiGateway,
  database: seedDatabase,
} satisfies Record<string, () => Promise<void>>;

type SeedService = keyof typeof seeders;

function printUsage() {
  console.log('Usage: pnpm floci:seed [-- <all|service...>]');
  console.log('Omitting service names runs all seeds. Multiple services may be listed.');
  console.log(`Services: ${Object.keys(seeders).join(', ')}`);
  console.log('Examples: pnpm floci:seed -- cognito');
  console.log('          pnpm floci:seed -- s3 cognito database');
}

function selectServices(args: string[]): SeedService[] {
  const requested = args
    .filter((arg) => arg !== '--')
    .flatMap((arg) => arg.split(','))
    .map((service) => service.trim().toLowerCase())
    .filter(Boolean);

  if (requested.length === 0 || (requested.length === 1 && requested[0] === 'all')) {
    return Object.keys(seeders) as SeedService[];
  }

  if (requested.includes('all')) {
    throw new Error('Use "all" by itself or list individual services, not both.');
  }

  const unknown = requested.filter((service) => !Object.hasOwn(seeders, service));
  if (unknown.length > 0) {
    throw new Error(`Unknown seed service: ${unknown.join(', ')}`);
  }

  const selected = new Set(requested as SeedService[]);
  return (Object.keys(seeders) as SeedService[]).filter((service) => selected.has(service));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    await closeAwsClients();
    return;
  }

  let selectedServices: SeedService[];
  try {
    selectedServices = selectServices(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    process.exitCode = 1;
    await closeAwsClients();
    return;
  }

  console.log(`Seeding services: ${selectedServices.join(', ')}\n`);
  try {
    for (const service of selectedServices) {
      await seeders[service]();
    }
    console.log('\n✅ Floci seeding completed.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Floci seeding failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await closeAwsClients();
  }
}

main();
