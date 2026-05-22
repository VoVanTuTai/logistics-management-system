export type ReturnCaseStatus = 'STARTED' | 'COMPLETED';

export interface ReturnCaseDto {
  id: string;
  shipmentCode: string;
  ndrCaseId: string | null;
  note: string | null;
  status: ReturnCaseStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnCaseFilters {
  shipmentCode?: string | null;
  ndrCaseId?: string | null;
  status?: ReturnCaseStatus | 'ALL' | null;
}

export interface CreateReturnCaseInput {
  shipmentCode: string;
  ndrCaseId?: string | null;
  note?: string | null;
}

export interface CompleteReturnCaseInput {
  note?: string | null;
}
