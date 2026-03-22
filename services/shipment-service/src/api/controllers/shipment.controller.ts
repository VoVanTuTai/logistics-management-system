import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ShipmentsService } from '../../application/services/shipments.service';
import type {
  CancelShipmentInput,
  CreateShipmentInput,
  Shipment,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';

@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  list(): Promise<Shipment[]> {
    return this.shipmentsService.list();
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
}
