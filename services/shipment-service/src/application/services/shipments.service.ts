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
    const receiverPhone = extractReceiverPhoneFromMetadata(pricedInput.metadata);

    const enrichedMetadata = enrichShipmentMetadataCoordinates(pricedInput.metadata, pricedInput);
    const pickupCoords = extractPickupCoordinates(enrichedMetadata as unknown as JsonValue, pricedInput);
    const deliveryCoords = extractDeliveryCoordinates(enrichedMetadata as unknown as JsonValue, pricedInput);

    const inputWithOwnership: CreateShipmentInput = {
      ...pricedInput,
      metadata: enrichedMetadata as JsonValue,
      pickupLatitude: pickupCoords.latitude,
      pickupLongitude: pickupCoords.longitude,
      deliveryLatitude: deliveryCoords.latitude,
      deliveryLongitude: deliveryCoords.longitude,
      createdByUserId: pricedInput.createdByUserId ?? null,
      createdByType: pricedInput.createdByType ?? null,
      receiverPhone,
    };

    const shipment = normalizedCode
      ? await this.createWithRequestedCode(inputWithOwnership, normalizedCode)
      : await this.createWithGeneratedCode(inputWithOwnership);

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
    const movement = asJsonRecord(metadata.movement);
    const touchedHubCodes = normalizeStringList([
      ...asUnknownArray(movement.hubCodes),
      currentHubCode,
    ]);

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
        ...movement,
        hubCodes: touchedHubCodes,
        hubCodesText: `|${touchedHubCodes.join('|')}|`,
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

    if (eventType === 'task.assigned') {
      const location = asJsonRecord(eventData.location);
      return normalizeString(location.locationCode);
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
  const movement = asJsonRecord(metadata.movement);
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
    ...asUnknownArray(movement.hubCodes),
    ...destinationCodes,
  ]);
}

function asUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function isSameHubOrScopedLocation(
  targetCode: string,
  assignedHubCode: string,
): boolean {
  const targetPrefixes = getBranchHubProvinceScopePrefixes(targetCode);
  const assignedPrefixes = getBranchHubProvinceScopePrefixes(assignedHubCode);

  const hasCommonPrefix = targetPrefixes.some((tp) =>
    assignedPrefixes.some((ap) => tp === ap || tp.startsWith(ap) || ap.startsWith(tp)),
  );

  return (
    targetCode === assignedHubCode ||
    targetCode.startsWith(`${assignedHubCode}-`) ||
    targetCode.startsWith(`${assignedHubCode}_`) ||
    targetCode.startsWith(`${assignedHubCode}.`) ||
    hasCommonPrefix
  );
}

function getBranchHubProvinceScopePrefixes(hubCode: string): string[] {
  const normalizedHubCode = hubCode.trim().toUpperCase();

  // Regional Hubs (e.g. 001N001, 002C001, 003S001) -> Match 3-digit region prefix (001, 002, 003)
  if (/^\d{3}[A-Z]\d{3}$/.test(normalizedHubCode)) {
    return [normalizedHubCode.slice(0, 3)];
  }

  // Branch Hubs (e.g. 003079B001) -> Match 6-digit province prefix (003079) and 3-digit region prefix (003)
  if (/^\d{6}[A-Z][A-Z0-9]*$/.test(normalizedHubCode)) {
    return [normalizedHubCode.slice(0, 6), normalizedHubCode.slice(0, 3)];
  }

  return [];
}

function extractReceiverPhoneFromMetadata(
  metadata: JsonValue | null | undefined,
): string | null {
  const metadataRecord = asJsonRecord(metadata);
  const receiverRecord = asJsonRecord(metadataRecord.receiver);
  const phone = readString(receiverRecord.phone);

  return phone ? phone.trim() : null;
}

interface CoordinatePoint {
  latitude: number;
  longitude: number;
}

