import { randomInt } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CancelShipmentInput,
  ConfirmLabelReprintInput,
  CreateShipmentInput,
  JsonValue,
  Shipment,
  ShipmentListFilters,
  ShipmentListPage,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';
import type { ShipmentConsumedEventType } from '../../domain/entities/shipment-status.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentStateMachine } from '../../domain/state-machine/shipment-state-machine';
import { MarketplaceWebhookSenderService } from '../../integrations/marketplace-webhook-sender.service';
import { ShipmentOutboxService } from '../../messaging/outbox/shipment-outbox.service';
import { PricingClientService } from './pricing-client.service';

const MAX_CODE_RETRY = 20;
const SHIPMENT_CODE_RULE = /^(111|101|222|333)[0-9]{9}$/;
const SHIPMENT_CODE_SEQUENCE_SIZE = 1_000_000_000;
const DESTINATION_VISIBLE_STATUSES = new Set<string>([
  'MANIFEST_RECEIVED',
  'MANIFEST_UNSEALED',
  'SCAN_INBOUND',
  'INVENTORY_CHECK',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
]);

export interface OpsShipmentScopeContext {
  hubCodes: string[];
  canAccessAllHubs: boolean;
}

@Injectable()
export class ShipmentsService {
  constructor(
    @Inject(ShipmentRepository)
    private readonly shipmentRepository: ShipmentRepository,
    private readonly shipmentStateMachine: ShipmentStateMachine,
    private readonly shipmentOutboxService: ShipmentOutboxService,
    private readonly marketplaceWebhookSenderService: MarketplaceWebhookSenderService,
    private readonly pricingClientService: PricingClientService,
  ) {}

  list(
    filters: ShipmentListFilters = {},
    opsScope?: OpsShipmentScopeContext,
  ): Promise<Shipment[] | ShipmentListPage> {
    const scopedFilters = this.applyOpsScopeToFilters(filters, opsScope);
    const shouldReturnPage =
      filters.limit !== undefined || filters.offset !== undefined;

    if (!scopedFilters) {
      return Promise.resolve(
        shouldReturnPage
          ? {
              items: [],
              pageInfo: {
                hasNextPage: false,
                total: 0,
              },
            }
          : [],
      );
    }

    if (shouldReturnPage) {
      return this.shipmentRepository.listPage(scopedFilters);
    }

    return this.shipmentRepository.list(scopedFilters);
  }

  async getByCode(
    code: string,
    opsScope?: OpsShipmentScopeContext,
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.shipmentRepository.findByCode(normalizedCode);

    if (!shipment) {
      throw new NotFoundException(`Shipment "${normalizedCode}" was not found.`);
    }

    this.ensureShipmentVisibleToOps(shipment, opsScope);
    return shipment;
  }

  async create(input: CreateShipmentInput): Promise<Shipment> {
    const pricedInput = await this.pricingClientService.applyQuote(input);
    const normalizedCode = this.normalizeCode(pricedInput.code ?? null);
    const shipment = normalizedCode
      ? await this.createWithRequestedCode(pricedInput, normalizedCode)
      : await this.createWithGeneratedCode(pricedInput);

    await this.shipmentOutboxService.enqueueShipmentCreated(shipment);

    return shipment;
  }

  async update(
    code: string,
    input: UpdateShipmentInput,
    opsScope?: OpsShipmentScopeContext,
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    await this.getByCode(normalizedCode, opsScope);

    return this.shipmentRepository.update(normalizedCode, input);
  }

  async confirmLabelReprint(
    code: string,
    input: ConfirmLabelReprintInput = {},
    opsScope?: OpsShipmentScopeContext,
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode, opsScope);
    const metadata = asJsonRecord(shipment.metadata);
    const deliveryInfoChange = asJsonRecord(metadata.deliveryInfoChange);
    const returnWorkflow = asJsonRecord(metadata.returnWorkflow);
    const printedAt = new Date().toISOString();
    const shouldStayLocked = returnWorkflow.blocksOps === true;

