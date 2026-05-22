import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  ApproveChangeRequestInput,
  ChangeRequest,
  CreateChangeRequestInput,
} from '../../domain/entities/change-request.entity';
import type { JsonValue } from '../../domain/entities/shipment.entity';
import { ChangeRequestRepository } from '../../domain/repositories/change-request.repository';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';

@Injectable()
export class ChangeRequestsService {
  constructor(
    @Inject(ChangeRequestRepository)
    private readonly changeRequestRepository: ChangeRequestRepository,
    @Inject(ShipmentRepository)
    private readonly shipmentRepository: ShipmentRepository,
  ) {}

  list(): Promise<ChangeRequest[]> {
    return this.changeRequestRepository.list();
  }

  async getById(id: string): Promise<ChangeRequest> {
    const changeRequest = await this.changeRequestRepository.findById(id);

    if (!changeRequest) {
      throw new NotFoundException(`Change request "${id}" was not found.`);
    }

    return changeRequest;
  }

  create(input: CreateChangeRequestInput): Promise<ChangeRequest> {
    return this.changeRequestRepository.create(input);
  }

  async approve(
    id: string,
    input: ApproveChangeRequestInput,
  ): Promise<ChangeRequest> {
    const changeRequest = await this.getById(id);
    await this.applyApprovedPayload(changeRequest);

    return this.changeRequestRepository.approve(id, input);
  }

  private async applyApprovedPayload(changeRequest: ChangeRequest): Promise<void> {
    const shipment = await this.shipmentRepository.findByCode(
      changeRequest.shipmentCode.trim().toUpperCase(),
    );

    if (!shipment) {
      throw new NotFoundException(
        `Shipment "${changeRequest.shipmentCode}" was not found.`,
      );
    }

    const payload = asJsonRecord(changeRequest.payload);
    if (!payload) {
      return;
    }

    const metadataRecord = asJsonRecord(shipment.metadata);
    const metadata: Record<string, JsonValue> = metadataRecord ? { ...metadataRecord } : {};
    const receiverRecord = asJsonRecord(metadata.receiver);
    const receiver: Record<string, JsonValue> = receiverRecord ? { ...receiverRecord } : {};
    const changedFields: Record<string, JsonValue> = {};

    const receiverPhone = normalizeOptionalText(payload.receiverPhone);
    const receiverAddress = normalizeOptionalText(payload.receiverAddress);
    const deliveryNote = normalizeOptionalText(payload.deliveryNote);

    if (receiverPhone) {
      receiver.phone = receiverPhone;
      metadata.receiverPhone = receiverPhone;
      changedFields.receiverPhone = receiverPhone;
    }

    if (receiverAddress) {
      receiver.address = receiverAddress;
      metadata.receiverAddress = receiverAddress;
      changedFields.receiverAddress = receiverAddress;
    }

    if (deliveryNote) {
      metadata.deliveryNote = deliveryNote;
      metadata.note = deliveryNote;
      changedFields.deliveryNote = deliveryNote;
    }

    if (Object.keys(changedFields).length === 0) {
      return;
    }

    metadata.receiver = receiver;
    metadata.lastApprovedChangeRequest = {
      id: changeRequest.id,
      requestType: changeRequest.requestType,
      changedFields,
      approvedAt: new Date().toISOString(),
    };

    await this.shipmentRepository.updateMetadata(shipment.code, metadata);
  }
}

function asJsonRecord(value: JsonValue | undefined | null): Record<string, JsonValue> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : null;
}

function normalizeOptionalText(value: JsonValue | undefined): string | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length > 0 ? normalized : null;
}
