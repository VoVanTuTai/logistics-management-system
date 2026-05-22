import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { ShipmentsService } from '../../application/services/shipments.service';
import type {
  CancelShipmentInput,
  ApproveShipmentInput,
  CreateShipmentInput,
  ReviewShipmentInput,
  Shipment,
  ShipmentActionResult,
  ShipmentListFilters,
  ShipmentListPage,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';

@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  list(@Query() filters: ShipmentListFilters): Promise<Shipment[] | ShipmentListPage> {
    return this.shipmentsService.list(filters);
  }

  @Get(':code')
  getByCode(@Param('code') code: string): Promise<Shipment> {
    return this.shipmentsService.getByCode(code);
  }

  @Post()
  create(@Body() body: CreateShipmentInput): Promise<Shipment> {
    return this.shipmentsService.create(body);
  }

  @Patch(':code')
  update(
    @Param('code') code: string,
    @Body() body: UpdateShipmentInput,
  ): Promise<Shipment> {
    return this.shipmentsService.update(code, body);
  }

  @Post(':code/cancel')
  cancel(
    @Param('code') code: string,
    @Body() body: CancelShipmentInput,
  ): Promise<Shipment> {
    return this.shipmentsService.cancel(code, body);
  }

  @Post(':code/review')
  review(
    @Param('code') code: string,
    @Body() body: ReviewShipmentInput,
  ): Promise<ShipmentActionResult> {
    return this.shipmentsService.review(code, body);
  }

  @Post(':code/approve')
  approve(
    @Param('code') code: string,
    @Body() body: ApproveShipmentInput,
  ): Promise<ShipmentActionResult> {
    return this.shipmentsService.approve(code, body);
  }
}
