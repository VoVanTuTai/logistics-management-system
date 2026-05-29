import {
  BadRequestException,
  ForbiddenException,
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

export interface OpsPickupScopeContext {
  hubCodes: string[];
  canAccessAllHubs: boolean;
}

@Injectable()
export class PickupsService {
  constructor(
    @Inject(PickupRequestRepository)
    private readonly pickupRequestRepository: PickupRequestRepository,
    private readonly pickupOutboxService: PickupOutboxService,
  ) {}

  async list(
    status?: string,
    opsScope?: OpsPickupScopeContext,
  ): Promise<PickupRequest[]> {
    const normalizedStatus = status?.trim().toUpperCase();

    if (!normalizedStatus) {
      return this.filterPickupRequestsByOpsScope(
        await this.pickupRequestRepository.list(),
        opsScope,
      );
    }

    if (!PICKUP_REQUEST_STATUS_SET.has(normalizedStatus as PickupRequestStatus)) {
      throw new BadRequestException(
        `Invalid pickup status filter "${status}". Expected one of REQUESTED, APPROVED, CANCELLED, COMPLETED.`,
      );
    }

    return this.filterPickupRequestsByOpsScope(
      await this.pickupRequestRepository.list(
        normalizedStatus as PickupRequestStatus,
      ),
      opsScope,
    );
  }

  async getById(
    id: string,
    opsScope?: OpsPickupScopeContext,
  ): Promise<PickupRequest> {
    const pickupRequest = await this.pickupRequestRepository.findById(id);

    if (!pickupRequest) {
      throw new NotFoundException(`Pickup request "${id}" was not found.`);
    }

    await this.ensurePickupRequestVisibleToOps(pickupRequest, opsScope);
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
    opsScope?: OpsPickupScopeContext,
  ): Promise<PickupRequest> {
    await this.getById(id, opsScope);

    return this.pickupRequestRepository.update(id, input);
  }

  async cancel(
    id: string,
    input: CancelPickupRequestInput,
    opsScope?: OpsPickupScopeContext,
  ): Promise<PickupRequest> {
    const current = await this.getById(id, opsScope);

    if (current.status === 'CANCELLED') {
      return current;
    }

    if (current.status === 'COMPLETED') {
      throw new BadRequestException(
        `Pickup request "${id}" was completed and cannot be cancelled.`,
      );
    }

    return this.pickupRequestRepository.cancel(
      id,
      input.reason ?? null,
    );
  }

  async approve(
    id: string,
    input: ApprovePickupRequestInput,
    opsScope?: OpsPickupScopeContext,
  ): Promise<PickupRequest> {
    const current = await this.getById(id, opsScope);

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

  async complete(
    id: string,
    opsScope?: OpsPickupScopeContext,
  ): Promise<PickupRequest> {
    const current = await this.getById(id, opsScope);

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

    return this.pickupRequestRepository.complete(id);
  }

  private async filterPickupRequestsByOpsScope(
    pickupRequests: PickupRequest[],
    opsScope?: OpsPickupScopeContext,
  ): Promise<PickupRequest[]> {
    if (!opsScope || opsScope.canAccessAllHubs) {
      return pickupRequests;
    }

    if (opsScope.hubCodes.length === 0) {
      return [];
    }

    const visiblePickupRequests: PickupRequest[] = [];
    for (const pickupRequest of pickupRequests) {
      if (await this.isPickupRequestVisibleToOps(pickupRequest, opsScope)) {
        visiblePickupRequests.push(pickupRequest);
      }
    }

    return visiblePickupRequests;
  }

  private async ensurePickupRequestVisibleToOps(
    pickupRequest: PickupRequest,
    opsScope?: OpsPickupScopeContext,
  ): Promise<void> {
    if (!opsScope || opsScope.canAccessAllHubs) {
      return;
    }

    if (
      opsScope.hubCodes.length === 0 ||
      !(await this.isPickupRequestVisibleToOps(pickupRequest, opsScope))
    ) {
      throw new ForbiddenException(
        'Tài khoản OPS không có quyền xem yêu cầu lấy hàng ngoài phạm vi hub được gán.',
      );
    }
  }

  private async isPickupRequestVisibleToOps(
    pickupRequest: PickupRequest,
    opsScope: OpsPickupScopeContext,
  ): Promise<boolean> {
    const shipmentCodes = pickupRequest.items
      .map((item) => item.shipmentCode.trim())
      .filter((shipmentCode) => shipmentCode.length > 0);

    if (shipmentCodes.length === 0) {
      return false;
    }

    const visibleShipmentCodes = await this.fetchVisibleShipmentCodes(
      shipmentCodes,
      opsScope.hubCodes,
    );

    return shipmentCodes.some((shipmentCode) =>
      visibleShipmentCodes.has(shipmentCode.toUpperCase()),
    );
  }

  private async fetchVisibleShipmentCodes(
    shipmentCodes: string[],
    hubCodes: string[],
  ): Promise<Set<string>> {
    const baseUrl = process.env.SHIPMENT_SERVICE_URL?.trim();
    if (!baseUrl) {
      return new Set();
    }

    const url = new URL(
      'shipments',
      baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    );
    url.searchParams.set('shipmentCodes', shipmentCodes.join(','));
    url.searchParams.set('hubCodes', hubCodes.join(','));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      redirect: 'manual',
    });

    if (!response.ok) {
      return new Set();
    }

    const payload = await response.json().catch(() => null);
    const payloadRecord = asRecord(payload);
    const shipments = Array.isArray(payload)
      ? payload
      : Array.isArray(payloadRecord?.items)
        ? payloadRecord.items
        : [];

    return new Set(
      shipments
        .map((shipment) => normalizeShipmentCode(asRecord(shipment)?.code))
        .filter((shipmentCode): shipmentCode is string => shipmentCode !== null),
    );
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

    return this.pickupRequestRepository.cancel(
      pickupRequest.id,
      reason,
    );
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeShipmentCode(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().toUpperCase()
    : null;
}
