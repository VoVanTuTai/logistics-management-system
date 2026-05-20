import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
  HandleSePaySettlementWebhookInput,
  RemitCodInput,
  SePaySettlementWebhookPayload,
  SePaySettlementWebhookResult,
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

  async handleSePaySettlementWebhook(
    input: HandleSePaySettlementWebhookInput,
  ): Promise<SePaySettlementWebhookResult> {
    this.verifySePayWebhook(input);

    const transaction = normalizeSePayPayload(input.payload);
    const eventRecord = await this.codRecordRepository.recordSettlementPaymentEvent({
      provider: 'SEPAY',
      providerEventId: transaction.providerEventId,
      settlementBatchId: null,
      settlementCode: null,
      amount: transaction.amount,
      accountNumber: transaction.accountNumber,
      transferType: transaction.transferType,
      referenceCode: transaction.referenceCode,
      transactionDate: transaction.transactionDate,
      processingStatus: 'RECEIVED',
      ignoredReason: null,
      rawPayload: input.payload,
    });

    if (!eventRecord.created) {
      return {
        success: true,
        provider: 'SEPAY',
        providerEventId: transaction.providerEventId,
        action: 'duplicate',
        settlementCode: eventRecord.event.settlementCode,
        settlementId: eventRecord.event.settlementBatchId,
        amount: eventRecord.event.amount,
        ignoredReason: eventRecord.event.ignoredReason ?? undefined,
      };
    }

    const ignoredResult = async (
      reason: string,
      settlement?: CodSettlementBatch | null,
    ): Promise<SePaySettlementWebhookResult> => {
      await this.codRecordRepository.updateSettlementPaymentEvent({
        id: eventRecord.event.id,
        settlementBatchId: settlement?.id ?? null,
        settlementCode: settlement?.settlementCode ?? transaction.settlementCode,
        processingStatus: 'IGNORED',
        ignoredReason: reason,
      });

      return {
        success: true,
        provider: 'SEPAY',
        providerEventId: transaction.providerEventId,
        action: 'ignored',
        settlementCode: settlement?.settlementCode ?? transaction.settlementCode,
        settlementId: settlement?.id ?? null,
        amount: transaction.amount,
        ignoredReason: reason,
      };
    };

    if (transaction.transferType !== 'in') {
      return ignoredResult('SePay transaction is not an inbound transfer.');
    }

    if (transaction.amount <= 0) {
      return ignoredResult('SePay transferAmount must be positive.');
    }

    if (!this.isCompanyBankAccount(transaction.accountNumber)) {
      return ignoredResult('SePay transaction accountNumber does not match company bank account.');
    }

    if (!transaction.settlementCode) {
      return ignoredResult('No COD settlementCode found in SePay transaction content.');
    }

    const settlement = await this.codRecordRepository.findSettlementBatchByCode(
      transaction.settlementCode,
    );

    if (!settlement) {
      return ignoredResult(
        `COD settlement batch "${transaction.settlementCode}" was not found.`,
      );
    }

    const amountTolerance = Number(process.env.SEPAY_AMOUNT_TOLERANCE_VND ?? '0');
    const amountDelta = Math.abs(normalizeMoney(settlement.totalAmount) - transaction.amount);

    if (amountDelta > amountTolerance) {
      return ignoredResult(
        `SePay transferAmount ${transaction.amount} does not match settlement totalAmount ${settlement.totalAmount}.`,
        settlement,
      );
    }

    if (settlement.status === 'PAID') {
      await this.codRecordRepository.updateSettlementPaymentEvent({
        id: eventRecord.event.id,
        settlementBatchId: settlement.id,
        settlementCode: settlement.settlementCode,
        processingStatus: 'DUPLICATE_PAID',
        ignoredReason: 'Settlement batch is already PAID.',
      });

      return {
        success: true,
        provider: 'SEPAY',
        providerEventId: transaction.providerEventId,
        action: 'duplicate',
        settlementCode: settlement.settlementCode,
        settlementId: settlement.id,
        amount: transaction.amount,
        ignoredReason: 'Settlement batch is already PAID.',
      };
    }

    if (settlement.status !== 'WAITING_PAYMENT') {
      return ignoredResult(
        `Cannot confirm settlement batch in status "${settlement.status}".`,
        settlement,
      );
    }

    const confirmed = await this.confirmCodSettlement(settlement.id, {
      confirmedBy: 'sepay:webhook',
      note: `SePay ${transaction.referenceCode ?? transaction.providerEventId}`,
    });

    await this.codRecordRepository.updateSettlementPaymentEvent({
      id: eventRecord.event.id,
      settlementBatchId: confirmed.id,
      settlementCode: confirmed.settlementCode,
      processingStatus: 'CONFIRMED',
      ignoredReason: null,
    });

    return {
      success: true,
      provider: 'SEPAY',
      providerEventId: transaction.providerEventId,
      action: 'confirmed',
      settlementCode: confirmed.settlementCode,
      settlementId: confirmed.id,
      amount: transaction.amount,
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

  private verifySePayWebhook(input: HandleSePaySettlementWebhookInput): void {
    const secret = process.env.SEPAY_WEBHOOK_SECRET?.trim();
    const apiKey = process.env.SEPAY_WEBHOOK_API_KEY?.trim();

    if (secret) {
      const signature = input.headers.signature?.trim();
      const timestamp = input.headers.timestamp?.trim();
      const rawBody = rawBodyToString(input.rawBody);

      if (!signature || !timestamp || !rawBody) {
        throw new UnauthorizedException('Missing SePay HMAC signature data.');
      }

      const timestampSeconds = Number(timestamp);
      const toleranceSeconds = Number(process.env.SEPAY_WEBHOOK_TOLERANCE_SECONDS ?? '300');

      if (
        !Number.isFinite(timestampSeconds) ||
        Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > toleranceSeconds
      ) {
        throw new UnauthorizedException('Expired SePay webhook timestamp.');
      }

      const expectedSignature = `sha256=${createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex')}`;

      if (!secureEquals(expectedSignature, signature)) {
        throw new UnauthorizedException('Invalid SePay webhook signature.');
      }

      return;
    }

    if (apiKey) {
      const expectedAuthorization = `Apikey ${apiKey}`;

      if (!secureEquals(expectedAuthorization, input.headers.authorization ?? '')) {
        throw new UnauthorizedException('Invalid SePay webhook API key.');
      }

      return;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException(
        'SEPAY_WEBHOOK_SECRET or SEPAY_WEBHOOK_API_KEY is required in production.',
      );
    }
  }

  private isCompanyBankAccount(accountNumber: string | null): boolean {
    if (!accountNumber) {
      return true;
    }

    const expectedAccount = normalizeBankAccount(
      process.env.SEPAY_BANK_ACCOUNT_NUMBER ??
        process.env.COMPANY_BANK_ACCOUNT_NUMBER ??
        '',
    );

    if (!expectedAccount) {
      return true;
    }

    return normalizeBankAccount(accountNumber) === expectedAccount;
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

interface NormalizedSePayTransaction {
  providerEventId: string;
  settlementCode: string | null;
  amount: number;
  accountNumber: string | null;
  transferType: string | null;
  referenceCode: string | null;
  transactionDate: Date | null;
}

function normalizeSePayPayload(
  payload: SePaySettlementWebhookPayload,
): NormalizedSePayTransaction {
  if (!payload || typeof payload !== 'object') {
    throw new BadRequestException('SePay webhook payload must be an object.');
  }

  const referenceCode = normalizeOptionalFilter(payload.referenceCode);
  const rawId = payload.id === null || payload.id === undefined
    ? null
    : String(payload.id).trim();
  const providerEventId = rawId || referenceCode;

  if (!providerEventId) {
    throw new BadRequestException('SePay webhook payload requires id or referenceCode.');
  }

  const amount = Number(payload.transferAmount);

  if (!Number.isFinite(amount)) {
    throw new BadRequestException('SePay transferAmount must be numeric.');
  }

  return {
    providerEventId,
    settlementCode: extractSettlementCode(payload),
    amount: normalizeMoney(amount),
    accountNumber: normalizeOptionalFilter(payload.accountNumber),
    transferType: normalizeOptionalFilter(payload.transferType)?.toLowerCase() ?? null,
    referenceCode,
    transactionDate: parseSePayTransactionDate(payload.transactionDate),
  };
}

function extractSettlementCode(payload: SePaySettlementWebhookPayload): string | null {
  const directCode = normalizeOptionalFilter(payload.code)?.toUpperCase();

  if (directCode?.startsWith('COD-')) {
    return directCode;
  }

  const haystack = [
    payload.code,
    payload.content,
    payload.description,
  ]
    .map((value) => normalizeOptionalFilter(value))
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toUpperCase();

  const match = /\bCOD-\d{8}-[A-Z0-9][A-Z0-9-]*-[A-Z0-9]{6}\b/.exec(haystack);

  return match?.[0] ?? null;
}

function parseSePayTransactionDate(value: string | null | undefined): Date | null {
  const normalized = normalizeOptionalFilter(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized.replace(' ', 'T'));

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeBankAccount(value: string): string {
  return value.replace(/\D+/g, '');
}

function rawBodyToString(rawBody: Buffer | string | null): string | null {
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString('utf8');
  }

  if (typeof rawBody === 'string') {
    return rawBody;
  }

  return null;
}

function secureEquals(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
