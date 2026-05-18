import { Controller, Get, Query, Req, Res, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';

@UseGuards(GatewayAuthGuard)
@Controller('media')
export class MediaController {
  private s3Client: S3Client;

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

  @Get('upload-url')
  async getUploadUrl(@Query('filename') filename: string, @Query('contentType') contentType: string, @Res() response: Response) {
    if (!filename) {
      throw new HttpException('filename is required', HttpStatus.BAD_REQUEST);
    }

    const bucket = process.env.S3_BUCKET_NAME || 'nexus-pod-images';
    const datePrefix = new Date().toISOString().substring(0, 10).replace(/-/g, '/'); // YYYY/MM/DD
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const objectKey = `deliveries/${datePrefix}/${uniqueId}_${safeFilename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: contentType || 'application/octet-stream',
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });

      return response.json({
        success: true,
        data: {
          uploadUrl: presignedUrl,
          fileKey: objectKey,
          bucket: bucket,
          publicUrl: `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${bucket}/${objectKey}`
        }
      });
    } catch (error) {
      throw new HttpException('Could not generate presigned URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
