import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";

/**
 * S3-compatible object storage (MinIO locally). All document bytes live here —
 * never in Postgres. Objects are private; the only way a client gets bytes is a
 * short-lived presigned URL minted after an authorization + access-log check
 * (docs/SECURITY.md §4).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly ttl: number;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.bucket = config.storage.bucket;
    this.ttl = config.storage.signedUrlTtl;
    this.client = new S3Client({
      endpoint: config.storage.endpoint,
      region: config.storage.region,
      forcePathStyle: config.storage.forcePathStyle,
      credentials: {
        accessKeyId: config.storage.accessKey,
        secretAccessKey: config.storage.secretKey,
      },
    });
  }

  /** Deterministic object key: keeps every version of a document together. */
  buildKey(parts: {
    clientId?: string | null;
    scopeType: string;
    scopeId: string;
    documentId: string;
    versionId: string;
  }): string {
    const prefix = parts.clientId ? `client/${parts.clientId}` : "shared";
    return `${prefix}/${parts.scopeType.toLowerCase()}/${parts.scopeId}/${parts.documentId}/${parts.versionId}`;
  }

  presignUpload(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: this.ttl },
    );
  }

  presignDownload(key: string, filename?: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ...(filename
          ? { ResponseContentDisposition: `attachment; filename="${filename}"` }
          : {}),
      }),
      { expiresIn: this.ttl },
    );
  }

  async head(key: string): Promise<{ exists: boolean; sizeBytes?: number }> {
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { exists: true, sizeBytes: res.ContentLength };
    } catch {
      return { exists: false };
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn({ err, key }, "Failed to delete object");
    }
  }
}
