import { Injectable } from '@nestjs/common';

import {
  type ManifestSealedPayload,
  ScanEventHandlersService,
} from '../../application/services/scan-event-handlers.service';

export interface ManifestSealedEnvelope extends ManifestSealedPayload {
  event_id?: string;
  event_type: 'manifest.sealed';
  occurred_at?: string;
  idempotency_key?: string;
}

@Injectable()
export class ScanEventsConsumer {
  readonly queueName = 'scan-service.q';
  readonly retryQueue10s = 'scan-service.retry.10s';
  readonly retryQueue1m = 'scan-service.retry.1m';
  readonly dlqName = 'scan-service.dlq';
  readonly routingPatterns = ['manifest.sealed'];

  constructor(
    private readonly scanEventHandlersService: ScanEventHandlersService,
  ) {}

  handle(
    event: ManifestSealedEnvelope,
  ): Promise<{ accepted: boolean; shipmentCode: string | null }> {
    return this.scanEventHandlersService.handleManifestSealed(event);
  }
}
