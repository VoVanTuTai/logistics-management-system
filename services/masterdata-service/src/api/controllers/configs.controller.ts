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

import { ConfigsService } from '../../application/services/configs.service';
import type { Config, ConfigWriteInput } from '../../domain/entities/config.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get()
  list(
    @Query('key') key?: string,
    @Query('scope') scope?: string,
    @Query('q') q?: string,
  ): Promise<Config[]> {
    return this.configsService.list({
      key,
      scope,
      q,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Config> {
    return this.configsService.getById(id);
  }

  @Post()
  create(
    @Body() body: ConfigWriteInput,
    @Req() request: AuditRequest,
  ): Promise<Config> {
    return this.configsService.create(body, getAdminAuditContext(request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<ConfigWriteInput>,
    @Req() request: AuditRequest,
  ): Promise<Config> {
    return this.configsService.update(id, body, getAdminAuditContext(request));
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; configId: string | null }> {
    return this.configsService.remove(id, getAdminAuditContext(request));
  }
}
