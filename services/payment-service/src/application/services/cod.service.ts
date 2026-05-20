import { randomUUID } from 'crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CodCollectionStatus,
  CodDailySettlementQuery,
  CodDailySettlementSummary,
  CodRecord,
  CodSettlementBatch,
  CodSummary,
  CollectCodInput,
  CompanyBankInfo,
  ConfirmCodSettlementInput,
  CreateCodSettlementInput,
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

  async getDailySettlement(
    query: CodDailySettlementQuery,
  ): Promise<CodDailySettlementSummary> {
    const reportDate = resolveReportDate(query.date);
    const courierId = normalizeOptionalFilter(query.courierId);
    const status = normalizeCodStatus(query.status);
    const hubCodeFilter = normalizeOptionalFilter(query.hubCode);
    const hubCode = hubCodeFilter ?? 'UNKNOWN';
    const records = await this.codRecordRepository.listForDailySettlement({
      dateFrom: reportDate.dateFrom,
      dateTo: reportDate.dateTo,
      courierId,
      status,
    });
    const batches = await this.codRecordRepository.listSettlementBatches({
      dateFrom: reportDate.dateFrom,
      dateTo: reportDate.dateTo,
      hubCode: hubCodeFilter?.toUpperCase() ?? null,
      courierId,
    });

    let codTotal = 0;
    let collectedTotal = 0;
    let remittedTotal = 0;
    let pendingRemitTotal = 0;

    for (const record of records) {
      const codAmount = normalizeMoney(record.codAmount);
      const collectedAmount = normalizeMoney(record.collectedAmount ?? record.codAmount);

      codTotal += codAmount;

      if (record.status === 'COLLECTED' || record.status === 'REMITTED') {
        collectedTotal += collectedAmount;
      }

      if (record.status === 'REMITTED') {
        remittedTotal += collectedAmount;
      }

      if (record.status === 'COLLECTED') {
        pendingRemitTotal += collectedAmount;
      }
    }

    return {
      reportDate: reportDate.key,
      hubCode,
      courierId: courierId ?? 'ALL',
      codOrders: records.length,
      codTotal,
      collectedTotal,
      remittedTotal,
      pendingRemitTotal,
      records: records.map((record) => ({
        shipmentCode: record.shipmentCode,
        codAmount: normalizeMoney(record.codAmount),
        collectedAmount: record.collectedAmount === null
          ? null
          : normalizeMoney(record.collectedAmount),
        status: record.status,
        courierId: record.courierId,
        collectedAt: record.collectedAt?.toISOString() ?? null,
        remittedAt: record.remittedAt?.toISOString() ?? null,
      })),
      batches,
    };
  }

  async createCodSettlement(
    input: CreateCodSettlementInput,
  ): Promise<CodSettlementBatch> {
    const reportDate = resolveReportDate(input.reportDate);
    const hubCode = normalizeRequiredCode(input.hubCode, 'hubCode');
    const courierId = normalizeRequiredText(input.courierId, 'courierId');
    const shipmentCodes = normalizeShipmentCodes(input.shipmentCodes);

    if (shipmentCodes.length === 0) {
      throw new BadRequestException('shipmentCodes must contain at least one shipment code.');
    }

    const records = await this.codRecordRepository.listByShipmentCodes(shipmentCodes);
    const recordByShipmentCode = new Map(
      records.map((record) => [record.shipmentCode.toUpperCase(), record] as const),
    );
    const missingShipmentCodes = shipmentCodes.filter(
      (shipmentCode) => !recordByShipmentCode.has(shipmentCode),
    );

    if (missingShipmentCodes.length > 0) {
      throw new BadRequestException(
        `COD records not found for shipments: ${missingShipmentCodes.join(', ')}.`,
      );
    }

    const invalidStatusRecords = records.filter((record) => record.status !== 'COLLECTED');

    if (invalidStatusRecords.length > 0) {
      const details = invalidStatusRecords
        .map((record) => `${record.shipmentCode}:${record.status}`)
        .join(', ');

      throw new BadRequestException(
        `Only COLLECTED COD records can be settled. Invalid records: ${details}.`,
      );
    }

    const courierMismatchRecords = records.filter(
      (record) => record.courierId !== courierId,
    );

    if (courierMismatchRecords.length > 0) {
      const details = courierMismatchRecords
        .map((record) => `${record.shipmentCode}:${record.courierId ?? 'UNKNOWN'}`)
        .join(', ');

      throw new BadRequestException(
        `All COD records must belong to courier "${courierId}". Mismatched records: ${details}.`,
      );
    }

    const items = records.map((record) => ({
      codRecordId: record.id,
      shipmentCode: record.shipmentCode,
      amount: normalizeMoney(record.collectedAmount ?? record.codAmount),
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    if (totalAmount <= 0) {
      throw new BadRequestException('Settlement totalAmount must be positive.');
    }

    const settlementCode = buildSettlementCode(reportDate.key, hubCode, courierId);
    const transferMemo = `COD ${settlementCode}`;
    const qrUrl = this.buildVietQrUrl(totalAmount, transferMemo);

    return this.codRecordRepository.createSettlementBatch({
      settlementCode,
      reportDate: reportDate.dateFrom,
      hubCode,
      courierId,
      totalAmount,
      qrUrl,
      transferMemo,
      createdBy: normalizeOptionalFilter(input.createdBy),
      items,
    });
  }

  async confirmCodSettlement(
    id: string,
    input: ConfirmCodSettlementInput,
  ): Promise<CodSettlementBatch> {
    const settlementId = normalizeRequiredText(id, 'settlementId');
    const confirmedBy = normalizeRequiredText(input.confirmedBy, 'confirmedBy');
    const current = await this.codRecordRepository.findSettlementBatchById(
      settlementId,
    );

    if (!current) {
      throw new NotFoundException(
        `COD settlement batch "${settlementId}" was not found.`,
      );
    }

    if (current.status === 'PAID') {
      return current;
    }

    if (current.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot confirm cancelled COD settlement batch "${current.settlementCode}".`,
      );
    }

    if (current.totalAmount <= 0) {
      throw new BadRequestException(
        `Cannot confirm COD settlement batch "${current.settlementCode}" with non-positive totalAmount.`,
      );
    }

    const currentRecords = await this.codRecordRepository.listByShipmentCodes(
      current.items.map((item) => item.shipmentCode),
    );
    const invalidRecords = currentRecords.filter(
      (record) => record.status !== 'COLLECTED' && record.status !== 'REMITTED',
    );

    if (invalidRecords.length > 0) {
      const details = invalidRecords
        .map((record) => `${record.shipmentCode}:${record.status}`)
        .join(', ');

      throw new BadRequestException(
        `Cannot confirm COD settlement batch "${current.settlementCode}" with invalid COD records: ${details}.`,
      );
    }

    const collectedShipmentCodes = new Set(
      currentRecords
        .filter((record) => record.status === 'COLLECTED')
        .map((record) => record.shipmentCode),
    );

    const confirmed = await this.codRecordRepository.confirmSettlementBatch({
      id: settlementId,
      confirmedBy,
      confirmedAt: new Date(),
      note: normalizeOptionalNote(input.note),
    });

    if (!confirmed) {
      throw new NotFoundException(
        `COD settlement batch "${settlementId}" was not found.`,
      );
    }

    if (confirmed.status !== 'PAID') {
      throw new BadRequestException(
        `Cannot confirm COD settlement batch "${confirmed.settlementCode}" in status "${confirmed.status}".`,
      );
    }

    const remittedRecords = await this.codRecordRepository.listByShipmentCodes(
      confirmed.items.map((item) => item.shipmentCode),
    );
    await Promise.all(
      remittedRecords
        .filter(
          (record) =>
            record.status === 'REMITTED' &&
            collectedShipmentCodes.has(record.shipmentCode),
        )
        .map((record) => this.codOutboxService.enqueueCodRemitted(record)),
    );

    return confirmed;
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

const COD_STATUSES: CodCollectionStatus[] = [
  'PENDING',
  'COLLECTED',
  'REMITTED',
  'FAILED',
];

function normalizeOptionalFilter(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  if (!normalized || normalized.toUpperCase() === 'ALL') {
    return null;
  }

  return normalized;
}

function normalizeOptionalNote(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized && normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: string | null | undefined, fieldName: string): string {
  const normalized = normalizeOptionalFilter(value);

  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return normalized;
}

function normalizeRequiredCode(value: string | null | undefined, fieldName: string): string {
  return normalizeRequiredText(value, fieldName).toUpperCase();
}

function normalizeShipmentCodes(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((shipmentCode) => shipmentCode.trim().toUpperCase())
        .filter((shipmentCode) => shipmentCode.length > 0),
    ),
  );
}

function normalizeCodStatus(
  value: string | null | undefined,
): CodCollectionStatus | null {
  const normalized = normalizeOptionalFilter(value)?.toUpperCase();

  if (!normalized) {
    return null;
  }

  if (!COD_STATUSES.includes(normalized as CodCollectionStatus)) {
    throw new BadRequestException(`Unsupported COD status "${value}".`);
  }

  return normalized as CodCollectionStatus;
}

function resolveReportDate(value: string | null | undefined): {
  key: string;
  dateFrom: Date;
  dateTo: Date;
} {
  const rawValue = value?.trim();
  const date = rawValue ? parseDateInput(rawValue) : new Date();

  if (!date) {
    throw new BadRequestException('date must be a valid YYYY-MM-DD value.');
  }

  const dateFrom = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
  const dateTo = new Date(dateFrom);
  dateTo.setDate(dateTo.getDate() + 1);

  return {
    key: toDateInputValue(dateFrom),
    dateFrom,
    dateTo,
  };
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildSettlementCode(reportDate: string, hubCode: string, courierId: string): string {
  const dateSegment = reportDate.replace(/-/g, '');
  const hubSegment = sanitizeSettlementSegment(hubCode);
  const courierSegment = sanitizeSettlementSegment(courierId);
  const randomSegment = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();

  return `COD-${dateSegment}-${hubSegment}-${courierSegment}-${randomSegment}`;
}

function sanitizeSettlementSegment(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'UNKNOWN';
}

function normalizeMoney(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
