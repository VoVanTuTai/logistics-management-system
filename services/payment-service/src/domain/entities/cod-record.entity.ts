export type CodCollectionStatus = 'PENDING' | 'COLLECTED' | 'REMITTED' | 'FAILED';
export type CodSettlementStatus = 'WAITING_PAYMENT' | 'PAID' | 'CANCELLED';
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

export interface ConfirmCodSettlementInput {
  confirmedBy: string;
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

export interface CodDailySettlementQuery {
  date?: string | null;
  hubCode?: string | null;
  courierId?: string | null;
  status?: string | null;
}

export interface CodDailySettlementRecordFilter {
  dateFrom: Date | null;
  dateTo: Date | null;
  courierId: string | null;
  status: CodCollectionStatus | null;
}

export interface CodSettlementBatchFilter {
  dateFrom: Date | null;
  dateTo: Date | null;
  hubCode: string | null;
  courierId: string | null;
}

export interface CodDailySettlementRecord {
  shipmentCode: string;
  codAmount: number;
  collectedAmount: number | null;
  status: CodCollectionStatus;
  courierId: string | null;
  collectedAt: string | null;
  remittedAt: string | null;
}

export interface CodDailySettlementSummary {
  reportDate: string;
  hubCode: string;
  courierId: string;
  codOrders: number;
  codTotal: number;
  collectedTotal: number;
  remittedTotal: number;
  pendingRemitTotal: number;
  records: CodDailySettlementRecord[];
  batches: CodSettlementBatch[];
}

export interface CodSettlementItem {
  id: string;
  batchId: string;
  codRecordId: string;
  shipmentCode: string;
  amount: number;
}

export interface CodSettlementBatch {
  id: string;
  settlementCode: string;
  reportDate: Date;
  hubCode: string;
  courierId: string;
  totalAmount: number;
  status: CodSettlementStatus;
  qrUrl: string | null;
  transferMemo: string;
  createdBy: string | null;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: CodSettlementItem[];
}

export interface CreateCodSettlementInput {
  reportDate: string;
  hubCode: string;
  courierId: string;
  shipmentCodes: string[];
  createdBy?: string | null;
}

export interface CreateCodSettlementBatchRecordInput {
  settlementCode: string;
  reportDate: Date;
  hubCode: string;
  courierId: string;
  totalAmount: number;
  qrUrl: string;
  transferMemo: string;
  createdBy: string | null;
  items: Array<{
    codRecordId: string;
    shipmentCode: string;
    amount: number;
  }>;
}

export interface ConfirmCodSettlementBatchRecordInput {
  id: string;
  confirmedBy: string;
  confirmedAt: Date;
  note: string | null;
}

export interface CompanyBankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bin: string;
}
