import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ZonesService } from '../../application/services/zones.service';
import type { Zone, ZoneWriteInput } from '../../domain/entities/zone.entity';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  list(
    @Query('code') code?: string,
    @Query('name') name?: string,
    @Query('parentCode') parentCode?: string,
    @Query('isActive') isActive?: string,
    @Query('q') q?: string,
  ): Promise<Zone[]> {
    return this.zonesService.list({
      code,
      name,
      parentCode,
      isActive,
      q,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Zone> {
    return this.zonesService.getById(id);
  }

  @Post()
  create(@Body() body: ZoneWriteInput): Promise<Zone> {
    return this.zonesService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<ZoneWriteInput>,
  ): Promise<Zone> {
    return this.zonesService.update(id, body);
  }
}
