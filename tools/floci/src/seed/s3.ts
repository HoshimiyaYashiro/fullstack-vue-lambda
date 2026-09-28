import {
  type BucketLocationConstraint,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { flociConfig } from '../config.js';
import { s3 } from './clients.js';
import { isAlreadyExists, isNotFound } from './errors.js';

export async function seedS3() {
  console.log('[S3] Creating buckets and applying CORS...');
  const buckets = [
    flociConfig.buckets.publicAssets,
    flociConfig.buckets.privateUploads,
    flociConfig.buckets.exportReports,
  ];

  for (const bucket of buckets) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`  -> Bucket already exists: ${bucket}`);
    } catch (error) {
      if (!isNotFound(error)) throw error;
      try {
        await s3.send(
          new CreateBucketCommand({
            Bucket: bucket,
            CreateBucketConfiguration: {
              LocationConstraint: flociConfig.region as BucketLocationConstraint,
            },
          })
        );
      } catch (createError) {
        if (!isAlreadyExists(createError)) throw createError;
      }
      console.log(`  -> Created bucket: ${bucket}`);
    }
  }

  await s3.send(
    new PutBucketCorsCommand({
      Bucket: flociConfig.buckets.privateUploads,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    })
  );
}
