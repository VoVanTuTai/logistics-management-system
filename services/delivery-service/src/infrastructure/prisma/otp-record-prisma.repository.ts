import { Injectable } from '@nestjs/common';
import type { OtpRecord as PrismaOtpRecord, Prisma } from '@prisma/client';

import type {
  OtpRecord,
  SendOtpInput,
  VerifyOtpInput,
} from '../../domain/entities/otp-record.entity';
import { OtpRecordRepository } from '../../domain/repositories/otp-record.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class OtpRecordPrismaRepository extends OtpRecordRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createSent(input: SendOtpInput): Promise<OtpRecord> {
    const data: Prisma.OtpRecordCreateInput = {
      shipmentCode: input.shipmentCode,
      otpCode: input.otpCode ?? null,
      status: 'SENT',
      sentBy: input.sentBy ?? null,
      verifiedBy: null,
      sentAt: input.sentAt ? new Date(input.sentAt) : new Date(),
    };

    const record = await this.prisma.otpRecord.create({ data });

    return this.toEntity(record);
  }

  async verifyLatestForShipment(input: VerifyOtpInput): Promise<OtpRecord> {
    const latestRecord = await this.prisma.otpRecord.findFirst({
      where: {
        shipmentCode: input.shipmentCode,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const verifiedAt = input.verifiedAt ? new Date(input.verifiedAt) : new Date();

    if (latestRecord) {
      const record = await this.prisma.otpRecord.update({
        where: { id: latestRecord.id },
        data: {
          otpCode: input.otpCode ?? latestRecord.otpCode,
          status: 'VERIFIED',
          verifiedBy: input.verifiedBy ?? null,
          verifiedAt,
          sentAt: latestRecord.sentAt ?? verifiedAt,
        },
      });

      return this.toEntity(record);
    }

    const data: Prisma.OtpRecordCreateInput = {
      shipmentCode: input.shipmentCode,
      otpCode: input.otpCode ?? null,
      status: 'VERIFIED',
      verifiedBy: input.verifiedBy ?? null,
      verifiedAt,
      sentAt: null,
      sentBy: null,
    };

    const record = await this.prisma.otpRecord.create({ data });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaOtpRecord): OtpRecord {
    return {
      id: record.id,
      shipmentCode: record.shipmentCode,
      otpCode: record.otpCode,
      status: record.status,
      sentBy: record.sentBy,
      verifiedBy: record.verifiedBy,
      sentAt: record.sentAt,
      verifiedAt: record.verifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
