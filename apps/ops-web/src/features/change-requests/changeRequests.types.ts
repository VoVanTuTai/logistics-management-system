export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ChangeRequestDto {
  id: string;
  shipmentCode: string;
  requestType: string;
  payload: unknown;
  status: ChangeRequestStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveChangeRequestInput {
  approvedBy?: string | null;
}
