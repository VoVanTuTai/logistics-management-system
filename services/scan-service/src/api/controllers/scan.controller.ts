import { Body, Controller, Post, Req } from '@nestjs/common';

import type {
  RecordInboundScanInput,
  RecordOutboundScanInput,
  RecordPickupScanInput,
  RecordScanResult,
} from '../../domain/entities/scan-event.entity';
import { ScansService } from '../../application/services/scans.service';
import {
  type AuditRequest,
  getOpsAuditContext,
} from './ops-audit-context';

@Controller('scans')
export class ScanController {
  constructor(private readonly scansService: ScansService) {}

  @Post('pickup')
  recordPickup(
    @Body() body: RecordPickupScanInput,
    @Req() request: AuditRequest,
  ): Promise<RecordScanResult> {
    return this.scansService.recordPickup(body, getOpsAuditContext(request));
  }

  @Post('inbound')
  recordInbound(
    @Body() body: RecordInboundScanInput,
    @Req() request: AuditRequest,
  ): Promise<RecordScanResult> {
    return this.scansService.recordInbound(body, getOpsAuditContext(request));
  }

  @Post('outbound')
  recordOutbound(
    @Body() body: RecordOutboundScanInput,
    @Req() request: AuditRequest,
  ): Promise<RecordScanResult> {
    return this.scansService.recordOutbound(body, getOpsAuditContext(request));
  }
}
