export interface CodRecordDto {
  id: string;
  shipmentCode: string;
  merchantId: string | null;
  codAmount: number;
  currency: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'PREPAID';
  status: 'PENDING' | 'COLLECTED' | 'REMITTED' | 'FAILED';
  courierId: string | null;
  collectedAt: string | null;
  collectedAmount: number | null;
  remittedAt: string | null;
  remittedBy: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodSummaryDto {
  totalPending: number;
  totalCollected: number;
  totalRemitted: number;
  totalFailed: number;
  pendingAmount: number;
  collectedAmount: number;
  remittedAmount: number;
}

export interface CompanyBankInfoDto {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bin: string;
}

export interface CollectCodPayload {
  shipmentCode: string;
  collectedAmount: number;
  courierId: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  idempotencyKey: string;
  occurredAt?: string;
  note?: string;
}

export interface RemitCodPayload {
  shipmentCode: string;
  remittedBy: string;
  idempotencyKey: string;
  note?: string;
}
