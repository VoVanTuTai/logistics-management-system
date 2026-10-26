import { Injectable } from '@nestjs/common';
import type { NdrCase as PrismaNdrCaseRecord, Prisma } from '@prisma/client';

import {
  NDR_CASE_STATUSES,
  type CreateNdrCaseInput,
  type ListNdrCasesFilter,
  type NdrCase,
  type NdrCaseStatus,
  type RescheduleNdrCaseInput,
} from '../../domain/entities/ndr-case.entity';
import { NdrCaseRepository } from '../../domain/repositories/ndr-case.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class NdrCasePrismaRepository extends NdrCaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filter?: ListNdrCasesFilter): Promise<NdrCase[]> {
    const records = await this.prisma.ndrCase.findMany({
      where: {
        shipmentCode: filter?.shipmentCode ?? undefined,
        status: filter?.status ?? undefined,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<NdrCase | null> {
    const record = await this.prisma.ndrCase.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  private async generateNdrCode(): Promise<string> {
    const now = new Date();
    const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const yyyy = utc7.getUTCFullYear();
    const mm = String(utc7.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(utc7.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const prefix = `NDR-${dateStr}-`;

    const count = await this.prisma.ndrCase.count({
      where: {
        id: {
          startsWith: prefix,
        },
      },
    });

    const nextSeq = String(count + 1).padStart(4, '0');
    let candidate = `${prefix}${nextSeq}`;

    const existing = await this.prisma.ndrCase.findUnique({
      where: { id: candidate },
    });

    if (existing) {
      const fallbackSeq = String(Math.floor(1000 + Math.random() * 9000));
      candidate = `${prefix}${fallbackSeq}`;
    }

    return candidate;
  }

  async create(input: CreateNdrCaseInput): Promise<NdrCase> {
    const id = input.id?.trim() || (await this.generateNdrCode());
    const data: Prisma.NdrCaseCreateInput = {
      id,
      shipmentCode: input.shipmentCode,
      reasonCode: input.reasonCode ?? null,
      issueType: input.issueType ?? null,
      issueCategory: input.issueCategory ?? null,
      attachments:
        input.attachments === undefined
          ? undefined
          : (input.attachments as Prisma.InputJsonValue),
      reportedBy: input.reportedBy ?? null,
      reportedHubCode: input.reportedHubCode ?? null,
      note: input.note ?? null,
      status: input.status ?? 'CREATED',
      deliveryAttempt: input.deliveryAttemptId
        ? {
            connect: {
              id: input.deliveryAttemptId,
            },
          }
        : undefined,
    };

    const record = await this.prisma.ndrCase.create({ data });

    return this.toEntity(record);
  }

  async reschedule(
    id: string,
    input: RescheduleNdrCaseInput,
  ): Promise<NdrCase> {
    const rescheduleAt = input.rescheduleAt ?? input.nextDeliveryAt ?? null;
    const record = await this.prisma.ndrCase.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        note: input.note !== undefined ? input.note : undefined,
        rescheduleAt: rescheduleAt ? new Date(rescheduleAt) : null,
      },
    });

    return this.toEntity(record);
  }

  async markReturnRequested(
    id: string,
    input: { note?: string | null },
  ): Promise<NdrCase> {
    const record = await this.prisma.ndrCase.update({
      where: { id },
      data: {
        status: 'RETURN_REQUESTED',
        note: input.note !== undefined ? input.note : undefined,
      },
    });

    return this.toEntity(record);
  }

  isValidStatus(value: string): value is NdrCaseStatus {
    return (NDR_CASE_STATUSES as readonly string[]).includes(value);
  }

  private toEntity(record: PrismaNdrCaseRecord): NdrCase {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      deliveryAttemptId: record.deliveryAttemptId,
      reasonCode: record.reasonCode,
      issueType: record.issueType,
      issueCategory: record.issueCategory,
      attachments: record.attachments,
      reportedBy: record.reportedBy,
      reportedHubCode: record.reportedHubCode,
      note: record.note,
      status: record.status,
      rescheduleAt: record.rescheduleAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
