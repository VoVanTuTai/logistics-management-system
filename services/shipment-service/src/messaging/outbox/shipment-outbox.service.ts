import { Inject, Injectable } from '@nestjs/common';

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
}
