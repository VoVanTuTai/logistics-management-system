import { Controller, Get, Param } from '@nestjs/common';

import type { CurrentLocation } from '../../domain/entities/current-location.entity';
import { LocationsService } from '../../application/services/locations.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get(':shipmentCode')
  getByShipmentCode(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<CurrentLocation> {
    return this.locationsService.getByShipmentCode(shipmentCode);
  }
}
