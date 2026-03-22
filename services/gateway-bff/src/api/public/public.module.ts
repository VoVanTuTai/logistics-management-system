import { All, Controller, Module, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { GatewayProxyClient } from '../../infrastructure/clients/gateway-proxy.client';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';

@Controller('public')
class PublicController {
  constructor(private readonly gatewayProxyClient: GatewayProxyClient) {}

  @All()
  handleRoot(@Res() response: Response): void {
    this.gatewayProxyClient.rejectMissingService('public', response);
  }

  @All('*')
  async proxy(@Req() request: Request, @Res() response: Response): Promise<void> {
    await this.gatewayProxyClient.forward(
      'public',
      request.params['0'] ?? '',
      request,
      response,
    );
  }
}

@Module({
  controllers: [PublicController],
  providers: [GatewayProxyClient, ServiceRegistryClient],
})
export class PublicModule {}
