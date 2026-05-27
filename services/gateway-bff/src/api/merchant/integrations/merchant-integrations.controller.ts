import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { MarketplaceAuthService } from './marketplace-auth.service';
import { MarketplaceIntegrationsService } from './marketplace-integrations.service';
import type { MarketplaceCreateOrderRequest } from './merchant-integrations.types';

@Controller('merchant/integrations')
export class MerchantIntegrationsController {
  constructor(
    private readonly marketplaceAuthService: MarketplaceAuthService,
    private readonly marketplaceIntegrationsService: MarketplaceIntegrationsService,
  ) {}

  @Get('health')
  getHealth(@Req() request: Request) {
    const auth = this.marketplaceAuthService.verify(request);
    return this.marketplaceIntegrationsService.getHealth(auth.partnerCode);
  }

  @Post('orders')
  async createOrder(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: MarketplaceCreateOrderRequest,
  ) {
    const auth = this.marketplaceAuthService.verify(request);
    const result = await this.marketplaceIntegrationsService.createOrder(
      body,
      auth.partnerCode,
      idempotencyKey,
    );

    response.status(result.statusCode);

    return result.body;
  }

  @Get('orders/:platform/:shopId/:externalOrderId')
  async queryOrder(
    @Req() request: Request,
    @Param('platform') platform: string,
    @Param('shopId') shopId: string,
    @Param('externalOrderId') externalOrderId: string,
  ) {
    this.marketplaceAuthService.verify(request);

    return this.marketplaceIntegrationsService.queryOrder(
      platform,
      shopId,
      externalOrderId,
    );
  }

  @Post('orders/:platform/:shopId/:externalOrderId/cancel')
  async cancelOrder(
    @Req() request: Request,
    @Param('platform') platform: string,
    @Param('shopId') shopId: string,
    @Param('externalOrderId') externalOrderId: string,
    @Body() body: { reason?: string | null },
  ) {
    this.marketplaceAuthService.verify(request);

    return this.marketplaceIntegrationsService.cancelOrder(
      platform,
      shopId,
      externalOrderId,
      body ?? {},
    );
  }

  @Get('shipments/:shipmentCode/tracking')
  async getTracking(
    @Req() request: Request,
    @Param('shipmentCode') shipmentCode: string,
  ) {
    this.marketplaceAuthService.verify(request);

    return this.marketplaceIntegrationsService.getTracking(shipmentCode);
  }

  @Get('shipments/:shipmentCode/label')
  async getLabel(
    @Req() request: Request,
    @Param('shipmentCode') shipmentCode: string,
    @Query('format') format?: string,
  ) {
    this.marketplaceAuthService.verify(request);

    return this.marketplaceIntegrationsService.getLabel(shipmentCode, format);
  }
}
