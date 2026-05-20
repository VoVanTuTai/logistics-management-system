export type CodCollectionStatus = 'PENDING' | 'COLLECTED' | 'REMITTED' | 'FAILED';
export type CodSettlementStatus = 'WAITING_PAYMENT' | 'PAID' | 'CANCELLED';
export type CodPaymentMethod = 'COD' | 'BANK_TRANSFER' | 'PREPAID';

export interface CodDailySettlementFilters {
  date?: string | null;
  hubCode?: string | null;
  courierId?: string | null;
  status?: CodCollectionStatus | 'ALL' | null;
}

export interface CodDailySettlementRecordDto {
  shipmentCode: string;
  codAmount: number;
  collectedAmount: number | null;
  paymentMethod: CodPaymentMethod;
  status: CodCollectionStatus;
  courierId: string | null;
  collectedAt: string | null;
  remittedAt: string | null;
  companyReceivedAt?: string | null;
  companyReceivedRef?: string | null;
}

export interface CodDailySettlementSummaryDto {
  reportDate: string;
  hubCode: string;
  courierId: string;
  codOrders: number;
  codTotal: number;
  collectedTotal: number;
  cashCollectedTotal?: number;
  bankTransferTotal?: number;
  companyReceivedTotal?: number;
  remittedTotal: number;
  pendingRemitTotal: number;
  pendingCashRemitTotal?: number;
  waitingBankConfirmTotal?: number;
  records: CodDailySettlementRecordDto[];
  batches: CodSettlementBatchDto[];
}

export interface CodSettlementItemDto {
  id: string;
  batchId: string;
  codRecordId: string;
  shipmentCode: string;
  amount: number;
}

export interface CodSettlementBatchDto {
  id: string;
  settlementCode: string;
  reportDate: string;
  hubCode: string;
  courierId: string;
  totalAmount: number;
  status: CodSettlementStatus;
  qrUrl: string | null;
  transferMemo: string;
  createdBy: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: CodSettlementItemDto[];
}

export interface CreateCodSettlementInput {
  reportDate: string;
  hubCode: string;
  courierId: string;
  shipmentCodes: string[];
  createdBy?: string | null;
}

export interface ConfirmCodSettlementInput {
  confirmedBy: string;
  note?: string | null;
}

export interface ConfirmCodSettlementMutationInput {
  settlementId: string;
  payload: ConfirmCodSettlementInput;
}
