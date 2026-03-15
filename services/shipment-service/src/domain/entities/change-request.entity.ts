import type { JsonValue } from './shipment.entity';

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ChangeRequest {
  id: string;
  shipmentCode: string;
  requestType: string;
  payload: JsonValue;
  status: ChangeRequestStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChangeRequestInput {
  shipmentCode: string;
  requestType: string;
  payload: JsonValue;
  requestedBy?: string | null;
}

export interface ApproveChangeRequestInput {
  approvedBy?: string | null;
}
