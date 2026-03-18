import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ApprovePickupRequestInput,
  CancelPickupRequestInput,
  CreatePickupRequestInput,
  PickupRequest,
  PickupRequestStatus,
  UpdatePickupRequestInput,
} from '../../domain/entities/pickup-request.entity';
import { PickupRequestRepository } from '../../domain/repositories/pickup-request.repository';
import { PickupOutboxService } from '../../messaging/outbox/pickup-outbox.service';

const PICKUP_REQUEST_STATUS_SET = new Set<PickupRequestStatus>([
  'REQUESTED',
  'APPROVED',
  'CANCELLED',
  'COMPLETED',
]);

@Injectable()
export class PickupsService {
  constructor(
    @Inject(PickupRequestRepository)
    private readonly pickupRequestRepository: PickupRequestRepository,
    private readonly pickupOutboxService: PickupOutboxService,
  ) {}

  list(status?: string): Promise<PickupRequest[]> {
    const normalizedStatus = status?.trim().toUpperCase();

    if (!normalizedStatus) {
      return this.pickupRequestRepository.list();
    }

    if (!PICKUP_REQUEST_STATUS_SET.has(normalizedStatus as PickupRequestStatus)) {
      throw new BadRequestException(
        `Invalid pickup status filter "${status}". Expected one of REQUESTED, APPROVED, CANCELLED, COMPLETED.`,
      );
    }

    return this.pickupRequestRepository.list(
      normalizedStatus as PickupRequestStatus,
    );
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
    const current = await this.getById(id);

    if (current.status === 'CANCELLED') {
      return current;
    }

    if (current.status === 'COMPLETED') {
      throw new BadRequestException(
        `Pickup request "${id}" was completed and cannot be cancelled.`,
      );
    }

    const pickupRequest = await this.pickupRequestRepository.cancel(
      id,
      input.reason ?? null,
    );

    await this.pickupOutboxService.enqueuePickupCancelled(pickupRequest, {
      reason: input.reason ?? null,
    });

    return pickupRequest;
  }

  async approve(
    id: string,
    input: ApprovePickupRequestInput,
  ): Promise<PickupRequest> {
    const current = await this.getById(id);

    if (current.status === 'APPROVED') {
      return current;
    }

    if (current.status === 'CANCELLED' || current.status === 'COMPLETED') {
      throw new BadRequestException(
        `Pickup request "${id}" cannot be approved from status "${current.status}".`,
      );
    }

    const approvedBy = input.approvedBy?.trim() || 'ops';
    const note = input.note?.trim() ?? null;
    const pickupRequest = await this.pickupRequestRepository.approve(
      id,
      approvedBy,
      note,
    );

    await this.pickupOutboxService.enqueuePickupApproved(pickupRequest, {
      approved_by: approvedBy,
      note,
    });

    return pickupRequest;
  }

  async complete(id: string): Promise<PickupRequest> {
    const current = await this.getById(id);

    if (current.status === 'COMPLETED') {
      return current;
    }

    if (current.status === 'CANCELLED') {
      throw new BadRequestException(
        `Pickup request "${id}" was cancelled and cannot be completed.`,
      );
    }

    if (current.status !== 'APPROVED') {
      throw new BadRequestException(
        `Pickup request "${id}" must be approved before completion.`,
      );
    }

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

    if (
      pickupRequest.status === 'CANCELLED' ||
      pickupRequest.status === 'COMPLETED'
    ) {
      return pickupRequest;
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