const DEFAULT_PROVINCE_COORDINATES: Record<string, CoordinatePoint> = {
  'ha noi': { latitude: 21.028511, longitude: 105.854444 },
  'hanoi': { latitude: 21.028511, longitude: 105.854444 },
  'cao bang': { latitude: 22.6657, longitude: 106.2577 },
  'tuyen quang': { latitude: 21.8233, longitude: 105.2181 },
  'dien bien': { latitude: 21.386, longitude: 103.023 },
  'lai chau': { latitude: 22.3965, longitude: 103.4682 },
  'son la': { latitude: 21.3283, longitude: 103.9148 },
  'lao cai': { latitude: 22.4856, longitude: 103.9707 },
  'thai nguyen': { latitude: 21.5942, longitude: 105.8482 },
  'lang son': { latitude: 21.8537, longitude: 106.7615 },
  'quang ninh': { latitude: 20.9505, longitude: 107.0734 },
  'bac ninh': { latitude: 21.1861, longitude: 106.0763 },
  'phu tho': { latitude: 21.3227, longitude: 105.228 },
  'hai phong': { latitude: 20.8449, longitude: 106.6881 },
  'hung yen': { latitude: 20.6464, longitude: 106.0511 },
  'ninh binh': { latitude: 20.2506, longitude: 105.9745 },
  'thanh hoa': { latitude: 19.8067, longitude: 105.7852 },
  'nghe an': { latitude: 18.6734, longitude: 105.6813 },
  'ha tinh': { latitude: 18.3435, longitude: 105.9058 },
  'quang tri': { latitude: 16.8163, longitude: 107.1006 },
  'hue': { latitude: 16.4637, longitude: 107.5909 },
  'thua thien hue': { latitude: 16.4637, longitude: 107.5909 },
  'da nang': { latitude: 16.06778, longitude: 108.22083 },
  'danang': { latitude: 16.06778, longitude: 108.22083 },
  'quang ngai': { latitude: 15.1205, longitude: 108.7923 },
  'gia lai': { latitude: 13.9833, longitude: 108.0 },
  'khanh hoa': { latitude: 12.2388, longitude: 109.1967 },
  'dak lak': { latitude: 12.6667, longitude: 108.05 },
  'lam dong': { latitude: 11.9404, longitude: 108.4583 },
  'dong nai': { latitude: 10.9574, longitude: 106.8427 },
  'ho chi minh': { latitude: 10.776889, longitude: 106.700806 },
  'tphcm': { latitude: 10.776889, longitude: 106.700806 },
  'sai gon': { latitude: 10.776889, longitude: 106.700806 },
  'tay ninh': { latitude: 11.3101, longitude: 106.0983 },
  'dong thap': { latitude: 10.4577, longitude: 105.6331 },
  'vinh long': { latitude: 10.2537, longitude: 105.9722 },
  'an giang': { latitude: 10.3759, longitude: 105.4185 },
  'can tho': { latitude: 10.0452, longitude: 105.7469 },
  'ca mau': { latitude: 9.1769, longitude: 105.1524 },
};

const DEFAULT_HUB_COORDINATES: Record<string, CoordinatePoint> = {
  '001N001': { latitude: 21.0253, longitude: 105.8572 },
  '001001B001': { latitude: 21.028511, longitude: 105.854444 },
  'HUB_HANOI': { latitude: 21.028511, longitude: 105.854444 },
  'HUB-HN-001': { latitude: 21.028511, longitude: 105.854444 },
  '002C001': { latitude: 16.0718, longitude: 108.2241 },
  '002048B001': { latitude: 16.06778, longitude: 108.22083 },
  'HUB_DANANG': { latitude: 16.06778, longitude: 108.22083 },
  'HUB-DN-001': { latitude: 16.06778, longitude: 108.22083 },
  '003S001': { latitude: 10.7797, longitude: 106.6991 },
  '003079B001': { latitude: 10.776889, longitude: 106.700806 },
  'HUB_HCM': { latitude: 10.776889, longitude: 106.700806 },
  'HUB-HCM-001': { latitude: 10.776889, longitude: 106.700806 },
  '001004B001': { latitude: 22.6657, longitude: 106.2577 },
  'HUB_CAOBANG': { latitude: 22.6657, longitude: 106.2577 },
  'HUB-CB-001': { latitude: 22.6657, longitude: 106.2577 },
};