    return this.shipmentRepository.updateMetadataAndLock(
      normalizedCode,
      {
        ...metadata,
        deliveryInfoChange: {
          ...deliveryInfoChange,
          requiresLabelReprint: false,
          labelReprintedAt: printedAt,
          labelReprintedBy: input.printedBy?.trim() || null,
        },
      },
      shouldStayLocked,
    );
  }

  async cancel(
    code: string,
    input: CancelShipmentInput,
    opsScope?: OpsShipmentScopeContext,
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode, opsScope);

    if (!this.shipmentStateMachine.canCancel(shipment.currentStatus)) {
      throw new ConflictException(
        `Shipment "${normalizedCode}" cannot be cancelled from status "${shipment.currentStatus}".`,
      );
    }

    const cancelledShipment = await this.shipmentRepository.cancel(
      normalizedCode,
      input.reason ?? null,
    );

    await this.marketplaceWebhookSenderService.notifyStatusChanged(cancelledShipment);

    return cancelledShipment;
  }

  private applyOpsScopeToFilters(
    filters: ShipmentListFilters,
    opsScope?: OpsShipmentScopeContext,
  ): ShipmentListFilters | null {
    if (!opsScope || opsScope.canAccessAllHubs) {
      return filters;
    }

    if (opsScope.hubCodes.length === 0) {
      return null;
    }

    const requestedHubCodes = normalizeStringList(filters.hubCodes);
    const hubCodes = requestedHubCodes.length > 0
      ? requestedHubCodes.filter((requestedHubCode) =>
          opsScope.hubCodes.some((assignedHubCode) =>
            isSameHubOrScopedLocation(requestedHubCode, assignedHubCode),
          ),
        )
      : opsScope.hubCodes;

    if (hubCodes.length === 0) {
      return null;
    }

    return {
      ...filters,
      hubCodes,
    };
  }

  private ensureShipmentVisibleToOps(
    shipment: Shipment,
    opsScope?: OpsShipmentScopeContext,
  ): void {
    if (!opsScope || opsScope.canAccessAllHubs) {
      return;
    }

    const shipmentHubCodes = collectHubCodes(shipment);
    const isVisible = shipmentHubCodes.some((hubCode) =>
      opsScope.hubCodes.some((assignedHubCode) =>
        isSameHubOrScopedLocation(hubCode, assignedHubCode),
      ),
    );

    if (opsScope.hubCodes.length === 0 || !isVisible) {
      throw new ForbiddenException(
        'Tài khoản OPS không có quyền xem vận đơn ngoài phạm vi hub được gán.',
      );
    }
  }

  async applyExternalEvent(
    code: string,
    eventType: ShipmentConsumedEventType,
    data: Record<string, unknown> = {},
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode);
    const nextStatus = this.shipmentStateMachine.resolveNextStatus(
      shipment.currentStatus,
      eventType,
      data,
    );

    const movementMetadata = this.buildMovementMetadata(
      shipment.metadata,
      eventType,
      data,
    );

    if (nextStatus === 'EXCEPTION') {
      if (movementMetadata) {
        const updatedShipment = await this.shipmentRepository.updateCurrentStatusMetadataAndLock(
          normalizedCode,
          nextStatus,
          movementMetadata,
          true,
        );

        await this.marketplaceWebhookSenderService.notifyStatusChanged(
          updatedShipment,
          eventType,
        );

        return updatedShipment;
      }

      const updatedShipment = await this.shipmentRepository.updateCurrentStatusAndLock(
        normalizedCode,
        nextStatus,
        true,
      );

      await this.marketplaceWebhookSenderService.notifyStatusChanged(
        updatedShipment,
        eventType,
      );

      return updatedShipment;
    }

    if (eventType === 'return.started') {
      const updatedShipment = await this.shipmentRepository.updateCurrentStatusMetadataAndLock(
        normalizedCode,
        nextStatus,
        this.buildReturnWorkflowMetadata(shipment.metadata, data, true),
        true,
      );

      await this.marketplaceWebhookSenderService.notifyStatusChanged(
        updatedShipment,
        eventType,
      );

      return updatedShipment;
    }

    if (eventType === 'return.completed') {
      const updatedShipment = await this.shipmentRepository.updateCurrentStatusMetadataAndLock(
        normalizedCode,
        nextStatus,
        this.buildReturnWorkflowMetadata(shipment.metadata, data, false),
        false,
      );

      await this.marketplaceWebhookSenderService.notifyStatusChanged(
        updatedShipment,
        eventType,
      );

      return updatedShipment;
    }

    if (nextStatus === 'INVENTORY_CHECK') {
      const updatedShipment = movementMetadata
        ? await this.shipmentRepository.updateCurrentStatusMetadataAndLock(
            normalizedCode,
            nextStatus,
            movementMetadata,
            false,
          )
        : await this.shipmentRepository.updateCurrentStatusAndLock(
            normalizedCode,
            nextStatus,
            false,
          );

      await this.marketplaceWebhookSenderService.notifyStatusChanged(
        updatedShipment,
        eventType,
      );

      return updatedShipment;
    }

    const updatedShipment = movementMetadata
      ? await this.shipmentRepository.updateCurrentStatusMetadataAndLock(
          normalizedCode,
          nextStatus,
          movementMetadata,
          shipment.isLocked,
        )
      : await this.shipmentRepository.updateCurrentStatus(
          normalizedCode,
          nextStatus,
        );

    await this.marketplaceWebhookSenderService.notifyStatusChanged(
      updatedShipment,
      eventType,
    );

    return updatedShipment;
  }

  private async createWithRequestedCode(
    input: CreateShipmentInput,
    requestedCode: string,
  ): Promise<Shipment> {
    this.assertWaybillCode(requestedCode);

    const existedShipment = await this.shipmentRepository.findByCode(requestedCode);

    if (existedShipment) {
      throw new ConflictException(
        `Shipment code "${requestedCode}" already exists.`,
      );
    }

    return this.shipmentRepository.create({
      ...input,
      code: requestedCode,
    });
  }

  private async createWithGeneratedCode(
    input: CreateShipmentInput,
  ): Promise<Shipment> {
    const prefix = this.resolveGeneratedCodePrefix(input.metadata);

    for (let attempt = 0; attempt < MAX_CODE_RETRY; attempt += 1) {
      const generatedCode = this.generateShipmentCode(prefix);

      try {
        return await this.shipmentRepository.create({
          ...input,
          code: generatedCode,
        });
      } catch (error) {
        if (error instanceof ConflictException) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Unable to generate unique shipment code. Please retry.',
    );
  }

  private normalizeCode(code: string | null): string | null {
    if (!code) {
      return null;
    }

    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode.length === 0) {
      return null;
    }

    if (!/^[A-Z0-9-]{6,32}$/.test(normalizedCode)) {
      throw new BadRequestException(
        'code must match /^[A-Z0-9-]{6,32}$/ after normalization.',
      );
    }

    return normalizedCode;
  }

  private assertWaybillCode(code: string): void {
    if (!SHIPMENT_CODE_RULE.test(code)) {
      throw new BadRequestException(
        'code must be a 12-digit waybill matching /^(111|101|222|333)[0-9]{9}$/.',
      );
    }
  }

  private normalizeRequiredCode(code: string): string {
    const normalizedCode = this.normalizeCode(code);

    if (!normalizedCode) {
      throw new BadRequestException('Shipment code is required.');
    }

    return normalizedCode;
  }

  private generateShipmentCode(prefix: '111' | '101' | '222' | '333'): string {
    const sequence = randomInt(SHIPMENT_CODE_SEQUENCE_SIZE);

    return `${prefix}${String(sequence).padStart(9, '0')}`;
  }

  private resolveGeneratedCodePrefix(metadata: JsonValue | null | undefined): '111' | '101' | '222' | '333' {
    const metadataRecord = asJsonRecord(metadata);
    const platform = readString(metadataRecord.platform)?.toUpperCase() ?? '';
    const source = readString(metadataRecord.source)?.toUpperCase() ?? '';
    const integration = asJsonRecord(metadataRecord.integration);
    const integrationPlatform = readString(integration.platform)?.toUpperCase() ?? '';
    const returnWorkflow = asJsonRecord(metadataRecord.returnWorkflow);

    if (
      source.includes('RETURN') ||
      platform.includes('RETURN') ||
      returnWorkflow.blocksOps === true
    ) {
      return '222';
    }

    if (
      source.includes('MARKETPLACE') ||
      platform.includes('MARKETPLACE') ||
      platform.includes('TMDT') ||
      platform.includes('TMĐT') ||
      integrationPlatform.length > 0
    ) {
      return '111';
    }

    if (source.includes('MERCHANT') || platform.includes('MERCHANT')) {
      return '101';
    }

    return '333';
  }

  private buildReturnWorkflowMetadata(
    currentMetadata: JsonValue | null,
    eventData: Record<string, unknown>,
    blocksOps: boolean,
  ): JsonValue {
    const metadata = asJsonRecord(currentMetadata);
    const returnCase = asJsonRecord(eventData.returnCase);
    const now = new Date().toISOString();

    return {
      ...metadata,
      returnWorkflow: {
        ...asJsonRecord(metadata.returnWorkflow),
        returnCaseId: readString(returnCase.id) ?? null,
        reason: readString(returnCase.note) ?? null,
        status: blocksOps ? 'STARTED' : 'COMPLETED',
        blocksOps,
        approvedAt: readString(returnCase.startedAt) ?? now,
        completedAt: blocksOps ? null : readString(returnCase.completedAt) ?? now,
      },
    };
  }

  private buildMovementMetadata(
    currentMetadata: JsonValue | null,
    eventType: ShipmentConsumedEventType,
    eventData: Record<string, unknown>,
  ): JsonValue | null {
    const currentHubCode = this.resolveMovementHubCode(eventType, eventData);
    if (!currentHubCode) {
      return null;
    }

    const metadata = asJsonRecord(currentMetadata);
    const location = asJsonRecord(metadata.location);
    const hub = asJsonRecord(metadata.hub);

    return {
      ...metadata,
      currentHubCode,
      currentLocation: currentHubCode,
      location: {
        ...location,
        hubCode: currentHubCode,
        current: currentHubCode,
      },
      hub: {
        ...hub,
        code: currentHubCode,
        currentCode: currentHubCode,
      },
      movement: {
        ...asJsonRecord(metadata.movement),
        lastEventType: eventType,
        lastUpdatedAt: new Date().toISOString(),
      },
    };
  }

  private resolveMovementHubCode(
    eventType: ShipmentConsumedEventType,
    eventData: Record<string, unknown>,
  ): string | null {
    if (
      eventType === 'scan.pickup_confirmed' ||
      eventType === 'scan.inbound' ||
      eventType === 'scan.outbound'
    ) {
      const scanEvent = asJsonRecord(eventData.scanEvent);
      return normalizeString(scanEvent.locationCode);
    }

    if (eventType === 'manifest.received') {
      const receive = asJsonRecord(eventData.receive);
      const manifest = asJsonRecord(eventData.manifest);
      return (
        normalizeString(receive.processingHubCode) ??
        normalizeString(manifest.destinationHubCode)
      );
    }

    if (eventType === 'manifest.unsealed') {
      const unseal = asJsonRecord(eventData.unseal);
      const manifest = asJsonRecord(eventData.manifest);
      return (
        normalizeString(unseal.processingHubCode) ??
        normalizeString(manifest.destinationHubCode)
      );
    }

    return null;
  }
}

