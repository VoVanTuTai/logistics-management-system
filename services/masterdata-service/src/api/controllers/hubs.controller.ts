import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { HubsService } from '../../application/services/hubs.service';
import type { Hub, HubWriteInput } from '../../domain/entities/hub.entity';

@Controller('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Get()
  list(): Promise<Hub[]> {
    return this.hubsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Hub> {
    return this.hubsService.getById(id);
  }

  @Post()
  create(@Body() body: HubWriteInput): Promise<Hub> {
    return this.hubsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<HubWriteInput>,
  ): Promise<Hub> {
    return this.hubsService.update(id, body);
  }
}
