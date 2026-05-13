import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CodRecord,
  CodSummary,
  CollectCodInput,
  CompanyBankInfo,
  CreateCodRecordInput,
  RemitCodInput,
} from '../../domain/entities/cod-record.entity';
import { CodRecordRepository } from '../../domain/repositories/cod-record.repository';
import { CodOutboxService } from '../../messaging/outbox/cod-outbox.service';

@Injectable()
export class CodService {
  constructor(
    @Inject(CodRecordRepository)
    private readonly codRecordRepository: CodRecordRepository,
    private readonly codOutboxService: CodOutboxService,
  ) {}

  async createCodRecord(input: CreateCodRecordInput): Promise<CodRecord> {
    const existing = await this.codRecordRepository.findByShipmentCode(
      input.shipmentCode,
    );

    if (existing) {
      return existing;
    }

    return this.codRecordRepository.create(input);
  }

  async collectCod(input: CollectCodInput): Promise<CodRecord> {
    if (!input.shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    if (!input.idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required.');
    }

    if (input.collectedAmount <= 0) {
      throw new BadRequestException('collectedAmount must be positive.');
    }

    const codRecord = await this.codRecordRepository.findByShipmentCode(
      input.shipmentCode,
    );

    if (!codRecord) {
      throw new NotFoundException(
        `COD record not found for shipment "${input.shipmentCode}".`,
      );
    }

    if (codRecord.status === 'COLLECTED' || codRecord.status === 'REMITTED') {
      return codRecord;
    }

    if (codRecord.status === 'FAILED') {
      throw new BadRequestException(
        `COD record for shipment "${input.shipmentCode}" is in FAILED state.`,
      );
    }

    const collectedAt = input.occurredAt
      ? new Date(input.occurredAt)
      : new Date();

    const updated = await this.codRecordRepository.markCollected(
      codRecord.id,
      input.collectedAmount,
      input.courierId,
      input.paymentMethod,
      collectedAt,
      input.note ?? null,
    );

    await this.codOutboxService.enqueueCodCollected(updated);

    return updated;
  }

  async remitCod(input: RemitCodInput): Promise<CodRecord> {
    if (!input.shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    if (!input.idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required.');
    }

    const codRecord = await this.codRecordRepository.findByShipmentCode(
      input.shipmentCode,
    );

    if (!codRecord) {
      throw new NotFoundException(
        `COD record not found for shipment "${input.shipmentCode}".`,
      );
    }

    if (codRecord.status === 'REMITTED') {
      return codRecord;
    }

    if (codRecord.status !== 'COLLECTED') {
      throw new BadRequestException(
        `Cannot remit COD for shipment "${input.shipmentCode}" in status "${codRecord.status}".`,
      );
    }

    const updated = await this.codRecordRepository.markRemitted(
      codRecord.id,
      input.remittedBy,
      new Date(),
      input.note ?? null,
    );

    await this.codOutboxService.enqueueCodRemitted(updated);

    return updated;
  }

  async markCollectionFailed(shipmentCode: string): Promise<CodRecord> {
    const codRecord = await this.codRecordRepository.findByShipmentCode(
      shipmentCode,
    );

    if (!codRecord) {
      throw new NotFoundException(
        `COD record not found for shipment "${shipmentCode}".`,
      );
    }

    if (codRecord.status !== 'PENDING') {
      return codRecord;
    }

    const updated = await this.codRecordRepository.markFailed(codRecord.id);

    await this.codOutboxService.enqueueCodCollectionFailed(updated);

    return updated;
  }

  async getCodByShipment(shipmentCode: string): Promise<CodRecord | null> {
    return this.codRecordRepository.findByShipmentCode(shipmentCode);
  }

  async listCodByCourier(
    courierId: string,
    status?: string,
  ): Promise<CodRecord[]> {
    return this.codRecordRepository.listByCourierId(courierId, status);
  }

  async getCodSummary(courierId: string): Promise<CodSummary> {
    const summary = await this.codRecordRepository.getCodSummaryByCourier(
      courierId,
    );

    return {
      totalPending: summary.pendingCount,
      totalCollected: summary.collectedCount,
      totalRemitted: summary.remittedCount,
      totalFailed: summary.failedCount,
      pendingAmount: summary.pendingAmount,
      collectedAmount: summary.collectedAmount,
      remittedAmount: summary.remittedAmount,
    };
  }

  getCompanyBankInfo(): CompanyBankInfo {
    return {
      bankName: process.env.COMPANY_BANK_NAME ?? 'Vietcombank',
      accountNumber: process.env.COMPANY_BANK_ACCOUNT_NUMBER ?? '1234567890',
      accountName:
        process.env.COMPANY_BANK_ACCOUNT_NAME ?? 'CONG TY TNHH NEXUS EXPRESS',
      bin: process.env.COMPANY_BANK_BIN ?? '970436',
    };
  }

  buildVietQrUrl(amount: number, memo: string): string {
    const bankInfo = this.getCompanyBankInfo();
    // VietQR format: https://img.vietqr.io/image/<BIN>-<ACCOUNT>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<MEMO>&accountName=<NAME>
    const encodedMemo = encodeURIComponent(memo);
    const encodedName = encodeURIComponent(bankInfo.accountName);
    return `https://img.vietqr.io/image/${bankInfo.bin}-${bankInfo.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodedMemo}&accountName=${encodedName}`;
  }
}
