export interface NdrCaseListItemDto {
  id: string;
  shipmentCode: string;
  status: string;
  reasonCode: string | null;
  issueType?: string | null;
  issueCategory?: string | null;
  reportedBy?: string | null;
  reportedHubCode?: string | null;
  note?: string | null;
  attachments?: unknown;
  createdAt?: string;
  updatedAt: string;
}

export interface NdrCaseDetailDto {
  id: string;
  shipmentCode: string;
  status: string;
  reasonCode: string | null;
  issueType?: string | null;
  issueCategory?: string | null;
  reportedBy?: string | null;
  reportedHubCode?: string | null;
  attachments?: unknown;
  createdAt?: string;
  updatedAt: string;
  note?: string | null;
}

export interface NdrCaseListFilters {
  shipmentCode?: string;
  status?: string;
}

export interface RescheduleInput {
  nextDeliveryAt: string;
  note?: string | null;
}

export interface ReturnDecisionInput {
  returnToSender: boolean;
  note?: string | null;
}

export type NdrActionResultDto = Record<string, unknown>;
