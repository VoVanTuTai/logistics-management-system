import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { ZonesService } from '../../application/services/zones.service';
import type { Zone, ZoneWriteInput } from '../../domain/entities/zone.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

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
  create(
    @Body() body: ZoneWriteInput,
    @Req() request: AuditRequest,
  ): Promise<Zone> {
    return this.zonesService.create(body, getAdminAuditContext(request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<ZoneWriteInput>,
    @Req() request: AuditRequest,
  ): Promise<Zone> {
    return this.zonesService.update(id, body, getAdminAuditContext(request));
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; zoneId: string | null }> {
    return this.zonesService.remove(id, getAdminAuditContext(request));
  }
}
