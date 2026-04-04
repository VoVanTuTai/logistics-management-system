import { Injectable } from '@nestjs/common';

import { ReportingProjectionService } from '../../application/projections/reporting-projection.service';
import type {
  ProjectionResult,
  ReportingEventEnvelope,
} from '../../application/projections/reporting-event.types';

@Injectable()
export class ReportingEventsConsumer {
  readonly queueName = 'reporting-service.q';
  readonly retryQueue10s = 'reporting-service.retry.10s';
  readonly retryQueue1m = 'reporting-service.retry.1m';
  readonly dlqName = 'reporting-service.dlq';
  readonly routingPatterns = [
    'shipment.created',
    'pickup.requested',
    'pickup.approved',
    'task.assigned',
    'manifest.sealed',
    'manifest.received',
    'scan.pickup_confirmed',
    'scan.outbound',
    'scan.inbound',
    'delivery.attempted',
    'delivery.delivered',
    'delivery.failed',
    'ndr.created',
    'return.started',
    'return.completed',
  ];

  constructor(
    private readonly reportingProjectionService: ReportingProjectionService,
  ) {}

  handle(event: ReportingEventEnvelope): Promise<ProjectionResult> {
    return this.reportingProjectionService.project(event);
  }
}
