import type { ShipmentCurrentStatus } from './shipment-status.entity';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Shipment {
  id: string;
  code: string;
  currentStatus: ShipmentCurrentStatus;
  metadata: JsonValue | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShipmentInput {
  code: string;
  metadata?: JsonValue | null;
}

export interface UpdateShipmentInput {
  metadata?: JsonValue | null;
}

export interface CancelShipmentInput {
  reason?: string | null;
}
