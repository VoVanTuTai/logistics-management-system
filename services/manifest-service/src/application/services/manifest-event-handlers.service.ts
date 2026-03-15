import { Injectable } from '@nestjs/common';

import { ManifestsService } from './manifests.service';

export interface ScanOutboundPayload {
  shipment_code?: string | null;
  data?: Record<string, unknown>;
}

@Injectable()
export class ManifestEventHandlersService {
  constructor(private readonly manifestsService: ManifestsService) {}

  async handleScanOutbound(payload: ScanOutboundPayload): Promise<void> {
    await this.manifestsService.handleScanOutbound(payload);
  }
}
