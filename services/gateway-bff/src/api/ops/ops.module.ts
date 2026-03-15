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
@Controller('ops')
class OpsController {
  constructor(private readonly gatewayProxyClient: GatewayProxyClient) {}

  @All()
  handleRoot(@Res() response: Response): void {
    this.gatewayProxyClient.rejectMissingService('ops', response);
  }

  @All('*')
  async proxy(@Req() request: Request, @Res() response: Response): Promise<void> {
    await this.gatewayProxyClient.forward(
      'ops',
      request.params['0'] ?? '',
      request,
      response,
    );
  }
}

@Module({
  controllers: [OpsController],
  providers: [GatewayProxyClient, ServiceRegistryClient, GatewayAuthGuard],
})
export class OpsModule {}