function resolveCoordinateFallback(
  partyRecord: Record<string, unknown> | null,
  hubCode: string | null | undefined,
  fallbackProvinceName?: string | null,
): CoordinatePoint {
  if (partyRecord) {
    const rawLat = partyRecord.latitude ?? partyRecord.lat ?? (partyRecord.coordinate as Record<string, unknown> | undefined)?.latitude ?? (partyRecord.location as Record<string, unknown> | undefined)?.latitude;
    const rawLng = partyRecord.longitude ?? partyRecord.lng ?? (partyRecord.coordinate as Record<string, unknown> | undefined)?.longitude ?? (partyRecord.location as Record<string, unknown> | undefined)?.longitude;
    const numLat = typeof rawLat === 'number' ? rawLat : typeof rawLat === 'string' ? Number(rawLat) : null;
    const numLng = typeof rawLng === 'number' ? rawLng : typeof rawLng === 'string' ? Number(rawLng) : null;
    if (
      numLat !== null &&
      numLng !== null &&
      Number.isFinite(numLat) &&
      Number.isFinite(numLng) &&
      numLat >= -90 &&
      numLat <= 90 &&
      numLng >= -180 &&
      numLng <= 180
    ) {
      return { latitude: Number(numLat.toFixed(6)), longitude: Number(numLng.toFixed(6)) };
    }
  }

  const normHub = (hubCode || (partyRecord?.hubCode as string) || '').trim().toUpperCase();
  if (normHub && DEFAULT_HUB_COORDINATES[normHub]) {
    return DEFAULT_HUB_COORDINATES[normHub];
  }

  const rawAddressText = [
    partyRecord?.province,
    partyRecord?.region,
    fallbackProvinceName,
    partyRecord?.address,
    partyRecord?.addressDetail,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ');

  const normAddress = rawAddressText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(thanh pho|tinh|tp)\s+/i, '')
    .trim();

  for (const [key, coords] of Object.entries(DEFAULT_PROVINCE_COORDINATES)) {
    if (normAddress.includes(key) || key.includes(normAddress)) {
      return coords;
    }
  }

  return { latitude: 10.776889, longitude: 106.700806 };
}

function extractPickupCoordinates(
  metadata: JsonValue | null | undefined,
  input?: CreateShipmentInput,
): CoordinatePoint {
  if (
    typeof input?.pickupLatitude === 'number' &&
    typeof input?.pickupLongitude === 'number' &&
    Number.isFinite(input.pickupLatitude) &&
    Number.isFinite(input.pickupLongitude)
  ) {
    return {
      latitude: Number(input.pickupLatitude.toFixed(6)),
      longitude: Number(input.pickupLongitude.toFixed(6)),
    };
  }

  const metadataRecord = asJsonRecord(metadata);
  const senderRecord = asJsonRecord(metadataRecord.sender);
  const routingRecord = asJsonRecord(metadataRecord.routing);
  const hubCode = readString(routingRecord.originHubCode) ?? readString(metadataRecord.originHubCode) ?? readString(metadataRecord.senderHubCode);

  return resolveCoordinateFallback(senderRecord, hubCode);
}

