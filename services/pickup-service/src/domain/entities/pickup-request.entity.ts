export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type PickupRequestStatus = 'REQUESTED' | 'CANCELLED' | 'COMPLETED';

export interface PickupRequest {
  id: string;
  pickupCode: string;
  status: PickupRequestStatus;
  requesterName: string | null;
  contactPhone: string | null;
  pickupAddress: string | null;
  note: string | null;
  cancellationReason: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: PickupItem[];
}

export interface PickupItem {
  id: string;
  pickupRequestId: string;
  shipmentCode: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PickupItemInput {
  shipmentCode: string;
  quantity?: number;
}

export interface CreatePickupRequestInput {
  pickupCode: string;
  requesterName?: string | null;
  contactPhone?: string | null;
  pickupAddress?: string | null;
  note?: string | null;
  items?: PickupItemInput[];
}

export interface UpdatePickupRequestInput {
  requesterName?: string | null;
  contactPhone?: string | null;
  pickupAddress?: string | null;
  note?: string | null;
}

export interface CancelPickupRequestInput {
  reason?: string | null;
}
