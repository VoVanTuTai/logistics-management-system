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

import { NdrReasonsService } from '../../application/services/ndr-reasons.service';
import type {
  NdrReason,
  NdrReasonWriteInput,
} from '../../domain/entities/ndr-reason.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

@Controller('ndr-reasons')
export class NdrReasonsController {
  constructor(private readonly ndrReasonsService: NdrReasonsService) {}

  @Get()
  list(
    @Query('code') code?: string,
    @Query('description') description?: string,
    @Query('isActive') isActive?: string,
    @Query('q') q?: string,
  ): Promise<NdrReason[]> {
    return this.ndrReasonsService.list({
      code,
      description,
      isActive,
      q,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<NdrReason> {
    return this.ndrReasonsService.getById(id);
  }

  @Post()
  create(
    @Body() body: NdrReasonWriteInput,
    @Req() request: AuditRequest,
  ): Promise<NdrReason> {
    return this.ndrReasonsService.create(body, getAdminAuditContext(request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<NdrReasonWriteInput>,
    @Req() request: AuditRequest,
  ): Promise<NdrReason> {
    return this.ndrReasonsService.update(id, body, getAdminAuditContext(request));
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; ndrReasonId: string | null }> {
    return this.ndrReasonsService.remove(id, getAdminAuditContext(request));
  }
}
