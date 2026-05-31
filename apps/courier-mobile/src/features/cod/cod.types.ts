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

export interface CodSettlementBatchDto {
  id: string;
  settlementCode: string;
  reportDate: string;
  hubCode: string;
  courierId: string;
  totalAmount: number;
  status: 'WAITING_PAYMENT' | 'PAID' | 'CANCELLED';
  qrUrl: string | null;
  transferMemo: string;
  createdBy: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  confirmedNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodDailySettlementSummaryDto {
  reportDate: string;
  hubCode: string;
  courierId: string;
  codOrders: number;
  codTotal: number;
  collectedTotal: number;
  cashCollectedTotal: number;
  bankTransferTotal: number;
  companyReceivedTotal: number;
  remittedTotal: number;
  pendingRemitTotal: number;
  pendingCashRemitTotal: number;
  waitingBankConfirmTotal: number;
  records: Array<{
    shipmentCode: string;
    codAmount: number;
    collectedAmount: number | null;
    paymentMethod: string;
    status: string;
    hubCode: string | null;
    courierId: string | null;
    collectedAt: string | null;
    remittedAt: string | null;
    companyReceivedAt: string | null;
    companyReceivedRef: string | null;
  }>;
  batches: CodSettlementBatchDto[];
}
