import type { CodRecord, CreateCodRecordInput } from '../entities/cod-record.entity';

export abstract class CodRecordRepository {
  abstract create(input: CreateCodRecordInput): Promise<CodRecord>;

  abstract findByShipmentCode(shipmentCode: string): Promise<CodRecord | null>;

  abstract listByCourierId(courierId: string, status?: string): Promise<CodRecord[]>;

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
