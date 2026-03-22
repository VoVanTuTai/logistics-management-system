import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PickupsService } from '../../application/services/pickups.service';
import type {
  ApprovePickupRequestInput,
  CancelPickupRequestInput,
  CreatePickupRequestInput,
  PickupRequest,
  UpdatePickupRequestInput,
} from '../../domain/entities/pickup-request.entity';

@Controller('pickups')
export class PickupsController {
  constructor(private readonly pickupsService: PickupsService) {}

  @Get()
  list(@Query('status') status?: string): Promise<PickupRequest[]> {
    return this.pickupsService.list(status);
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

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: ApprovePickupRequestInput,
  ): Promise<PickupRequest> {
    return this.pickupsService.approve(id, body);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string): Promise<PickupRequest> {
    return this.pickupsService.complete(id);
  }
}
