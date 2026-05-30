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
import { GatewayRoleGuard } from '../../common/guards/gateway-role.guard';
import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';
import { GatewayProxyClient } from '../../infrastructure/clients/gateway-proxy.client';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';
import { MarketplaceAuthService } from './integrations/marketplace-auth.service';
import { MarketplaceIntegrationsService } from './integrations/marketplace-integrations.service';
import { MerchantIntegrationsController } from './integrations/merchant-integrations.controller';

@UseGuards(GatewayAuthGuard, GatewayRoleGuard)
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
  controllers: [MerchantIntegrationsController, MerchantController],
  providers: [
    AuthServiceClient,
    GatewayProxyClient,
    ServiceRegistryClient,
    GatewayAuthGuard,
    GatewayRoleGuard,
    MarketplaceAuthService,
    MarketplaceIntegrationsService,
  ],
})
export class MerchantModule {}
