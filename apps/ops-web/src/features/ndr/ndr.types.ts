export interface NdrCaseListItemDto {
  id: string;
  shipmentCode: string;
  status: string;
  reasonCode: string | null;
  updatedAt: string;
}

export interface NdrCaseDetailDto {
  id: string;
  shipmentCode: string;
  status: string;
  reasonCode: string | null;
  updatedAt: string;
  note?: string | null;
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
