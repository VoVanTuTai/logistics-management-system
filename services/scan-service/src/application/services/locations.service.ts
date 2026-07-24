import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CourierCurrentLocation,
  CourierLocationHistory,
  CurrentLocation,
  LocationSource,
  UpsertCourierLocationInput,
} from '../../domain/entities/current-location.entity';
import { CurrentLocationRepository } from '../../domain/repositories/current-location.repository';
import { LocationsRealtimeGateway } from '../../realtime/locations-realtime.gateway';
import { ScansService } from './scans.service';


@Injectable()
export class LocationsService {
  constructor(
    private readonly scansService: ScansService,
    @Inject(CurrentLocationRepository)
    private readonly currentLocationRepository: CurrentLocationRepository,
    private readonly locationsRealtimeGateway: LocationsRealtimeGateway,
  ) {}

  getByShipmentCode(shipmentCode: string): Promise<CurrentLocation> {
    return this.scansService.getCurrentLocation(shipmentCode);
  }

  async getByCourierId(courierId: string): Promise<CourierCurrentLocation> {
    const normalizedCourierId = normalizeRequiredText(courierId, 'courierId');
    const currentLocation =
      await this.currentLocationRepository.findCourierByCourierId(
        normalizedCourierId,
      );

    if (!currentLocation) {
      throw new NotFoundException(
        `Current location for courier "${normalizedCourierId}" was not found.`,
      );
    }

    return currentLocation;
  }

  async getLatestPositionByShipmentCode(
    shipmentCode: string,
  ): Promise<CourierCurrentLocation | CurrentLocation> {
    const normalizedShipmentCode = normalizeRequiredText(
      shipmentCode,
      'shipmentCode',
    ).toUpperCase();
    const [shipmentLocation, courierLocation] = await Promise.all([
      this.currentLocationRepository.findByShipmentCode(normalizedShipmentCode),
      this.currentLocationRepository.findLatestCourierByShipmentCode(
        normalizedShipmentCode,
      ),
    ]);
    const latestLocation = pickLatestPosition(shipmentLocation, courierLocation);

    if (!latestLocation) {
      throw new NotFoundException(
        `Latest GPS position for shipment "${normalizedShipmentCode}" was not found.`,
      );
    }

    return latestLocation;
  }

  async recordCourierLocation(
    input: RecordCourierLocationRequest,
  ): Promise<CourierCurrentLocation> {
    const normalizedInput = this.normalizeCourierLocationInput(input);
    const [currentLocation] = await Promise.all([
      this.currentLocationRepository.upsertCourierLocation(normalizedInput),
      this.currentLocationRepository.createLocationHistory(normalizedInput),
    ]);

    this.pruneOldHistoryAsync(normalizedInput.capturedAt);

    this.locationsRealtimeGateway.publishLocationUpdated(currentLocation);

    return currentLocation;
  }

  async getCourierHistory(
    courierId: string,
    limitInput?: number | string | null,
  ): Promise<CourierLocationHistory[]> {
    const normalizedCourierId = normalizeRequiredText(courierId, 'courierId');
    const limit = limitInput && !Number.isNaN(Number(limitInput)) ? Math.max(1, Number(limitInput)) : 100;
    return this.currentLocationRepository.getCourierHistory(normalizedCourierId, limit);
  }

  async getShipmentHistory(
    shipmentCode: string,
  ): Promise<CourierLocationHistory[]> {
    const normalizedShipmentCode = normalizeRequiredText(shipmentCode, 'shipmentCode').toUpperCase();
    return this.currentLocationRepository.getShipmentHistory(normalizedShipmentCode);
  }

  private pruneOldHistoryAsync(now: Date): void {
    const retentionDays = 7;
    const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    this.currentLocationRepository.pruneLocationHistory(cutoff).catch(() => {
      // Ignore errors in background pruning task.
    });
  }

  private normalizeCourierLocationInput(
    input: RecordCourierLocationRequest,
  ): UpsertCourierLocationInput {
    const courierId = normalizeRequiredText(input.courierId, 'courierId');
    const latitude = normalizeCoordinate(input.latitude, 'latitude', -90, 90);
    const longitude = normalizeCoordinate(input.longitude, 'longitude', -180, 180);
    const accuracy = normalizeOptionalAccuracy(input.accuracy);
    const capturedAt = normalizeCapturedAt(input.capturedAt);
    const source = normalizeSource(input.source);

    return {
      courierId,
      taskId: normalizeOptionalText(input.taskId),
      shipmentCode: normalizeOptionalText(input.shipmentCode)?.toUpperCase() ?? null,
      latitude,
      longitude,
      accuracy,
      capturedAt,
      source,
    };
  }
}

export interface RecordCourierLocationRequest {
  courierId?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  accuracy?: number | string | null;
  capturedAt?: string | null;
  taskId?: string | null;
  shipmentCode?: string | null;
  source?: string | null;
}

function pickLatestPosition(
  shipmentLocation: CurrentLocation | null,
  courierLocation: CourierCurrentLocation | null,
): CurrentLocation | CourierCurrentLocation | null {
  const shipmentCapturedAt = shipmentLocation?.capturedAt?.getTime() ?? null;
  const courierCapturedAt = courierLocation?.capturedAt.getTime() ?? null;

  if (shipmentCapturedAt === null && courierCapturedAt === null) {
    return null;
  }

  if (shipmentCapturedAt !== null && courierCapturedAt !== null) {
    return shipmentCapturedAt >= courierCapturedAt
      ? shipmentLocation
      : courierLocation;
  }

  return shipmentCapturedAt !== null ? shipmentLocation : courierLocation;
}

function normalizeRequiredText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';

  return normalized.length > 0 ? normalized : null;
}

function normalizeCoordinate(
  value: number | string | null | undefined,
  fieldName: string,
  min: number,
  max: number,
): number {
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;

  if (
    typeof parsed !== 'number' ||
    !Number.isFinite(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    throw new BadRequestException(
      `${fieldName} must be a finite number between ${min} and ${max}.`,
    );
  }

  return Number(parsed.toFixed(6));
}

function normalizeOptionalAccuracy(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'string' ? Number(value.trim()) : value;

  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException('accuracy must be a non-negative number.');
  }

  return Math.round(parsed);
}

function normalizeCapturedAt(value: string | null | undefined): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('capturedAt must be a valid ISO date.');
  }

  return parsed;
}

function normalizeSource(value: string | null | undefined): LocationSource {
  const normalized = value?.trim().toUpperCase() || 'GPS';

  if (normalized === 'GPS' || normalized === 'MANUAL' || normalized === 'SCAN') {
    return normalized;
  }

  throw new BadRequestException('source must be GPS, MANUAL, or SCAN.');
}
