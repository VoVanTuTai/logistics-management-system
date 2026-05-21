import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface MediaUploadUrlResponse {
  success: true;
  data: {
    uploadUrl: string;
    fileKey: string;
    bucket: string;
    publicUrl: string;
  };
}

@Injectable()
export class MediaUploadService {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    });
  }

  async createUploadUrl(
    filename: string,
    contentType?: string,
  ): Promise<MediaUploadUrlResponse> {
    if (!filename) {
      throw new HttpException('filename is required', HttpStatus.BAD_REQUEST);
    }

    const bucket = process.env.S3_BUCKET_NAME || 'nexus-pod-images';
    const datePrefix = new Date().toISOString().substring(0, 10).replace(/-/g, '/');
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const objectKey = `deliveries/${datePrefix}/${uniqueId}_${safeFilename || 'pod.jpg'}`;
    const resolvedContentType = contentType || 'application/octet-stream';

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: resolvedContentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 300,
      });

      return {
        success: true,
        data: {
          uploadUrl,
          fileKey: objectKey,
          bucket,
          publicUrl: `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${bucket}/${objectKey}`,
        },
      };
    } catch {
      throw new HttpException(
        'Could not generate presigned URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
