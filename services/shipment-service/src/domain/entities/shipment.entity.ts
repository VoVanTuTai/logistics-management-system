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
  isLocked: boolean;
  metadata: JsonValue | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShipmentInput {
  code?: string | null;
  metadata?: JsonValue | null;
}

export interface UpdateShipmentInput {
  metadata?: JsonValue | null;
}

export interface CancelShipmentInput {
  reason?: string | null;
}

export interface ReviewShipmentInput {
  note?: string | null;
}

export interface ApproveShipmentInput {
  note?: string | null;
}

export interface ShipmentActionResult {
  action: 'review' | 'approve';
  shipment: Shipment;
}

export interface ShipmentListFilters {
  q?: string | null;
  shipmentCode?: string | null;
  status?: string | null;
  hubCodes?: string | string[] | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  limit?: string | number | null;
  offset?: string | number | null;
}

export interface ShipmentListPageInfo {
  hasNextPage: boolean;
  total: number;
}

export interface ShipmentListPage {
  items: Shipment[];
  pageInfo: ShipmentListPageInfo;
}
