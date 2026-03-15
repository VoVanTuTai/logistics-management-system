import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CancelShipmentInput,
  CreateShipmentInput,
  Shipment,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';
import type { ShipmentConsumedEventType } from '../../domain/entities/shipment-status.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentStateMachine } from '../../domain/state-machine/shipment-state-machine';
import { ShipmentOutboxService } from '../../messaging/outbox/shipment-outbox.service';

@Injectable()
export class ShipmentsService {
  constructor(
    @Inject(ShipmentRepository)
    private readonly shipmentRepository: ShipmentRepository,
    private readonly shipmentStateMachine: ShipmentStateMachine,
    private readonly shipmentOutboxService: ShipmentOutboxService,
  ) {}

  list(): Promise<Shipment[]> {
    return this.shipmentRepository.list();
  }

  async getByCode(code: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findByCode(code);

    if (!shipment) {
      throw new NotFoundException(`Shipment "${code}" was not found.`);
    }

    return shipment;
  }

  async create(input: CreateShipmentInput): Promise<Shipment> {
    const shipment = await this.shipmentRepository.create(input);

    await this.shipmentOutboxService.enqueueShipmentCreated(shipment);

    return shipment;
  }

  async update(code: string, input: UpdateShipmentInput): Promise<Shipment> {
    await this.getByCode(code);

    const shipment = await this.shipmentRepository.update(code, input);

    await this.shipmentOutboxService.enqueueShipmentUpdated(shipment, {
      source: 'api',
    });

    return shipment;
  }

  async cancel(code: string, input: CancelShipmentInput): Promise<Shipment> {
    const shipment = await this.getByCode(code);

    if (!this.shipmentStateMachine.canCancel(shipment.currentStatus)) {
      throw new ConflictException(
        `Shipment "${code}" cannot be cancelled from status "${shipment.currentStatus}".`,
      );
    }

    const cancelledShipment = await this.shipmentRepository.cancel(
      code,
      input.reason ?? null,
    );

    await this.shipmentOutboxService.enqueueShipmentCancelled(cancelledShipment, {
      reason: input.reason ?? null,
    });

    return cancelledShipment;
  }

  async applyExternalEvent(
    code: string,
    eventType: ShipmentConsumedEventType,
    data: Record<string, unknown> = {},
  ): Promise<Shipment> {
    const shipment = await this.getByCode(code);
    const nextStatus = this.shipmentStateMachine.resolveNextStatus(
      shipment.currentStatus,
      eventType,
    );
    const updatedShipment = await this.shipmentRepository.updateCurrentStatus(
      code,
      nextStatus,
    );

    await this.shipmentOutboxService.enqueueShipmentUpdated(updatedShipment, {
      source_event: eventType,
      payload: data,
    });

    return updatedShipment;
  }
}
