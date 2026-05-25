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

import { HubsService } from '../../application/services/hubs.service';
import type { Hub, HubWriteInput } from '../../domain/entities/hub.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

@Controller('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Get()
  list(
    @Query('code') code?: string,
    @Query('name') name?: string,
    @Query('zoneCode') zoneCode?: string,
    @Query('isActive') isActive?: string,
    @Query('q') q?: string,
  ): Promise<Hub[]> {
    return this.hubsService.list({
      code,
      name,
      zoneCode,
      isActive,
      q,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Hub> {
    return this.hubsService.getById(id);
  }

  @Post()
  create(
    @Body() body: HubWriteInput,
    @Req() request: AuditRequest,
  ): Promise<Hub> {
    return this.hubsService.create(body, getAdminAuditContext(request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<HubWriteInput>,
    @Req() request: AuditRequest,
  ): Promise<Hub> {
    return this.hubsService.update(id, body, getAdminAuditContext(request));
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; hubId: string | null }> {
    return this.hubsService.remove(id, getAdminAuditContext(request));
  }
}
