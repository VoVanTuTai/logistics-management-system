import { Injectable } from '@nestjs/common';

import {
  ManifestEventHandlersService,
  type ScanOutboundPayload,
} from '../../application/services/manifest-event-handlers.service';

export interface ManifestConsumerEnvelope extends ScanOutboundPayload {
  event_type: 'scan.outbound';
}

@Injectable()
export class ManifestEventsConsumer {
  readonly queueName = 'manifest-service.q';
  readonly retryQueues = ['manifest-service.retry.10s', 'manifest-service.retry.1m'];
  readonly deadLetterQueue = 'manifest-service.dlq';
  readonly routingPatterns = ['scan.outbound'];

  constructor(
    private readonly manifestEventHandlersService: ManifestEventHandlersService,
  ) {}

  async handle(payload: ManifestConsumerEnvelope): Promise<void> {
    await this.manifestEventHandlersService.handleScanOutbound(payload);
  }
}
