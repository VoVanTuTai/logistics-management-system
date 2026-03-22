import type {
  CurrentLocation,
  UpsertCurrentLocationInput,
} from '../entities/current-location.entity';

export abstract class CurrentLocationRepository {
  abstract findByShipmentCode(
    shipmentCode: string,
  ): Promise<CurrentLocation | null>;

  abstract upsert(
    input: UpsertCurrentLocationInput,
  ): Promise<CurrentLocation>;
}
