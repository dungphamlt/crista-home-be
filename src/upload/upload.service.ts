import { Injectable, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class UploadService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

    if (accountId && accessKeyId && secretAccessKey && this.bucketName && this.publicUrl) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  isR2Configured(): boolean {
    return this.s3Client !== null;
  }

  async uploadImage(buffer: Buffer, originalName: string, mimetype: string): Promise<string> {
    if (!this.s3Client) {
      throw new BadRequestException(
        'Cloudflare R2 chưa được cấu hình. Thêm CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_PUBLIC_URL vào .env',
      );
    }

    const ext = extname(originalName) || '.jpg';
    const key = `images/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );

    // Public URL: CLOUDFLARE_R2_PUBLIC_URL đã có sẵn base (VD: https://pub-xxx.r2.dev)
    const baseUrl = this.publicUrl.replace(/\/$/, '');
    return `${baseUrl}/${key}`;
  }
}
