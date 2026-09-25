import type { Readable } from 'node:stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client } from '../config/aws.js';

export interface S3UploadResult {
  bucket: string;
  key: string;
  location?: string;
}

/**
 * Retrieves an object from S3 as a readable stream.
 * Eliminates in-memory buffering for large files.
 */
export async function getS3ObjectStream(bucket: string, key: string): Promise<Readable> {
  const res = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  if (!res.Body) {
    throw new Error(`S3 Object ${bucket}/${key} has an empty body.`);
  }

  return res.Body as unknown as Readable;
}

/**
 * Uploads a stream directly to S3 using multipart uploads without loading into memory.
 */
export async function uploadS3Stream(
  bucket: string,
  key: string,
  body: Readable,
  contentType = 'application/octet-stream'
): Promise<S3UploadResult> {
  const parallelUpload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5, // 5 MB part size
    leavePartsOnError: false,
  });

  const result = await parallelUpload.done();

  return {
    bucket,
    key,
    location: result.Location,
  };
}
