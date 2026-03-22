import { Injectable } from '@nestjs/common';

import { ScansService } from './scans.service';

export interface ManifestSealedPayload {
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class ScanEventHandlersService {
  constructor(private readonly scansService: ScansService) {}

  handleManifestSealed(
    payload: ManifestSealedPayload,
  ): Promise<{ accepted: boolean; shipmentCode: string | null }> {
    return this.scansService.handleManifestSealed(payload);
  }
}
