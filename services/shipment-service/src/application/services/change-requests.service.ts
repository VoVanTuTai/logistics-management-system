import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ApproveChangeRequestInput,
  ChangeRequest,
  CreateChangeRequestInput,
} from '../../domain/entities/change-request.entity';
import type { JsonValue, Shipment } from '../../domain/entities/shipment.entity';
import { ChangeRequestRepository } from '../../domain/repositories/change-request.repository';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';

const DELIVERY_ASSIGNED_OR_LATER_STATUSES = new Set([
  'TASK_ASSIGNED',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'CANCELLED',
]);

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

  async create(input: CreateChangeRequestInput): Promise<ChangeRequest> {
    const shipment = await this.getShipment(input.shipmentCode);
    this.ensureCanChangeDeliveryInfo(shipment, input.requestType);

    return this.changeRequestRepository.create({
      ...input,
      payload: this.decorateDeliveryInfoPayload(input),
    });
  }

  async approve(
    id: string,
    input: ApproveChangeRequestInput,
  ): Promise<ChangeRequest> {
    const changeRequest = await this.getById(id);
    const shipment = this.isDeliveryInfoChangeRequest(changeRequest.requestType)
      ? await this.getShipment(changeRequest.shipmentCode)
      : null;
    if (shipment) {
      this.ensureCanChangeDeliveryInfo(shipment, changeRequest.requestType);
    }

    const approved = await this.changeRequestRepository.approve(id, input);

    if (shipment) {
      await this.applyDeliveryInfoChange(shipment, approved, input);
    }

    return approved;
  }

  private async getShipment(shipmentCode: string): Promise<Shipment> {
    const normalizedCode = shipmentCode.trim().toUpperCase();
    const shipment = await this.shipmentRepository.findByCode(normalizedCode);

    if (!shipment) {
      throw new NotFoundException(`Shipment "${normalizedCode}" was not found.`);
    }

    return shipment;
  }

  private ensureCanChangeDeliveryInfo(
    shipment: Shipment,
    requestType: string,
  ): void {
    if (!this.isDeliveryInfoChangeRequest(requestType)) {
      return;
    }

    if (DELIVERY_ASSIGNED_OR_LATER_STATUSES.has(shipment.currentStatus)) {
      throw new ConflictException(
        `Shipment "${shipment.code}" cannot change delivery info after delivery assignment (${shipment.currentStatus}).`,
      );
    }
  }

  private isDeliveryInfoChangeRequest(requestType: string): boolean {
    return [
      'change.delivery_info',
      'change.phone',
      'change.address',
      'change.note',
    ].includes(requestType);
  }

  private decorateDeliveryInfoPayload(
    input: CreateChangeRequestInput,
  ): JsonValue {
    if (!this.isDeliveryInfoChangeRequest(input.requestType)) {
      return input.payload;
    }

    const payload = asJsonRecord(input.payload);
    return {
      ...payload,
      requiresLabelReprint: true,
      blocksOpsUntilLabelReprint: true,
    };
  }

  private async applyDeliveryInfoChange(
    shipment: Shipment,
    changeRequest: ChangeRequest,
    input: ApproveChangeRequestInput,
  ): Promise<void> {
    const payload = asJsonRecord(changeRequest.payload);
    const metadata = asJsonRecord(shipment.metadata);
    const receiver = asJsonRecord(metadata.receiver);
    const approvedAt = changeRequest.approvedAt?.toISOString() ?? new Date().toISOString();

    const receiverPhone = readString(payload.receiverPhone);
    const receiverAddress = readString(payload.receiverAddress);
    const deliveryNote = readString(payload.deliveryNote) ?? (
      changeRequest.requestType === 'change.note' ? readString(payload.value) : null
    );

    await this.shipmentRepository.updateMetadataAndLock(
      shipment.code,
      {
        ...metadata,
        receiver: {
          ...receiver,
          ...(receiverPhone ? { phone: receiverPhone } : {}),
          ...(receiverAddress ? { address: receiverAddress } : {}),
        },
        ...(receiverPhone ? { receiverPhone } : {}),
        ...(receiverAddress ? { receiverAddress } : {}),
        ...(deliveryNote ? { deliveryNote } : {}),
        deliveryInfoChange: {
          requiresLabelReprint: true,
          blocksOpsUntilLabelReprint: true,
          changeRequestId: changeRequest.id,
          approvedAt,
          approvedBy: input.approvedBy?.trim() || null,
          labelReprintedAt: null,
          labelReprintedBy: null,
        },
      },
      true,
    );
  }
}

function asJsonRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function readString(value: JsonValue | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
