export interface NdrCaseDto {
  id: string;
  shipmentCode: string;
  status: string;
  reasonCode: string | null;
  updatedAt: string;
}

export interface RescheduleInput {
  ndrId: string;
  nextDeliveryAt: string;
  note?: string | null;
}

export interface ReturnDecisionInput {
  ndrId: string;
  returnToSender: boolean;
  note?: string | null;
}

