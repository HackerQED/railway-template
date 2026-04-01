import { randomUUID } from 'crypto';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { storageConfig } from '../config/storage-config';
import {
  ConfigurationError,
  type StorageConfig,
  type StorageProvider,
  UploadError,
  type UploadFileParams,
  type UploadFileResult,
} from '../types';

export class S3Provider implements StorageProvider {
  private config: StorageConfig;
  private client: S3Client | null = null;

  constructor(config: StorageConfig = storageConfig) {
    this.config = config;
  }

  public getProviderName(): string {
    return 'S3';
  }

  private getClient(): S3Client {
    if (this.client) return this.client;

    const { region, endpoint, accessKeyId, secretAccessKey } = this.config;

    if (!region)
      throw new ConfigurationError('Storage region is not configured');
    if (!accessKeyId || !secretAccessKey)
      throw new ConfigurationError('Storage credentials are not configured');
    if (!endpoint) throw new ConfigurationError('Storage endpoint is required');

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: this.config.forcePathStyle ?? true,
    });

    return this.client;
  }

  private generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.split('.').pop() || '';
    const uuid = randomUUID();
    return `${uuid}${extension ? `.${extension}` : ''}`;
  }

  public async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    try {
      const { file, filename, contentType, folder } = params;
      const { bucketName } = this.config;

      if (!bucketName)
        throw new ConfigurationError('Storage bucket name is not configured');

      const uniqueFilename = this.generateUniqueFilename(filename);
      const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

      let body: Buffer;
      if (file instanceof Blob) {
        body = Buffer.from(await file.arrayBuffer());
      } else {
        body = file;
      }

      await this.getClient().send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );

      const { publicUrl } = this.config;
      let url: string;
      if (publicUrl) {
        url = `${publicUrl.replace(/\/$/, '')}/${key}`;
      } else {
        const baseUrl = this.config.endpoint?.replace(/\/$/, '') || '';
        url = `${baseUrl}/${bucketName}/${key}`;
      }

      return { url, key };
    } catch (error) {
      if (error instanceof ConfigurationError) throw error;
      const message =
        error instanceof Error ? error.message : 'Unknown error during upload';
      throw new UploadError(message);
    }
  }

  public async deleteFile(key: string): Promise<void> {
    const { bucketName } = this.config;
    if (!bucketName)
      throw new ConfigurationError('Storage bucket name is not configured');

    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  }
}
