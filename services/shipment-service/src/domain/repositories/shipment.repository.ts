import type {
  CreateShipmentInput,
  Shipment,
  ShipmentListFilters,
  ShipmentListPage,
  UpdateShipmentInput,
} from '../entities/shipment.entity';
import type { ShipmentCurrentStatus } from '../entities/shipment-status.entity';

export abstract class ShipmentRepository {
  abstract list(filters: ShipmentListFilters): Promise<Shipment[]>;
  abstract listPage(filters: ShipmentListFilters): Promise<ShipmentListPage>;
  abstract findByCode(code: string): Promise<Shipment | null>;
  abstract create(input: CreateShipmentInput): Promise<Shipment>;
  abstract update(code: string, input: UpdateShipmentInput): Promise<Shipment>;
  abstract updateMetadataAndLock(
    code: string,
    metadata: CreateShipmentInput['metadata'],
    isLocked: boolean,
  ): Promise<Shipment>;
  abstract updateCurrentStatus(
    code: string,
    currentStatus: ShipmentCurrentStatus,
  ): Promise<Shipment>;
  abstract updateCurrentStatusAndLock(
    code: string,
    currentStatus: ShipmentCurrentStatus,
    isLocked: boolean,
  ): Promise<Shipment>;

  abstract updateCurrentStatusMetadataAndLock(
    code: string,
    currentStatus: ShipmentCurrentStatus,
    metadata: CreateShipmentInput['metadata'],
    isLocked: boolean,
  ): Promise<Shipment>;
  abstract cancel(code: string, reason: string | null): Promise<Shipment>;
}
