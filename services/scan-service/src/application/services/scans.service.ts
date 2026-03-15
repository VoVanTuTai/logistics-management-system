import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CurrentLocation } from '../../domain/entities/current-location.entity';
import type { IdempotencyRecord } from '../../domain/entities/idempotency-record.entity';
import type {
  RecordInboundScanInput,
  RecordOutboundScanInput,
  RecordPickupScanInput,
  RecordScanInput,
  RecordScanResult,
  RecordScanResultSnapshot,
  ScanEvent,
  ScanType,
} from '../../domain/entities/scan-event.entity';
import { CurrentLocationRepository } from '../../domain/repositories/current-location.repository';
import { IdempotencyRecordRepository } from '../../domain/repositories/idempotency-record.repository';
import { ScanEventRepository } from '../../domain/repositories/scan-event.repository';
import { ScanOutboxService } from '../../messaging/outbox/scan-outbox.service';

type ScanFlow = 'scan.pickup_confirmed' | 'scan.inbound' | 'scan.outbound';

@Injectable()
export class ScansService {
  constructor(
    @Inject(ScanEventRepository)
    private readonly scanEventRepository: ScanEventRepository,
    @Inject(CurrentLocationRepository)
    private readonly currentLocationRepository: CurrentLocationRepository,
    @Inject(IdempotencyRecordRepository)
    private readonly idempotencyRecordRepository: IdempotencyRecordRepository,
    private readonly scanOutboxService: ScanOutboxService,
  ) {}

  recordPickup(input: RecordPickupScanInput): Promise<RecordScanResult> {
    return this.recordScan('scan.pickup_confirmed', 'PICKUP', input);
  }

  recordInbound(input: RecordInboundScanInput): Promise<RecordScanResult> {
    return this.recordScan('scan.inbound', 'INBOUND', input);
  }

  recordOutbound(input: RecordOutboundScanInput): Promise<RecordScanResult> {
    return this.recordScan('scan.outbound', 'OUTBOUND', input);
  }

  async getCurrentLocation(shipmentCode: string): Promise<CurrentLocation> {
    const currentLocation = await this.currentLocationRepository.findByShipmentCode(
      shipmentCode,
    );

    if (!currentLocation) {
      throw new NotFoundException(
        `Current location for shipment "${shipmentCode}" was not found.`,
      );
    }

    return currentLocation;
  }

  async handleManifestSealed(payload: {
    shipment_code?: string | null;
    data?: Record<string, unknown>;
  }): Promise<{ accepted: boolean; shipmentCode: string | null }> {
    return {
      accepted: true,
      shipmentCode: payload.shipment_code ?? null,
    };
  }