function extractDeliveryCoordinates(
  metadata: JsonValue | null | undefined,
  input?: CreateShipmentInput,
): CoordinatePoint {
  if (
    typeof input?.deliveryLatitude === 'number' &&
    typeof input?.deliveryLongitude === 'number' &&
    Number.isFinite(input.deliveryLatitude) &&
    Number.isFinite(input.deliveryLongitude)
  ) {
    return {
      latitude: Number(input.deliveryLatitude.toFixed(6)),
      longitude: Number(input.deliveryLongitude.toFixed(6)),
    };
  }

  const metadataRecord = asJsonRecord(metadata);
  const receiverRecord = asJsonRecord(metadataRecord.receiver);
  const routingRecord = asJsonRecord(metadataRecord.routing);
  const hubCode = readString(routingRecord.destinationHubCode) ?? readString(metadataRecord.destinationHubCode) ?? readString(metadataRecord.receiverHubCode);

  return resolveCoordinateFallback(receiverRecord, hubCode);
}

interface SpatialWardHub {
  code: string;
  name: string;
  parentHubCode: string;
  latitude: number;
  longitude: number;
  boundaryPolygon: Array<[number, number]>;
}

const SPATIAL_WARD_HUBS: SpatialWardHub[] = [
  // Bình Dương
  {
    code: '07401W001',
    name: 'Bưu cục Phường Dĩ An',
    parentHubCode: '003074B001',
    latitude: 10.9032,
    longitude: 106.7725,
    boundaryPolygon: [
      [10.9250, 106.7620],
      [10.9235, 106.7710],
      [10.9180, 106.7785],
      [10.9125, 106.7840],
      [10.9080, 106.7920],
      [10.9015, 106.7865],
      [10.8950, 106.7790],
      [10.8880, 106.7750],
      [10.8810, 106.7720],
      [10.8775, 106.7680],
      [10.8830, 106.7610],
      [10.8890, 106.7565],
      [10.8970, 106.7540],
      [10.9060, 106.7560],
      [10.9160, 106.7585],
      [10.9250, 106.7620],
    ],
  },
  // TP.HCM
  {
    code: '07901W001',
    name: 'Bưu cục Phường Bến Thành',
    parentHubCode: '003079B001',
    latitude: 10.7715,
    longitude: 106.6932,
    boundaryPolygon: [
      [10.766, 106.687],
      [10.777, 106.689],
      [10.779, 106.696],
      [10.774, 106.699],
      [10.768, 106.696],
      [10.765, 106.691],
      [10.766, 106.687],
    ],
  },
  {
    code: '07901W002',
    name: 'Bưu cục Phường Bến Nghé',
    parentHubCode: '003079B001',
    latitude: 10.7758,
    longitude: 106.7012,
    boundaryPolygon: [
      [10.772, 106.698],
      [10.785, 106.701],
      [10.789, 106.707],
      [10.778, 106.712],
      [10.770, 106.706],
      [10.772, 106.698],
    ],
  },
  {
    code: '07903W001',
    name: 'Bưu cục Phường 13 - Quận 3',
    parentHubCode: '003079B001',
    latitude: 10.7891,
    longitude: 106.6775,
    boundaryPolygon: [
      [10.782, 106.671],
      [10.794, 106.673],
      [10.795, 106.684],
      [10.784, 106.683],
      [10.782, 106.671],
    ],
  },
  {
    code: '07905W001',
    name: 'Bưu cục Phường 2 - Quận 5',
    parentHubCode: '003079B001',
    latitude: 10.7538,
    longitude: 106.6782,
    boundaryPolygon: [
      [10.746, 106.672],
      [10.759, 106.673],
      [10.760, 106.685],
      [10.748, 106.684],
      [10.746, 106.672],
    ],
  },
  {
    code: '07912W001',
    name: 'Bưu cục Phường An Phú Đông - Quận 12',
    parentHubCode: '003079B001',
    latitude: 10.867,
    longitude: 106.696,
    boundaryPolygon: [
      [10.850, 106.683],
      [10.880, 106.686],
      [10.885, 106.713],
      [10.857, 106.715],
      [10.850, 106.683],
    ],
  },
  {
    code: '07913W001',
    name: 'Bưu cục Phường 13 - Tân Bình',
    parentHubCode: '003079B001',
    latitude: 10.8035,
    longitude: 106.6436,
    boundaryPolygon: [
      [10.794, 106.633],
      [10.815, 106.636],
      [10.813, 106.655],
      [10.796, 106.652],
      [10.794, 106.633],
    ],
  },
  // Hà Nội
  {
    code: '00101W001',
    name: 'Bưu cục Phường Hàng Bài - Hoàn Kiếm',
    parentHubCode: '001001B001',
    latitude: 21.0185,
    longitude: 105.8524,
    boundaryPolygon: [
      [21.012, 105.847],
      [21.024, 105.849],
      [21.025, 105.858],
      [21.013, 105.857],
      [21.012, 105.847],
    ],
  },
  {
    code: '00102W001',
    name: 'Bưu cục Phường Kim Mã - Ba Đình',
    parentHubCode: '001001B001',
    latitude: 21.0318,
    longitude: 105.8247,
    boundaryPolygon: [
      [21.025, 105.817],
      [21.037, 105.819],
      [21.038, 105.831],
      [21.026, 105.829],
      [21.025, 105.817],
    ],
  },
  {
    code: '00103W001',
    name: 'Bưu cục Phường Dịch Vọng - Cầu Giấy',
    parentHubCode: '001001B001',
    latitude: 21.0336,
    longitude: 105.7958,
    boundaryPolygon: [
      [21.025, 105.787],
      [21.041, 105.789],
      [21.042, 105.804],
      [21.027, 105.803],
      [21.025, 105.787],
    ],
  },
  {
    code: '00104W001',
    name: 'Bưu cục Phường Trung Liệt - Đống Đa',
    parentHubCode: '001001B001',
    latitude: 21.0135,
    longitude: 105.8194,
    boundaryPolygon: [
      [21.007, 105.811],
      [21.019, 105.813],
      [21.020, 105.826],
      [21.008, 105.825],
      [21.007, 105.811],
    ],
  },
  // Đà Nẵng
  {
    code: '04801W001',
    name: 'Bưu cục Phường Thạch Thang - Hải Châu',
    parentHubCode: '002048B001',
    latitude: 16.0742,
    longitude: 108.2239,
    boundaryPolygon: [
      [16.067, 108.217],
      [16.081, 108.219],
      [16.082, 108.229],
      [16.068, 108.228],
      [16.067, 108.217],
    ],
  },
];

