import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';

import type {
  CourierCurrentLocation,
  CourierLocationHistory,
  CurrentLocation,
} from '../../domain/entities/current-location.entity';
import {
  LocationsService,
  type RecordCourierLocationRequest,
} from '../../application/services/locations.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('couriers/current')
  @HttpCode(201)
  recordCourierLocation(
    @Body() body: RecordCourierLocationRequest,
  ): Promise<CourierCurrentLocation> {
    return this.locationsService.recordCourierLocation(body);
  }

  @Get('couriers/:courierId/current')
  getByCourierId(
    @Param('courierId') courierId: string,
  ): Promise<CourierCurrentLocation> {
    return this.locationsService.getByCourierId(courierId);
  }

  @Get('couriers/:courierId/history')
  getCourierHistory(
    @Param('courierId') courierId: string,
    @Query('limit') limit?: string,
  ): Promise<CourierLocationHistory[]> {
    return this.locationsService.getCourierHistory(courierId, limit);
  }

  @Get(':shipmentCode/latest-position')
  getLatestPositionByShipmentCode(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<CourierCurrentLocation | CurrentLocation> {
    return this.locationsService.getLatestPositionByShipmentCode(shipmentCode);
  }

  @Get(':shipmentCode/history')
  getShipmentHistory(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<CourierLocationHistory[]> {
    return this.locationsService.getShipmentHistory(shipmentCode);
  }

  @Get(':shipmentCode')
  getByShipmentCode(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<CurrentLocation> {
    return this.locationsService.getByShipmentCode(shipmentCode);
  }
}

