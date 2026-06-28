import type {
  CourierCurrentLocation,
  CurrentLocation,
  UpsertCourierLocationInput,
  UpsertCurrentLocationInput,
} from '../entities/current-location.entity';

export abstract class CurrentLocationRepository {
  abstract findByShipmentCode(
    shipmentCode: string,
  ): Promise<CurrentLocation | null>;

  abstract findCourierByCourierId(
    courierId: string,
  ): Promise<CourierCurrentLocation | null>;

  abstract findLatestCourierByShipmentCode(
    shipmentCode: string,
  ): Promise<CourierCurrentLocation | null>;

  abstract upsert(
    input: UpsertCurrentLocationInput,
  ): Promise<CurrentLocation>;

  abstract upsertCourierLocation(
    input: UpsertCourierLocationInput,
  ): Promise<CourierCurrentLocation>;
}
