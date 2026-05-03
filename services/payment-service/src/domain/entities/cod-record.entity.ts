export type CodCollectionStatus = 'PENDING' | 'COLLECTED' | 'REMITTED' | 'FAILED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'PREPAID';

export interface CodRecord {
  id: string;
  shipmentCode: string;
  merchantId: string | null;
  codAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: CodCollectionStatus;
  courierId: string | null;
  collectedAt: Date | null;
  collectedAmount: number | null;
  remittedAt: Date | null;
  remittedBy: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCodRecordInput {
  shipmentCode: string;
  merchantId?: string | null;
  codAmount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  courierId?: string | null;
}

export interface CollectCodInput {
  shipmentCode: string;
  collectedAmount: number;
  courierId: string;
  paymentMethod: PaymentMethod;
  occurredAt?: string | null;
  idempotencyKey: string;
  note?: string | null;
}

export interface RemitCodInput {
  shipmentCode: string;
  remittedBy: string;
  idempotencyKey: string;
  note?: string | null;
}

export interface CodSummary {
  totalPending: number;
  totalCollected: number;
  totalRemitted: number;
  totalFailed: number;
  pendingAmount: number;
  collectedAmount: number;
  remittedAmount: number;
}

export interface CompanyBankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bin: string;
}
