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
@Controller('courier')
class CourierController {
  constructor(private readonly gatewayProxyClient: GatewayProxyClient) {}

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
  providers: [GatewayProxyClient, ServiceRegistryClient, GatewayAuthGuard],
})
export class CourierModule {}
