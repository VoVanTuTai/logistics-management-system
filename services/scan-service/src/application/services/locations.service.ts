import { Injectable } from '@nestjs/common';

import type { CurrentLocation } from '../../domain/entities/current-location.entity';
import { ScansService } from './scans.service';

@Injectable()
export class LocationsService {
  constructor(private readonly scansService: ScansService) {}

  getByShipmentCode(shipmentCode: string): Promise<CurrentLocation> {
    return this.scansService.getCurrentLocation(shipmentCode);
  }
}
