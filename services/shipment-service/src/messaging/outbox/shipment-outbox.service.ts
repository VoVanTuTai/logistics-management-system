import { Inject, Injectable } from '@nestjs/common';

import type { ChangeRequest } from '../../domain/entities/change-request.entity';
import type { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import type { Shipment } from '../../domain/entities/shipment.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { ShipmentEventsProducer } from '../producers/shipment-events.producer';

@Injectable()
export class ShipmentOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly shipmentEventsProducer: ShipmentEventsProducer,
  ) {}

  enqueueShipmentCreated(shipment: Shipment): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.shipmentEventsProducer.buildShipmentCreatedEvent(shipment),
    );
  }

  enqueueShipmentUpdated(
    shipment: Shipment,
    data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.shipmentEventsProducer.buildShipmentUpdatedEvent(shipment, data),
    );
  }

  enqueueShipmentCancelled(
    shipment: Shipment,
    data: Record<string, unknown>,
  ): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.shipmentEventsProducer.buildShipmentCancelledEvent(shipment, data),
    );
  }

  enqueueChangeRequested(changeRequest: ChangeRequest): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.shipmentEventsProducer.buildChangeRequestedEvent(changeRequest),
    );
  }

  enqueueChangeApproved(changeRequest: ChangeRequest): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.shipmentEventsProducer.buildChangeApprovedEvent(changeRequest),
    );
  }
}
