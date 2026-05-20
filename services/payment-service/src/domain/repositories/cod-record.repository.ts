import type {
  CodSettlementBatch,
  CodDailySettlementRecordFilter,
  CodSettlementBatchFilter,
  CodRecord,
  ConfirmCodSettlementBatchRecordInput,
  CreateCodSettlementBatchRecordInput,
  CreateCodRecordInput,
} from '../entities/cod-record.entity';

export abstract class CodRecordRepository {
  abstract create(input: CreateCodRecordInput): Promise<CodRecord>;

  abstract findByShipmentCode(shipmentCode: string): Promise<CodRecord | null>;

  abstract listByShipmentCodes(shipmentCodes: string[]): Promise<CodRecord[]>;

  abstract listByCourierId(courierId: string, status?: string): Promise<CodRecord[]>;

  abstract listForDailySettlement(
    filter: CodDailySettlementRecordFilter,
  ): Promise<CodRecord[]>;

  abstract listSettlementBatches(
    filter: CodSettlementBatchFilter,
  ): Promise<CodSettlementBatch[]>;

  abstract createSettlementBatch(
    input: CreateCodSettlementBatchRecordInput,
  ): Promise<CodSettlementBatch>;

  abstract findSettlementBatchById(id: string): Promise<CodSettlementBatch | null>;

  abstract confirmSettlementBatch(
    input: ConfirmCodSettlementBatchRecordInput,
  ): Promise<CodSettlementBatch | null>;

  abstract markCollected(
    id: string,
    collectedAmount: number,
    courierId: string,
    paymentMethod: string,
    collectedAt: Date,
    note: string | null,
  ): Promise<CodRecord>;

  abstract markRemitted(
    id: string,
    remittedBy: string,
    remittedAt: Date,
    note: string | null,
  ): Promise<CodRecord>;

  abstract markFailed(id: string): Promise<CodRecord>;

  abstract getCodSummaryByCourier(courierId: string): Promise<{
    pendingCount: number;
    collectedCount: number;
    remittedCount: number;
    failedCount: number;
    pendingAmount: number;
    collectedAmount: number;
    remittedAmount: number;
  }>;
}
