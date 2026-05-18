export const NDR_CASE_STATUSES = [
  'PENDING_RESOLUTION',
  'CREATED',
  'RESCHEDULED',
  'RETURN_REQUESTED',
] as const;

export type NdrCaseStatus = (typeof NDR_CASE_STATUSES)[number];

export interface NdrCase {
  id: string;
  shipmentCode: string;
  deliveryAttemptId: string | null;
  reasonCode: string | null;
  issueType: string | null;
  issueCategory: string | null;
  attachments: unknown | null;
  reportedBy: string | null;
  reportedHubCode: string | null;
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
  issueType: string | null;
  issueCategory: string | null;
  attachments: unknown | null;
  reportedBy: string | null;
  reportedHubCode: string | null;
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
  issueType?: string | null;
  issueCategory?: string | null;
  attachments?: unknown;
  reportedBy?: string | null;
  reportedHubCode?: string | null;
  note?: string | null;
  status?: NdrCaseStatus;
}

export interface ReportShipmentExceptionInput {
  shipmentCode: string;
  currentHubCode: string;
  issueType: string;
  issueCategory?: string | null;
  attachments?: Array<{
    uri?: string | null;
    url?: string | null;
    type?: string | null;
    name?: string | null;
  }>;
  note?: string | null;
  actor?: string | null;
  occurredAt?: string | null;
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
