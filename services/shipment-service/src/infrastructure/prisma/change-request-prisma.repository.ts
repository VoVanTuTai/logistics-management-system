import { Injectable } from '@nestjs/common';
import type {
  ChangeRequest as PrismaChangeRequestRecord,
  Prisma,
} from '@prisma/client';

import type {
  ApproveChangeRequestInput,
  ChangeRequest,
  CreateChangeRequestInput,
} from '../../domain/entities/change-request.entity';
import type { JsonValue } from '../../domain/entities/shipment.entity';
import { ChangeRequestRepository } from '../../domain/repositories/change-request.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ChangeRequestPrismaRepository extends ChangeRequestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<ChangeRequest[]> {
    const records = await this.prisma.changeRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<ChangeRequest | null> {
    const record = await this.prisma.changeRequest.findUnique({
      where: { id },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateChangeRequestInput): Promise<ChangeRequest> {
    const data: Prisma.ChangeRequestCreateInput = {
      requestType: input.requestType,
      payload: input.payload as unknown as Prisma.InputJsonValue,
      requestedBy: input.requestedBy ?? null,
      shipment: {
        connect: {
          code: input.shipmentCode,
        },
      },
    };

    const record = await this.prisma.changeRequest.create({ data });

    return this.toEntity(record);
  }

  async approve(
    id: string,
    input: ApproveChangeRequestInput,
  ): Promise<ChangeRequest> {
    const record = await this.prisma.changeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: input.approvedBy ?? null,
        approvedAt: new Date(),
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaChangeRequestRecord): ChangeRequest {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      requestType: record.requestType,
      payload: record.payload as JsonValue,
      status: record.status as ChangeRequest['status'],
      requestedBy: record.requestedBy,
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
