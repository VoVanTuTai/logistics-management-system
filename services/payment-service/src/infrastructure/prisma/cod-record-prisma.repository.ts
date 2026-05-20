import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma as PrismaNamespace } from '@prisma/client';
import type {
  CodRecord as PrismaCodRecord,
  CodSettlementBatch as PrismaCodSettlementBatch,
  CodSettlementPaymentEvent as PrismaCodSettlementPaymentEvent,
  CodSettlementItem as PrismaCodSettlementItem,
  Prisma,
} from '@prisma/client';

import type {
  CodDailySettlementRecordFilter,
  CodRecord,
  CodSettlementBatch,
  CodSettlementPaymentEvent,
  CodSettlementBatchFilter,
  ConfirmCodSettlementBatchRecordInput,
  CreateCodSettlementBatchRecordInput,
  CreateCodRecordInput,
  RecordCodSettlementPaymentEventInput,
  RecordCodSettlementPaymentEventResult,
  UpdateCodSettlementPaymentEventInput,
} from '../../domain/entities/cod-record.entity';
import { CodRecordRepository } from '../../domain/repositories/cod-record.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class CodRecordPrismaRepository extends CodRecordRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: CreateCodRecordInput): Promise<CodRecord> {
    const data: Prisma.CodRecordCreateInput = {
      shipmentCode: input.shipmentCode,
      merchantId: input.merchantId ?? null,
      codAmount: input.codAmount,
      currency: input.currency ?? 'VND',
      paymentMethod: input.paymentMethod ?? 'COD',
      courierId: input.courierId ?? null,
    };

    const record = await this.prisma.codRecord.create({ data });
    return this.toEntity(record);
  }

  async findByShipmentCode(shipmentCode: string): Promise<CodRecord | null> {
    const record = await this.prisma.codRecord.findUnique({
      where: { shipmentCode },
    });

    return record ? this.toEntity(record) : null;
  }

  async listByShipmentCodes(shipmentCodes: string[]): Promise<CodRecord[]> {
    const records = await this.prisma.codRecord.findMany({
      where: {
        shipmentCode: {
          in: shipmentCodes,
        },
      },
      orderBy: {
        shipmentCode: 'asc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async listByCourierId(courierId: string, status?: string): Promise<CodRecord[]> {
    const where: Prisma.CodRecordWhereInput = { courierId };
    if (status) {
      where.status = status as CodRecord['status'];
    }

    const records = await this.prisma.codRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toEntity(r));
  }

  async listForDailySettlement(
    filter: CodDailySettlementRecordFilter,
  ): Promise<CodRecord[]> {
    const where: Prisma.CodRecordWhereInput = {};

    if (filter.courierId) {
      where.courierId = filter.courierId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.dateFrom && filter.dateTo) {
      where.OR = [
        {
          collectedAt: {
            gte: filter.dateFrom,
            lt: filter.dateTo,
          },
        },
        {
          collectedAt: null,
          updatedAt: {
            gte: filter.dateFrom,
            lt: filter.dateTo,
          },
        },
      ];
    }

    const records = await this.prisma.codRecord.findMany({
      where,
      orderBy: [
        { collectedAt: 'desc' },
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return records.map((record) => this.toEntity(record));
  }

  async listSettlementBatches(
    filter: CodSettlementBatchFilter,
  ): Promise<CodSettlementBatch[]> {
    const where: Prisma.CodSettlementBatchWhereInput = {};

    if (filter.hubCode) {
      where.hubCode = filter.hubCode;
    }

    if (filter.courierId) {
      where.courierId = filter.courierId;
    }

    if (filter.dateFrom && filter.dateTo) {
      where.reportDate = {
        gte: filter.dateFrom,
        lt: filter.dateTo,
      };
    }

    const records = await this.prisma.codSettlementBatch.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toSettlementBatchEntity(record));
  }

  async createSettlementBatch(
    input: CreateCodSettlementBatchRecordInput,
  ): Promise<CodSettlementBatch> {
    try {
      const batch = await this.prisma.$transaction(async (tx) => {
        return tx.codSettlementBatch.create({
          data: {
            settlementCode: input.settlementCode,
            reportDate: input.reportDate,
            hubCode: input.hubCode,
            courierId: input.courierId,
            totalAmount: input.totalAmount,
            qrUrl: input.qrUrl,
            transferMemo: input.transferMemo,
            createdBy: input.createdBy,
            items: {
              create: input.items.map((item) => ({
                codRecordId: item.codRecordId,
                shipmentCode: item.shipmentCode,
                amount: item.amount,
              })),
            },
          },
          include: {
            items: true,
          },
        });
      });

      return this.toSettlementBatchEntity(batch);
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'One or more COD records already belong to a settlement batch.',
        );
      }

      throw error;
    }
  }

  async findSettlementBatchById(id: string): Promise<CodSettlementBatch | null> {
    const record = await this.prisma.codSettlementBatch.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    return record ? this.toSettlementBatchEntity(record) : null;
  }

  async findSettlementBatchByCode(
    settlementCode: string,
  ): Promise<CodSettlementBatch | null> {
    const record = await this.prisma.codSettlementBatch.findUnique({
      where: { settlementCode },
      include: {
        items: true,
      },
    });

    return record ? this.toSettlementBatchEntity(record) : null;
  }

  async confirmSettlementBatch(
    input: ConfirmCodSettlementBatchRecordInput,
  ): Promise<CodSettlementBatch | null> {
    const batch = await this.prisma.$transaction(async (tx) => {
      const current = await tx.codSettlementBatch.findUnique({
        where: {
          id: input.id,
        },
        include: {
          items: true,
        },
      });

      if (!current) {
        return null;
      }

      if (current.status === 'PAID') {
        return current;
      }

      if (current.status !== 'WAITING_PAYMENT') {
        return current;
      }

      const codRecordIds = current.items.map((item) => item.codRecordId);

      await tx.codRecord.updateMany({
        where: {
          id: {
            in: codRecordIds,
          },
        },
        data: {
          status: 'REMITTED',
          remittedBy: input.confirmedBy,
          remittedAt: input.confirmedAt,
          note: input.note ?? undefined,
        },
      });

      return tx.codSettlementBatch.update({
        where: {
          id: input.id,
        },
        data: {
          status: 'PAID',
          confirmedBy: input.confirmedBy,
          confirmedAt: input.confirmedAt,
        },
        include: {
          items: true,
        },
      });
    });

    return batch ? this.toSettlementBatchEntity(batch) : null;
  }

  async recordSettlementPaymentEvent(
    input: RecordCodSettlementPaymentEventInput,
  ): Promise<RecordCodSettlementPaymentEventResult> {
    try {
      const event = await this.prisma.codSettlementPaymentEvent.create({
        data: {
          provider: input.provider,
          providerEventId: input.providerEventId,
          settlementBatchId: input.settlementBatchId,
          settlementCode: input.settlementCode,
          amount: input.amount,
          accountNumber: input.accountNumber,
          transferType: input.transferType,
          referenceCode: input.referenceCode,
          transactionDate: input.transactionDate,
          processingStatus: input.processingStatus,
          ignoredReason: input.ignoredReason,
          rawPayload: input.rawPayload as Prisma.InputJsonValue,
        },
      });

      return {
        event: this.toSettlementPaymentEventEntity(event),
        created: true,
      };
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.codSettlementPaymentEvent.findUnique({
          where: {
            provider_providerEventId: {
              provider: input.provider,
              providerEventId: input.providerEventId,
            },
          },
        });

        if (existing) {
          return {
            event: this.toSettlementPaymentEventEntity(existing),
            created: false,
          };
        }
      }

      throw error;
    }
  }

  async updateSettlementPaymentEvent(
    input: UpdateCodSettlementPaymentEventInput,
  ): Promise<CodSettlementPaymentEvent> {
    const event = await this.prisma.codSettlementPaymentEvent.update({
      where: {
        id: input.id,
      },
      data: {
        settlementBatchId: input.settlementBatchId,
        settlementCode: input.settlementCode,
        processingStatus: input.processingStatus,
        ignoredReason: input.ignoredReason,
      },
    });

    return this.toSettlementPaymentEventEntity(event);
  }

  async markCollected(
    id: string,
    collectedAmount: number,
    courierId: string,
    paymentMethod: string,
    collectedAt: Date,
    note: string | null,
  ): Promise<CodRecord> {
    const record = await this.prisma.codRecord.update({
      where: { id },
      data: {
        status: 'COLLECTED',
        collectedAmount,
        courierId,
        paymentMethod: paymentMethod as CodRecord['paymentMethod'],
        collectedAt,
        note,
      },
    });

    return this.toEntity(record);
  }

  async markRemitted(
    id: string,
    remittedBy: string,
    remittedAt: Date,
    note: string | null,
  ): Promise<CodRecord> {
    const record = await this.prisma.codRecord.update({
      where: { id },
      data: {
        status: 'REMITTED',
        remittedBy,
        remittedAt,
        note: note ?? undefined,
      },
    });

    return this.toEntity(record);
  }

  async markFailed(id: string): Promise<CodRecord> {
    const record = await this.prisma.codRecord.update({
      where: { id },
      data: { status: 'FAILED' },
    });

    return this.toEntity(record);
  }

  async getCodSummaryByCourier(courierId: string): Promise<{
    pendingCount: number;
    collectedCount: number;
    remittedCount: number;
    failedCount: number;
    pendingAmount: number;
    collectedAmount: number;
    remittedAmount: number;
  }> {
    const records = await this.prisma.codRecord.findMany({
      where: { courierId },
    });

    let pendingCount = 0;
    let collectedCount = 0;
    let remittedCount = 0;
    let failedCount = 0;
    let pendingAmount = 0;
    let collectedAmount = 0;
    let remittedAmount = 0;

    for (const r of records) {
      switch (r.status) {
        case 'PENDING':
          pendingCount++;
          pendingAmount += r.codAmount;
          break;
        case 'COLLECTED':
          collectedCount++;
          collectedAmount += r.collectedAmount ?? r.codAmount;
          break;
        case 'REMITTED':
          remittedCount++;
          remittedAmount += r.collectedAmount ?? r.codAmount;
          break;
        case 'FAILED':
          failedCount++;
          break;
      }
    }

    return {
      pendingCount,
      collectedCount,
      remittedCount,
      failedCount,
      pendingAmount,
      collectedAmount,
      remittedAmount,
    };
  }

  private toEntity(record: PrismaCodRecord): CodRecord {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      merchantId: record.merchantId,
      codAmount: record.codAmount,
      currency: record.currency,
      paymentMethod: record.paymentMethod as CodRecord['paymentMethod'],
      status: record.status as CodRecord['status'],
      courierId: record.courierId,
      collectedAt: record.collectedAt,
      collectedAmount: record.collectedAmount,
      remittedAt: record.remittedAt,
      remittedBy: record.remittedBy,
      note: record.note,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toSettlementBatchEntity(
    record: PrismaCodSettlementBatch & { items: PrismaCodSettlementItem[] },
  ): CodSettlementBatch {
    return {
      id: record.id,
      settlementCode: record.settlementCode,
      reportDate: record.reportDate,
      hubCode: record.hubCode,
      courierId: record.courierId,
      totalAmount: record.totalAmount,
      status: record.status as CodSettlementBatch['status'],
      qrUrl: record.qrUrl,
      transferMemo: record.transferMemo,
      createdBy: record.createdBy,
      confirmedBy: record.confirmedBy,
      confirmedAt: record.confirmedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items.map((item) => ({
        id: item.id,
        batchId: item.batchId,
        codRecordId: item.codRecordId,
        shipmentCode: item.shipmentCode,
        amount: item.amount,
      })),
    };
  }

  private toSettlementPaymentEventEntity(
    record: PrismaCodSettlementPaymentEvent,
  ): CodSettlementPaymentEvent {
    return {
      id: record.id,
      provider: record.provider,
      providerEventId: record.providerEventId,
      settlementBatchId: record.settlementBatchId,
      settlementCode: record.settlementCode,
      amount: record.amount,
      accountNumber: record.accountNumber,
      transferType: record.transferType,
      referenceCode: record.referenceCode,
      transactionDate: record.transactionDate,
      processingStatus: record.processingStatus,
      ignoredReason: record.ignoredReason,
      rawPayload: record.rawPayload,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