  private async recordScan(
    flow: ScanFlow,
    scanType: ScanType,
    input: RecordScanInput,
  ): Promise<RecordScanResult> {
    if (!input.shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    if (!input.idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required.');
    }

    if (input.occurredAt && Number.isNaN(new Date(input.occurredAt).getTime())) {
      throw new BadRequestException('occurredAt must be a valid ISO date.');
    }

    const scopedIdempotencyKey = `${flow}:${input.idempotencyKey}`;
    const existingRecord = await this.idempotencyRecordRepository.findByKey(
      scopedIdempotencyKey,
    );

    if (existingRecord) {
      return this.toScanResult(existingRecord);
    }

    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    const persisted = await this.scanEventRepository.createIfAbsent({
      shipmentCode: input.shipmentCode,
      scanType,
      locationCode: input.locationCode ?? null,
      manifestCode: input.manifestCode ?? null,
      actor: input.actor ?? null,
      note: input.note ?? null,
      occurredAt,
      idempotencyKey: scopedIdempotencyKey,
    });

    if (!persisted.created) {
      const replayedResult = await this.buildReplayResult(persisted.scanEvent);

      await this.idempotencyRecordRepository.createIfAbsent({
        idempotencyKey: scopedIdempotencyKey,
        scope: flow,
        responsePayload: this.toSnapshot(replayedResult),
      });

      return replayedResult;
    }

    const currentLocation = await this.currentLocationRepository.upsert({
      // scan-service owns current_location and updates it on every accepted scan.
      shipmentCode: persisted.scanEvent.shipmentCode,
      locationCode: persisted.scanEvent.locationCode,
      lastScanType: persisted.scanEvent.scanType,
      lastScanEventId: persisted.scanEvent.id,
      lastScannedAt: persisted.scanEvent.occurredAt,
      manifestCode: persisted.scanEvent.manifestCode,
    });

    const result: RecordScanResult = {
      scanEvent: persisted.scanEvent,
      currentLocation,
    };

    await this.enqueueFlowEvents(flow, result);

    await this.idempotencyRecordRepository.createIfAbsent({
      idempotencyKey: scopedIdempotencyKey,
      scope: flow,
      responsePayload: this.toSnapshot(result),
    });

    return result;
  }

  private async buildReplayResult(scanEvent: ScanEvent): Promise<RecordScanResult> {
    const currentLocation = await this.currentLocationRepository.findByShipmentCode(
      scanEvent.shipmentCode,
    );

    return {
      scanEvent,
      currentLocation:
        currentLocation ??
        this.buildCurrentLocationFromScan(scanEvent),
    };
  }

  private buildCurrentLocationFromScan(scanEvent: ScanEvent): CurrentLocation {
    return {
      id: `snapshot:${scanEvent.shipmentCode}`,
      shipmentCode: scanEvent.shipmentCode,
      locationCode: scanEvent.locationCode,
      lastScanType: scanEvent.scanType,
      lastScanEventId: scanEvent.id,
      lastScannedAt: scanEvent.occurredAt,
      manifestCode: scanEvent.manifestCode,
      createdAt: scanEvent.createdAt,
      updatedAt: scanEvent.updatedAt,
    };
  }

  private async enqueueFlowEvents(
    flow: ScanFlow,
    result: RecordScanResult,
  ): Promise<void> {
    if (flow === 'scan.pickup_confirmed') {
      await this.scanOutboxService.enqueuePickupConfirmed(result.scanEvent);
    }

    if (flow === 'scan.inbound') {
      await this.scanOutboxService.enqueueInbound(result.scanEvent);
    }

    if (flow === 'scan.outbound') {
      await this.scanOutboxService.enqueueOutbound(result.scanEvent);
    }

    await this.scanOutboxService.enqueueLocationUpdated(
      result.currentLocation,
      result.scanEvent.idempotencyKey,
    );
  }

  private toScanResult(record: IdempotencyRecord): RecordScanResult {
    return {
      scanEvent: {
        id: record.responsePayload.scanEvent.id,
        shipmentCode: record.responsePayload.scanEvent.shipmentCode,
        scanType: record.responsePayload.scanEvent.scanType,
        locationCode: record.responsePayload.scanEvent.locationCode,
        manifestCode: record.responsePayload.scanEvent.manifestCode,
        actor: record.responsePayload.scanEvent.actor,
        note: record.responsePayload.scanEvent.note,
        idempotencyKey: record.responsePayload.scanEvent.idempotencyKey,
        occurredAt: new Date(record.responsePayload.scanEvent.occurredAt),
        createdAt: new Date(record.responsePayload.scanEvent.createdAt),
        updatedAt: new Date(record.responsePayload.scanEvent.updatedAt),
      },
      currentLocation: {
        id: record.responsePayload.currentLocation.id,
        shipmentCode: record.responsePayload.currentLocation.shipmentCode,
        locationCode: record.responsePayload.currentLocation.locationCode,
        lastScanType: record.responsePayload.currentLocation.lastScanType,
        lastScanEventId: record.responsePayload.currentLocation.lastScanEventId,
        lastScannedAt: record.responsePayload.currentLocation.lastScannedAt
          ? new Date(record.responsePayload.currentLocation.lastScannedAt)
          : null,
        manifestCode: record.responsePayload.currentLocation.manifestCode,
        createdAt: new Date(record.responsePayload.currentLocation.createdAt),
        updatedAt: new Date(record.responsePayload.currentLocation.updatedAt),
      },
    };
  }

  private toSnapshot(result: RecordScanResult): RecordScanResultSnapshot {
    return {
      scanEvent: {
        id: result.scanEvent.id,
        shipmentCode: result.scanEvent.shipmentCode,
        scanType: result.scanEvent.scanType,
        locationCode: result.scanEvent.locationCode,
        manifestCode: result.scanEvent.manifestCode,
        actor: result.scanEvent.actor,
        note: result.scanEvent.note,
        idempotencyKey: result.scanEvent.idempotencyKey,
        occurredAt: result.scanEvent.occurredAt.toISOString(),
        createdAt: result.scanEvent.createdAt.toISOString(),
        updatedAt: result.scanEvent.updatedAt.toISOString(),
      },
      currentLocation: {
        id: result.currentLocation.id,
        shipmentCode: result.currentLocation.shipmentCode,
        locationCode: result.currentLocation.locationCode,
        lastScanType: result.currentLocation.lastScanType,
        lastScanEventId: result.currentLocation.lastScanEventId,
        lastScannedAt: result.currentLocation.lastScannedAt
          ? result.currentLocation.lastScannedAt.toISOString()
          : null,
        manifestCode: result.currentLocation.manifestCode,
        createdAt: result.currentLocation.createdAt.toISOString(),
        updatedAt: result.currentLocation.updatedAt.toISOString(),
      },
    };
  }
}
