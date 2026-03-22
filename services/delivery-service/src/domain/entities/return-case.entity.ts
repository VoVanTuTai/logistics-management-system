export interface ReturnCase {
  id: string;
  shipmentCode: string;
  ndrCaseId: string | null;
  note: string | null;
  status: 'STARTED' | 'COMPLETED';
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnCaseSnapshot {
  id: string;
  shipmentCode: string;
  ndrCaseId: string | null;
  note: string | null;
  status: 'STARTED' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnCaseInput {
  shipmentCode: string;
  ndrCaseId?: string | null;
  note?: string | null;
}

export interface CompleteReturnCaseInput {
  note?: string | null;
}
