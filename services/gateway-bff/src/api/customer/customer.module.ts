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

@UseGuards(GatewayAuthGuard, GatewayRoleGuard)
@Controller('customer')
class CustomerController {
  constructor(private readonly gatewayProxyClient: GatewayProxyClient) {}

  @All()
  handleRoot(@Res() response: Response): void {
    this.gatewayProxyClient.rejectMissingService('customer', response);
  }

  @All('*')
  async proxy(@Req() request: Request, @Res() response: Response): Promise<void> {
    await this.gatewayProxyClient.forward(
      'customer',
      request.params['0'] ?? '',
      request,
      response,
    );
  }
}

@Module({
  controllers: [CustomerController],
  providers: [
    AuthServiceClient,
    GatewayProxyClient,
    ServiceRegistryClient,
    GatewayAuthGuard,
    GatewayRoleGuard,
  ],
})
export class CustomerModule {}
