import type {
  CreateShipmentInput,
  Shipment,
  UpdateShipmentInput,
} from '../entities/shipment.entity';
import type { ShipmentCurrentStatus } from '../entities/shipment-status.entity';

export abstract class ShipmentRepository {
  abstract list(): Promise<Shipment[]>;
  abstract findByCode(code: string): Promise<Shipment | null>;
  abstract create(input: CreateShipmentInput): Promise<Shipment>;
  abstract update(code: string, input: UpdateShipmentInput): Promise<Shipment>;
  abstract updateCurrentStatus(
    code: string,
    currentStatus: ShipmentCurrentStatus,
  ): Promise<Shipment>;
  abstract cancel(code: string, reason: string | null): Promise<Shipment>;
}
