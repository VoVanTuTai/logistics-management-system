export interface NdrCase {
  id: string;
  shipmentCode: string;
  deliveryAttemptId: string | null;
  reasonCode: string | null;
  note: string | null;
  status: 'CREATED' | 'RESCHEDULED';
  rescheduleAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NdrCaseSnapshot {
  id: string;
  shipmentCode: string;
  deliveryAttemptId: string | null;
  reasonCode: string | null;
  note: string | null;
  status: 'CREATED' | 'RESCHEDULED';
  rescheduleAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNdrCaseInput {
  shipmentCode: string;
  deliveryAttemptId?: string | null;
  reasonCode?: string | null;
  note?: string | null;
}

export interface RescheduleNdrCaseInput {
  rescheduleAt?: string | null;
  note?: string | null;
}
