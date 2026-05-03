import { Injectable } from '@nestjs/common';
import type { CodRecord as PrismaCodRecord, Prisma } from '@prisma/client';

import type { CodRecord, CreateCodRecordInput } from '../../domain/entities/cod-record.entity';
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
}
