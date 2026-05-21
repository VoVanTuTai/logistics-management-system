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
  hubCode: string | null;
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
  hubCode?: string | null;
  courierId?: string | null;
}

export interface SyncShipmentCodRecordInput {
  shipmentCode?: string | null;
  code?: string | null;
  merchantId?: string | null;
  currency?: string | null;
  codAmount?: number | string | null;
  hubCode?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SyncShipmentCodRecordResult {
  synced: boolean;
  reason: 'COD_RECORD_READY' | 'NO_COD' | 'MISSING_SHIPMENT_CODE';
  record: CodRecord | null;
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

export interface SePayWebhookHeaders {
  authorization?: string | null;
  signature?: string | null;
  timestamp?: string | null;
}

export interface SePaySettlementWebhookPayload {
  id?: number | string | null;
  gateway?: string | null;
  transactionDate?: string | null;
  accountNumber?: string | null;
  code?: string | null;
  content?: string | null;
  transferType?: string | null;
  transferAmount?: number | string | null;
  accumulated?: number | string | null;
  subAccount?: string | null;
  referenceCode?: string | null;
  description?: string | null;
}

export interface HandleSePaySettlementWebhookInput {
  payload: SePaySettlementWebhookPayload;
  rawBody: Buffer | string | null;
  headers: SePayWebhookHeaders;
}

export interface SePaySettlementWebhookResult {
  success: true;
  provider: 'SEPAY';
  providerEventId: string;
  action: 'confirmed' | 'duplicate' | 'ignored';
  referenceType: 'SETTLEMENT' | 'SHIPMENT' | null;
  settlementCode: string | null;
  settlementId: string | null;
  shipmentCode: string | null;
  codRecordId: string | null;
  amount: number;
  ignoredReason?: string;
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
  hubCode: string | null;
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
  paymentMethod: PaymentMethod;
  status: CodCollectionStatus;
  hubCode: string | null;
  courierId: string | null;
  collectedAt: string | null;
  remittedAt: string | null;
  companyReceivedAt: string | null;
  companyReceivedRef: string | null;
}

export interface CodDailySettlementSummary {
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
  confirmedNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: CodSettlementItem[];
}

export interface CodSettlementQr {
  settlementId: string;
  settlementCode: string;
  reportDate: string;
  hubCode: string;
  courierId: string;
  totalAmount: number;
  status: CodSettlementStatus;
  qrUrl: string;
  transferMemo: string;
}

export interface CodSettlementPaymentEvent {
  id: string;
  provider: string;
  providerEventId: string;
  referenceType: string | null;
  settlementBatchId: string | null;
  settlementCode: string | null;
  codRecordId: string | null;
  shipmentCode: string | null;
  amount: number;
  accountNumber: string | null;
  transferType: string | null;
  referenceCode: string | null;
  transactionDate: Date | null;
  processingStatus: string;
  ignoredReason: string | null;
  rawPayload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface CodSettlementPaymentEventQuery {
  provider?: string | null;
  providerEventId?: string | null;
  referenceType?: string | null;
  processingStatus?: string | null;
  settlementCode?: string | null;
  shipmentCode?: string | null;
  codRecordId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: string | number | null;
}

export interface CodSettlementPaymentEventFilter {
  provider: string | null;
  providerEventId: string | null;
  referenceType: string | null;
  processingStatus: string | null;
  settlementCode: string | null;
  shipmentCode: string | null;
  codRecordId: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  limit: number;
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

export interface RecordCodSettlementPaymentEventInput {
  provider: string;
  providerEventId: string;
  referenceType?: string | null;
  settlementBatchId: string | null;
  settlementCode: string | null;
  codRecordId?: string | null;
  shipmentCode?: string | null;
  amount: number;
  accountNumber: string | null;
  transferType: string | null;
  referenceCode: string | null;
  transactionDate: Date | null;
  processingStatus: string;
  ignoredReason: string | null;
  rawPayload: unknown;
}

export interface RecordCodSettlementPaymentEventResult {
  event: CodSettlementPaymentEvent;
  created: boolean;
}

export interface UpdateCodSettlementPaymentEventInput {
  id: string;
  referenceType?: string | null;
  settlementBatchId?: string | null;
  settlementCode?: string | null;
  codRecordId?: string | null;
  shipmentCode?: string | null;
  processingStatus: string;
  ignoredReason?: string | null;
}

export interface CompanyBankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bin: string;
}
