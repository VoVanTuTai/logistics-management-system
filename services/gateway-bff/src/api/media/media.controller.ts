import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';
import {
  MediaUploadService,
  type MediaUploadUrlResponse,
} from './media-upload.service';

@UseGuards(GatewayAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaUploadService: MediaUploadService) {}

  @Get('upload-url')
  getUploadUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ): Promise<MediaUploadUrlResponse> {
    return this.mediaUploadService.createUploadUrl(filename, contentType);
  }
}
