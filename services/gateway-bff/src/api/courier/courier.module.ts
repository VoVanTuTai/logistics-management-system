import {
  All,
  Controller,
  Get,
  Module,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { CourierPermissionGuard } from '../../common/guards/courier-permission.guard';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';
import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';
import { GatewayProxyClient } from '../../infrastructure/clients/gateway-proxy.client';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';
import {
  MediaUploadService,
  type MediaUploadUrlResponse,
} from '../media/media-upload.service';

@UseGuards(GatewayAuthGuard, CourierPermissionGuard)
@Controller('courier')
class CourierController {
  constructor(
    private readonly gatewayProxyClient: GatewayProxyClient,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  @Get('media/upload-url')
  getUploadUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ): Promise<MediaUploadUrlResponse> {
    return this.mediaUploadService.createUploadUrl(filename, contentType);
  }

  @All()
  handleRoot(@Res() response: Response): void {
    this.gatewayProxyClient.rejectMissingService('courier', response);
  }

  @All('*')
  async proxy(@Req() request: Request, @Res() response: Response): Promise<void> {
    await this.gatewayProxyClient.forward(
      'courier',
      request.params['0'] ?? '',
      request,
      response,
    );
  }
}

@Module({
  controllers: [CourierController],
  providers: [
    AuthServiceClient,
    CourierPermissionGuard,
    GatewayProxyClient,
    ServiceRegistryClient,
    GatewayAuthGuard,
    MediaUploadService,
  ],
})
export class CourierModule {}