function isPointInPolygon(
  point: CoordinatePoint,
  polygon: Array<[number, number]>,
): boolean {
  if (!polygon || polygon.length < 3) return false;
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function resolveResponsibleHubByCoords(
  coords: CoordinatePoint,
  explicitHubCode?: string | null,
  fallbackProvinceName?: string | null,
): { hubCode: string; hubName: string; level: number } {
  if (explicitHubCode && explicitHubCode.trim()) {
    const norm = explicitHubCode.trim().toUpperCase();
    const matchedWard = SPATIAL_WARD_HUBS.find((w) => w.code === norm);
    if (matchedWard) {
      return { hubCode: matchedWard.code, hubName: matchedWard.name, level: 3 };
    }
  }

  // 1. Exact Boundary Polygon matching (Ray Casting)
  for (const ward of SPATIAL_WARD_HUBS) {
    if (ward.boundaryPolygon && isPointInPolygon(coords, ward.boundaryPolygon)) {
      return { hubCode: ward.code, hubName: ward.name, level: 3 };
    }
  }

  // 2. Secondary fallback: nearest Ward Hub within 3.5km
  let nearestWard: SpatialWardHub | null = null;
  let minDistance = Infinity;

  for (const ward of SPATIAL_WARD_HUBS) {
    const dist = calculateHaversineDistanceKm(
      coords.latitude,
      coords.longitude,
      ward.latitude,
      ward.longitude,
    );
    if (dist <= 3.5 && dist < minDistance) {
      minDistance = dist;
      nearestWard = ward;
    }
  }

  if (nearestWard) {
    return { hubCode: nearestWard.code, hubName: nearestWard.name, level: 3 };
  }

  // 2. Fallback to explicit hub or provincial hub
  if (explicitHubCode && explicitHubCode.trim()) {
    return { hubCode: explicitHubCode.trim().toUpperCase(), hubName: explicitHubCode.trim(), level: 2 };
  }

  // 3. Fallback based on province
  const normProv = (fallbackProvinceName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normProv.includes('ha noi') || normProv.includes('hanoi')) {
    return { hubCode: '001001B001', hubName: 'Bưu cục Hà Nội', level: 2 };
  }
  if (normProv.includes('da nang') || normProv.includes('danang')) {
    return { hubCode: '002048B001', hubName: 'Bưu cục Đà Nẵng', level: 2 };
  }

  return { hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh', level: 2 };
}

function enrichShipmentMetadataCoordinates(
  metadata: JsonValue | null | undefined,
  input?: CreateShipmentInput,
): Record<string, JsonValue> {
  const meta: Record<string, JsonValue> = { ...asJsonRecord(metadata) };
  const sender: Record<string, JsonValue> = { ...asJsonRecord(meta.sender) };
  const receiver: Record<string, JsonValue> = { ...asJsonRecord(meta.receiver) };
  const routing: Record<string, JsonValue> = { ...asJsonRecord(meta.routing) };

  const pickupCoords = extractPickupCoordinates(metadata, input);
  const deliveryCoords = extractDeliveryCoordinates(metadata, input);

  const senderProv = readString(sender.province) ?? readString(sender.region);
  const receiverProv = readString(receiver.province) ?? readString(receiver.region);

  const originHub = resolveResponsibleHubByCoords(
    pickupCoords,
    readString(sender.hubCode) ?? readString(routing.originHubCode) ?? readString(meta.originHubCode),
    senderProv,
  );

  const destHub = resolveResponsibleHubByCoords(
    deliveryCoords,
    readString(receiver.hubCode) ?? readString(routing.destinationHubCode) ?? readString(meta.destinationHubCode),
    receiverProv,
  );

  sender.latitude = (sender.latitude as number | undefined) ?? pickupCoords.latitude;
  sender.longitude = (sender.longitude as number | undefined) ?? pickupCoords.longitude;
  sender.coordinate = ((sender.coordinate as unknown) ?? pickupCoords) as unknown as JsonValue;
  sender.hubCode = (sender.hubCode as string | undefined) ?? originHub.hubCode;

  receiver.latitude = (receiver.latitude as number | undefined) ?? deliveryCoords.latitude;
  receiver.longitude = (receiver.longitude as number | undefined) ?? deliveryCoords.longitude;
  receiver.coordinate = ((receiver.coordinate as unknown) ?? deliveryCoords) as unknown as JsonValue;
  receiver.hubCode = (receiver.hubCode as string | undefined) ?? destHub.hubCode;

  routing.originHubCode = originHub.hubCode;
  routing.destinationHubCode = destHub.hubCode;

  meta.sender = sender as unknown as JsonValue;
  meta.receiver = receiver as unknown as JsonValue;
  meta.routing = routing as unknown as JsonValue;
  meta.originHubCode = originHub.hubCode;
  meta.destinationHubCode = destHub.hubCode;
  meta.senderHubCode = originHub.hubCode;
  meta.receiverHubCode = destHub.hubCode;

  meta.pickupLatitude = pickupCoords.latitude;
  meta.pickupLongitude = pickupCoords.longitude;
  meta.pickupCoordinate = pickupCoords as unknown as JsonValue;
  meta.deliveryLatitude = deliveryCoords.latitude;
  meta.deliveryLongitude = deliveryCoords.longitude;
  meta.deliveryCoordinate = deliveryCoords as unknown as JsonValue;

  return meta;
}
