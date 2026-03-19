export const NDR_CASE_STATUSES = ['CREATED', 'RESCHEDULED', 'RETURN_REQUESTED'] as const;

export type NdrCaseStatus = (typeof NDR_CASE_STATUSES)[number];

export interface NdrCase {
  id: string;
  shipmentCode: string;
  deliveryAttemptId: string | null;
  reasonCode: string | null;
  note: string | null;
  status: NdrCaseStatus;
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
  status: NdrCaseStatus;
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
  nextDeliveryAt?: string | null;
  rescheduleAt?: string | null;
  note?: string | null;
}

export interface ReturnDecisionInput {
  returnToSender: boolean;
  note?: string | null;
}

export interface ListNdrCasesFilter {
  shipmentCode?: string;
  status?: NdrCaseStatus;
}
