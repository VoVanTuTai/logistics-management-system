import type {
  PickupRequest,
  CreatePickupRequestInput,
  UpdatePickupRequestInput,
} from '../entities/pickup-request.entity';

export abstract class PickupRequestRepository {
  abstract list(): Promise<PickupRequest[]>;
  abstract findById(id: string): Promise<PickupRequest | null>;
  abstract findByShipmentCode(shipmentCode: string): Promise<PickupRequest | null>;
  abstract create(input: CreatePickupRequestInput): Promise<PickupRequest>;
  abstract update(
    id: string,
    input: UpdatePickupRequestInput,
  ): Promise<PickupRequest>;
  abstract cancel(id: string, reason: string | null): Promise<PickupRequest>;
  abstract complete(id: string): Promise<PickupRequest>;
}
