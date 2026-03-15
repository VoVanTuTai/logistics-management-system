import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CancelPickupRequestInput,
  CreatePickupRequestInput,
  PickupRequest,
  UpdatePickupRequestInput,
} from '../../domain/entities/pickup-request.entity';
import { PickupRequestRepository } from '../../domain/repositories/pickup-request.repository';
import { PickupOutboxService } from '../../messaging/outbox/pickup-outbox.service';

@Injectable()
export class PickupsService {
  constructor(
    @Inject(PickupRequestRepository)
    private readonly pickupRequestRepository: PickupRequestRepository,
    private readonly pickupOutboxService: PickupOutboxService,
  ) {}

  list(): Promise<PickupRequest[]> {
    return this.pickupRequestRepository.list();
  }

  async getById(id: string): Promise<PickupRequest> {
    const pickupRequest = await this.pickupRequestRepository.findById(id);

    if (!pickupRequest) {
      throw new NotFoundException(`Pickup request "${id}" was not found.`);
    }

    return pickupRequest;
  }

  async create(input: CreatePickupRequestInput): Promise<PickupRequest> {
    const pickupRequest = await this.pickupRequestRepository.create(input);

    await this.pickupOutboxService.enqueuePickupRequested(pickupRequest);

    return pickupRequest;
  }

  async update(
    id: string,
    input: UpdatePickupRequestInput,
  ): Promise<PickupRequest> {
    await this.getById(id);

    const pickupRequest = await this.pickupRequestRepository.update(id, input);

    await this.pickupOutboxService.enqueuePickupUpdated(pickupRequest, {
      source: 'api',
    });

    return pickupRequest;
  }

  async cancel(
    id: string,
    input: CancelPickupRequestInput,
  ): Promise<PickupRequest> {
    await this.getById(id);

    const pickupRequest = await this.pickupRequestRepository.cancel(
      id,
      input.reason ?? null,
    );

    await this.pickupOutboxService.enqueuePickupCancelled(pickupRequest, {
      reason: input.reason ?? null,
    });

    return pickupRequest;
  }

  async complete(id: string): Promise<PickupRequest> {
    await this.getById(id);

    const pickupRequest = await this.pickupRequestRepository.complete(id);

    await this.pickupOutboxService.enqueuePickupCompleted(pickupRequest);

    return pickupRequest;
  }

  async cancelByShipmentCode(
    shipmentCode: string,
    reason: string,
  ): Promise<PickupRequest | null> {
    const pickupRequest = await this.pickupRequestRepository.findByShipmentCode(
      shipmentCode,
    );

    if (!pickupRequest) {
      return null;
    }

    const cancelledPickupRequest = await this.pickupRequestRepository.cancel(
      pickupRequest.id,
      reason,
    );

    await this.pickupOutboxService.enqueuePickupCancelled(
      cancelledPickupRequest,
      {
        source_event: 'shipment.cancelled',
        shipment_code: shipmentCode,
      },
    );

    return cancelledPickupRequest;
  }
}
