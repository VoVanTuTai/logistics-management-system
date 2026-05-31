import { Controller, Get } from '@nestjs/common';

import { VietnamAdministrativeUnitsService } from '../../application/services/vietnam-administrative-units.service';
import type { VietnamProvince } from '../../domain/entities/vietnam-administrative-unit.entity';

@Controller('locations/vietnam-administrative-units')
export class VietnamAdministrativeUnitsController {
  constructor(
    private readonly vietnamAdministrativeUnitsService: VietnamAdministrativeUnitsService,
  ) {}

  @Get()
  listProvinces(): Promise<VietnamProvince[]> {
    return this.vietnamAdministrativeUnitsService.listProvinces();
  }
}
