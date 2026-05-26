import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import {
  NdrService,
  type NdrReturnDecisionResult,
} from '../../application/services/ndr.service';
import type {
  CreateNdrCaseInput,
  NdrCase,
  ReportShipmentExceptionInput,
  ReturnDecisionInput,
  RescheduleNdrCaseInput,
} from '../../domain/entities/ndr-case.entity';
import {
  type AuditRequest,
  getOpsAuditContext,
} from './ops-audit-context';

@Controller('ndr')
export class NdrController {
  constructor(private readonly ndrService: NdrService) {}

  @Get()
  list(
    @Query('shipmentCode') shipmentCode?: string,
    @Query('status') status?: string,
  ): Promise<NdrCase[]> {
    return this.ndrService.list({ shipmentCode, status });
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<NdrCase> {
    return this.ndrService.detail(id);
  }

  @Post()
  create(@Body() body: CreateNdrCaseInput): Promise<NdrCase> {
    return this.ndrService.create(body);
  }

  @Post('exception')
  reportException(@Body() body: ReportShipmentExceptionInput): Promise<NdrCase> {
    return this.ndrService.reportShipmentException(body);
  }

  @Post(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() body: RescheduleNdrCaseInput,
    @Req() request: AuditRequest,
  ): Promise<NdrCase> {
    return this.ndrService.reschedule(id, body, getOpsAuditContext(request));
  }

  @Post(':id/return-decision')
  returnDecision(
    @Param('id') id: string,
    @Body() body: ReturnDecisionInput,
    @Req() request: AuditRequest,
  ): Promise<NdrReturnDecisionResult> {
    return this.ndrService.returnDecision(id, body, getOpsAuditContext(request));
  }
}