function asJsonRecord(value: unknown): Record<string, JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().toUpperCase()
    : null;
}

function normalizeStringList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];

  return Array.from(
    new Set(
      values
        .filter((item): item is string => typeof item === 'string')
        .flatMap((item) => item.split(','))
        .map((item) => normalizeString(item))
        .filter((item): item is string => item !== null),
    ),
  );
}

function collectHubCodes(shipment: Shipment): string[] {
  const metadata = asJsonRecord(shipment.metadata);
  const sender = asJsonRecord(metadata.sender);
  const receiver = asJsonRecord(metadata.receiver);
  const routing = asJsonRecord(metadata.routing);
  const location = asJsonRecord(metadata.location);
  const hub = asJsonRecord(metadata.hub);
  const destinationCodes = DESTINATION_VISIBLE_STATUSES.has(shipment.currentStatus)
    ? [
        metadata.receiverHubCode,
        metadata.destinationHubCode,
        receiver.hubCode,
        routing.destinationHubCode,
      ]
    : [];

  return normalizeStringList([
    metadata.senderHubCode,
    metadata.originHubCode,
    metadata.currentHubCode,
    metadata.currentLocation,
    sender.hubCode,
    routing.originHubCode,
    location.hubCode,
    location.current,
    hub.code,
    hub.currentCode,
    ...destinationCodes,
  ]);
}

function isSameHubOrScopedLocation(
  targetCode: string,
  assignedHubCode: string,
): boolean {
  const targetProvinceScope = getBranchHubProvinceScopePrefix(targetCode);
  const assignedProvinceScope = getBranchHubProvinceScopePrefix(assignedHubCode);

  return (
    targetCode === assignedHubCode ||
    targetCode.startsWith(`${assignedHubCode}-`) ||
    targetCode.startsWith(`${assignedHubCode}_`) ||
    targetCode.startsWith(`${assignedHubCode}.`) ||
    (Boolean(targetProvinceScope) &&
      targetProvinceScope === assignedProvinceScope)
  );
}

function getBranchHubProvinceScopePrefix(hubCode: string): string | null {
  const normalizedHubCode = hubCode.trim().toUpperCase();

  return /^\d{6}[A-Z][A-Z0-9]*$/.test(normalizedHubCode)
    ? normalizedHubCode.slice(0, 6)
    : null;
}
