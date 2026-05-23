import {
  All,
  Controller,
  Module,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';
import { GatewayProxyClient } from '../../infrastructure/clients/gateway-proxy.client';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';

@UseGuards(GatewayAuthGuard)
@Controller('merchant')
class MerchantController {
  constructor(private readonly gatewayProxyClient: GatewayProxyClient) {}

  @All()
  handleRoot(@Res() response: Response): void {
    this.gatewayProxyClient.rejectMissingService('merchant', response);
  }

  @All('*')
  async proxy(@Req() request: Request, @Res() response: Response): Promise<void> {
    await this.gatewayProxyClient.forward(
      'merchant',
      request.params['0'] ?? '',
      request,
      response,
    );
  }
}

@Module({
  controllers: [MerchantController],
  providers: [GatewayProxyClient, ServiceRegistryClient, GatewayAuthGuard],
})
export class MerchantModule {}
