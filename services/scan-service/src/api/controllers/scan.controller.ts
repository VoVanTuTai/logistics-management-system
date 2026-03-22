import { Body, Controller, Post } from '@nestjs/common';

import type {
  RecordInboundScanInput,
  RecordOutboundScanInput,
  RecordPickupScanInput,
  RecordScanResult,
} from '../../domain/entities/scan-event.entity';
import { ScansService } from '../../application/services/scans.service';

@Controller('scans')
export class ScanController {
  constructor(private readonly scansService: ScansService) {}

  @Post('pickup')
  recordPickup(
    @Body() body: RecordPickupScanInput,
  ): Promise<RecordScanResult> {
    return this.scansService.recordPickup(body);
  }

  @Post('inbound')
  recordInbound(
    @Body() body: RecordInboundScanInput,
  ): Promise<RecordScanResult> {
    return this.scansService.recordInbound(body);
  }

  @Post('outbound')
  recordOutbound(
    @Body() body: RecordOutboundScanInput,
  ): Promise<RecordScanResult> {
    return this.scansService.recordOutbound(body);
  }
}
