import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { PickupsService } from '../../application/services/pickups.service';
import type {
  CancelPickupRequestInput,
  CreatePickupRequestInput,
  PickupRequest,
  UpdatePickupRequestInput,
} from '../../domain/entities/pickup-request.entity';

@Controller('pickups')
export class PickupsController {
  constructor(private readonly pickupsService: PickupsService) {}

  @Get()
  list(): Promise<PickupRequest[]> {
    return this.pickupsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<PickupRequest> {
    return this.pickupsService.getById(id);
  }

  @Post()
  create(@Body() body: CreatePickupRequestInput): Promise<PickupRequest> {
    return this.pickupsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdatePickupRequestInput,
  ): Promise<PickupRequest> {
    return this.pickupsService.update(id, body);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: CancelPickupRequestInput,
  ): Promise<PickupRequest> {
    return this.pickupsService.cancel(id, body);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string): Promise<PickupRequest> {
    return this.pickupsService.complete(id);
  }
}
