import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

export const S3_BUCKET = process.env.AWS_S3_BUCKET!;

/** Returns a presigned PUT URL valid for 5 minutes. */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  );
}

/** Returns a presigned GET URL valid for 1 hour. */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: 3600 },
  );
}

/** Deletes an object from S3. Swallows errors (e.g. already deleted). */
export async function deleteS3Object(key: string): Promise<void> {
  await getClient()
    .send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }))
    .catch(() => {});
}
