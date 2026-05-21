import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';
import { MediaUploadService } from './media-upload.service';

@Module({
  controllers: [MediaController],
  providers: [GatewayAuthGuard, MediaUploadService],
  exports: [MediaUploadService],
})
export class MediaModule {}
