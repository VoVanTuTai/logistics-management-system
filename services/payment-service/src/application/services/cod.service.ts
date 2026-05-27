import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
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
  CodSettlementQr,
  CollectCodInput,
  CompanyBankInfo,
  ConfirmCodSettlementInput,
  CreateCodSettlementInput,
  CreateCodRecordInput,
  HandleSePaySettlementWebhookInput,
  RemitCodInput,
  ReconcileSePayTransactionsInput,
  ReconcileSePayTransactionsResult,
  SePaySettlementWebhookPayload,
  SePaySettlementWebhookResult,
  CodSettlementPaymentEvent,
  CodSettlementPaymentEventQuery,
  SyncShipmentCodRecordInput,
  SyncShipmentCodRecordResult,
} from '../../domain/entities/cod-record.entity';
import { CodRecordRepository } from '../../domain/repositories/cod-record.repository';
import { CodOutboxService } from '../../messaging/outbox/cod-outbox.service';

@Injectable()
export class CodService {
  private readonly logger = new Logger(CodService.name);

  constructor(
    @Inject(CodRecordRepository)
    private readonly codRecordRepository: CodRecordRepository,
    private readonly codOutboxService: CodOutboxService,
  ) {}

  async createCodRecord(input: CreateCodRecordInput): Promise<CodRecord> {
    if (!input.shipmentCode?.trim()) {
      throw new BadRequestException('shipmentCode is required.');
    }

    if (!Number.isFinite(input.codAmount) || input.codAmount <= 0) {
      throw new BadRequestException('codAmount must be positive.');
    }

    const existing = await this.codRecordRepository.findByShipmentCode(
      input.shipmentCode.trim().toUpperCase(),
    );

    if (existing) {
      return existing;
    }

    return this.codRecordRepository.create({
      ...input,
      shipmentCode: input.shipmentCode.trim().toUpperCase(),
    });
  }

  async syncShipmentCodRecord(
    input: SyncShipmentCodRecordInput,
  ): Promise<SyncShipmentCodRecordResult> {
    const shipmentCode = normalizeOptionalFilter(input.shipmentCode ?? input.code)?.toUpperCase();

    if (!shipmentCode) {
      return {
        synced: false,
        reason: 'MISSING_SHIPMENT_CODE',
        record: null,
      };
    }

    const metadata = input.metadata ?? null;
    const codAmount = normalizeMoney(
      readNumber(input.codAmount) ??
        readNumber(metadata?.codAmount) ??
        readNumber(readObject(metadata?.payment)?.codAmount) ??
        readNumber(readObject(metadata?.cod)?.amount) ??
        0,
    );

    if (codAmount <= 0) {
      return {
        synced: false,
        reason: 'NO_COD',
        record: null,
      };
    }

    const merchantId =
      normalizeOptionalFilter(input.merchantId) ??
      normalizeOptionalFilter(readString(metadata?.merchantId)) ??
      normalizeOptionalFilter(readString(metadata?.merchantCode)) ??
      normalizeOptionalFilter(readString(metadata?.merchantUsername)) ??
      normalizeOptionalFilter(readString(readObject(metadata?.createdBy)?.username)) ??
      normalizeOptionalFilter(readString(metadata?.createdByUsername));
    const currency =
      normalizeOptionalFilter(input.currency) ??
      normalizeOptionalFilter(readString(metadata?.currency)) ??
      'VND';
    const hubCode = resolveShipmentHubCode(input, metadata);
    const record = await this.createCodRecord({
      shipmentCode,
      merchantId,
      codAmount,
      currency,
      paymentMethod: 'COD',
      hubCode,
    });

    return {
      synced: true,
      reason: 'COD_RECORD_READY',
      record,
    };
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

    if (input.paymentMethod === 'BANK_TRANSFER') {
      throw new BadRequestException(
        'BANK_TRANSFER COD must be confirmed by bank webhook, not /cod/collect.',
      );
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
    const hubCode = hubCodeFilter?.toUpperCase() ?? 'ALL';
    const records = await this.codRecordRepository.listForDailySettlement({
      dateFrom: reportDate.dateFrom,
      dateTo: reportDate.dateTo,
      hubCode: hubCodeFilter?.toUpperCase() ?? null,
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
    let cashCollectedTotal = 0;
    let bankTransferTotal = 0;
    let companyReceivedTotal = 0;
    let remittedTotal = 0;
    let pendingRemitTotal = 0;
    let pendingCashRemitTotal = 0;
    let waitingBankConfirmTotal = 0;

    for (const record of records) {
      const codAmount = normalizeMoney(record.codAmount);
      const collectedAmount = normalizeMoney(record.collectedAmount ?? record.codAmount);

      codTotal += codAmount;

      if (record.status === 'COLLECTED' || record.status === 'REMITTED') {
        collectedTotal += collectedAmount;

        if (record.paymentMethod === 'COD') {
          cashCollectedTotal += collectedAmount;
        }

        if (record.paymentMethod === 'BANK_TRANSFER') {
          bankTransferTotal += collectedAmount;
        }
      }

      if (record.status === 'REMITTED') {
        companyReceivedTotal += collectedAmount;
        remittedTotal += collectedAmount;
      }

      if (record.status === 'COLLECTED' && record.paymentMethod === 'COD') {
        pendingCashRemitTotal += collectedAmount;
        pendingRemitTotal += collectedAmount;
      }

      if (record.status === 'COLLECTED' && record.paymentMethod === 'BANK_TRANSFER') {
        waitingBankConfirmTotal += collectedAmount;
      }
    }

    return {
      reportDate: reportDate.key,
      hubCode,
      courierId: courierId ?? 'ALL',
      codOrders: records.length,
      codTotal,
      collectedTotal,
      cashCollectedTotal,
      bankTransferTotal,
      companyReceivedTotal,
      remittedTotal,
      pendingRemitTotal,
      pendingCashRemitTotal,
      waitingBankConfirmTotal,
      records: records.map((record) => ({
        shipmentCode: record.shipmentCode,
        codAmount: normalizeMoney(record.codAmount),
        collectedAmount: record.collectedAmount === null
          ? null
          : normalizeMoney(record.collectedAmount),
        paymentMethod: record.paymentMethod,
        status: record.status,
        hubCode: record.hubCode,
        courierId: record.courierId,
        collectedAt: record.collectedAt?.toISOString() ?? null,
        remittedAt: record.remittedAt?.toISOString() ?? null,
        companyReceivedAt: record.remittedAt?.toISOString() ?? null,
        companyReceivedRef: record.remittedBy,
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

    const invalidPaymentMethodRecords = records.filter(
      (record) => record.paymentMethod !== 'COD',
    );

    if (invalidPaymentMethodRecords.length > 0) {
      const details = invalidPaymentMethodRecords
        .map((record) => `${record.shipmentCode}:${record.paymentMethod}`)
        .join(', ');

      throw new BadRequestException(
        `Only cash COD records can be settled. Invalid records: ${details}.`,
      );
    }

    const hubMismatchRecords = records.filter(
      (record) => record.hubCode !== null && record.hubCode !== hubCode,
    );

    if (hubMismatchRecords.length > 0) {
      const details = hubMismatchRecords
        .map((record) => `${record.shipmentCode}:${record.hubCode ?? 'UNKNOWN'}`)
        .join(', ');

      throw new BadRequestException(
        `All COD records must belong to hub "${hubCode}". Mismatched records: ${details}.`,
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

  async getCodSettlementQr(id: string): Promise<CodSettlementQr> {
    const settlementId = normalizeRequiredText(id, 'settlementId');
    const batch = await this.codRecordRepository.findSettlementBatchById(
      settlementId,
    );

    if (!batch) {
      throw new NotFoundException(
        `COD settlement batch "${settlementId}" was not found.`,
      );
    }

    const qrUrl = batch.qrUrl ?? this.buildVietQrUrl(batch.totalAmount, batch.transferMemo);

    return {
      settlementId: batch.id,
      settlementCode: batch.settlementCode,
      reportDate: toDateInputValue(batch.reportDate),
      hubCode: batch.hubCode,
      courierId: batch.courierId,
      totalAmount: batch.totalAmount,
      status: batch.status,
      qrUrl,
      transferMemo: batch.transferMemo,
    };
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

    const invalidPaymentMethodRecords = currentRecords.filter(
      (record) => record.paymentMethod !== 'COD',
    );

    if (invalidPaymentMethodRecords.length > 0) {
      const details = invalidPaymentMethodRecords
        .map((record) => `${record.shipmentCode}:${record.paymentMethod}`)
        .join(', ');

      throw new BadRequestException(
        `Cannot confirm COD settlement batch "${current.settlementCode}" with non-cash COD records: ${details}.`,
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

  async listSePayWebhookEvents(
    query: CodSettlementPaymentEventQuery,
  ): Promise<CodSettlementPaymentEvent[]> {
    return this.codRecordRepository.listSettlementPaymentEvents({
      provider: normalizeOptionalFilter(query.provider)?.toUpperCase() ?? 'SEPAY',
      providerEventId: normalizeOptionalFilter(query.providerEventId),
      referenceType: normalizeOptionalFilter(query.referenceType)?.toUpperCase() ?? null,
      processingStatus: normalizeOptionalFilter(query.processingStatus)?.toUpperCase() ?? null,
      settlementCode: normalizeOptionalFilter(query.settlementCode)?.toUpperCase() ?? null,
      shipmentCode: normalizeOptionalFilter(query.shipmentCode)?.toUpperCase() ?? null,
      codRecordId: normalizeOptionalFilter(query.codRecordId),
      dateFrom: parseOptionalDateTime(query.dateFrom, 'dateFrom'),
      dateTo: parseOptionalDateTime(query.dateTo, 'dateTo'),
      limit: normalizeListLimit(query.limit),
    });
  }

  async reconcileSePayTransactions(
    input: ReconcileSePayTransactionsInput,
  ): Promise<ReconcileSePayTransactionsResult> {
    const apiToken = process.env.SEPAY_API_TOKEN?.trim();

    if (!apiToken) {
      throw new BadRequestException('SEPAY_API_TOKEN is required to reconcile SePay transactions.');
    }

    const transactions = await this.fetchSePayTransactions(input, apiToken);
    const results: SePaySettlementWebhookResult[] = [];
    const errors: ReconcileSePayTransactionsResult['errors'] = [];

    for (const item of transactions) {
      const payload = mapSePayApiTransactionToWebhookPayload(item);
      const providerEventId = payload.id === null || payload.id === undefined
        ? payload.referenceCode ?? null
        : String(payload.id);

      try {
        results.push(await this.processSePaySettlementWebhookPayload(payload));
      } catch (error) {
        errors.push({
          providerEventId,
          message: error instanceof Error ? error.message : 'Unable to process SePay transaction.',
        });
      }
    }

    return {
      success: true,
      provider: 'SEPAY',
      fetched: transactions.length,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async handleSePaySettlementWebhook(
    input: HandleSePaySettlementWebhookInput,
  ): Promise<SePaySettlementWebhookResult> {
    this.verifySePayWebhook(input);

    return this.processSePaySettlementWebhookPayload(input.payload);
  }

  private async processSePaySettlementWebhookPayload(
    payload: SePaySettlementWebhookPayload,
  ): Promise<SePaySettlementWebhookResult> {
    const transaction = normalizeSePayPayload(payload);
    const eventRecord = await this.codRecordRepository.recordSettlementPaymentEvent({
      provider: 'SEPAY',
      providerEventId: transaction.providerEventId,
      referenceType: transaction.referenceType,
      settlementBatchId: null,
      settlementCode: transaction.settlementCode,
      shipmentCode: transaction.shipmentCode,
      codRecordId: null,
      amount: transaction.amount,
      accountNumber: transaction.accountNumber,
      transferType: transaction.transferType,
      referenceCode: transaction.referenceCode,
      transactionDate: transaction.transactionDate,
      processingStatus: 'RECEIVED',
      ignoredReason: null,
      rawPayload: payload,
    });

    if (!eventRecord.created) {
      return {
        success: true,
        provider: 'SEPAY',
        providerEventId: transaction.providerEventId,
        action: 'duplicate',
        referenceType: toWebhookReferenceType(eventRecord.event.referenceType),
        settlementCode: eventRecord.event.settlementCode,
        settlementId: eventRecord.event.settlementBatchId,
        shipmentCode: eventRecord.event.shipmentCode,
        codRecordId: eventRecord.event.codRecordId,
        amount: eventRecord.event.amount,
        ignoredReason: eventRecord.event.ignoredReason ?? undefined,
      };
    }

    const ignoredResult = async (
      reason: string,
      context?: {
        referenceType?: 'SETTLEMENT' | 'SHIPMENT' | null;
        settlement?: CodSettlementBatch | null;
        settlementCode?: string | null;
        shipmentCode?: string | null;
        codRecordId?: string | null;
        processingStatus?: string;
      },
    ): Promise<SePaySettlementWebhookResult> => {
      const referenceType = context?.referenceType ?? transaction.referenceType;
      const settlement = context?.settlement ?? null;
      const settlementCode =
        context?.settlementCode ?? settlement?.settlementCode ?? transaction.settlementCode;
      const shipmentCode = context?.shipmentCode ?? transaction.shipmentCode;
      const codRecordId = context?.codRecordId ?? null;
      const processingStatus = context?.processingStatus ?? 'IGNORED';

      if (processingStatus === 'AMOUNT_MISMATCH' || processingStatus === 'UNKNOWN_REFERENCE') {
        this.logger.warn(
          `SePay COD webhook ${processingStatus}: ${reason}; event=${transaction.providerEventId}; settlement=${settlementCode ?? '-'}; shipment=${shipmentCode ?? '-'}; amount=${transaction.amount}`,
        );
      }

      await this.codRecordRepository.updateSettlementPaymentEvent({
        id: eventRecord.event.id,
        referenceType,
        settlementBatchId: settlement?.id ?? null,
        settlementCode,
        shipmentCode,
        codRecordId,
        processingStatus,
        ignoredReason: reason,
      });

      return {
        success: true,
        provider: 'SEPAY',
        providerEventId: transaction.providerEventId,
        action: 'ignored',
        referenceType,
        settlementCode,
        settlementId: settlement?.id ?? null,
        shipmentCode,
        codRecordId,
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

    if (!transaction.referenceType) {
      return ignoredResult('UNKNOWN_REFERENCE', {
        referenceType: null,
        processingStatus: 'UNKNOWN_REFERENCE',
      });
    }

    if (transaction.referenceType === 'SHIPMENT') {
      const shipmentCode = transaction.shipmentCode;

      if (!shipmentCode) {
        return ignoredResult('UNKNOWN_REFERENCE', {
          referenceType: 'SHIPMENT',
          processingStatus: 'UNKNOWN_REFERENCE',
        });
      }

      const codRecord = await this.codRecordRepository.findByShipmentCode(shipmentCode);

      if (!codRecord) {
        return ignoredResult(`COD record "${shipmentCode}" was not found.`, {
          referenceType: 'SHIPMENT',
          shipmentCode,
          processingStatus: 'UNKNOWN_REFERENCE',
        });
      }

      const shipmentContext = {
        referenceType: 'SHIPMENT' as const,
        shipmentCode: codRecord.shipmentCode,
        codRecordId: codRecord.id,
      };
      const amountTolerance = Number(process.env.SEPAY_AMOUNT_TOLERANCE_VND ?? '0');
      const amountDelta = Math.abs(normalizeMoney(codRecord.codAmount) - transaction.amount);

      if (amountDelta > amountTolerance) {
        return ignoredResult(
          `SePay transferAmount ${transaction.amount} does not match COD amount ${codRecord.codAmount}.`,
          {
            ...shipmentContext,
            processingStatus: 'AMOUNT_MISMATCH',
          },
        );
      }

      if (codRecord.status === 'FAILED') {
        return ignoredResult(
          `COD record "${codRecord.shipmentCode}" is in FAILED state.`,
          shipmentContext,
        );
      }

      if (codRecord.status === 'REMITTED') {
        await this.codRecordRepository.updateSettlementPaymentEvent({
          id: eventRecord.event.id,
          referenceType: 'SHIPMENT',
          settlementBatchId: null,
          settlementCode: null,
          shipmentCode: codRecord.shipmentCode,
          codRecordId: codRecord.id,
          processingStatus: 'DUPLICATE',
          ignoredReason: 'Shipment COD is already REMITTED.',
        });

        return {
          success: true,
          provider: 'SEPAY',
          providerEventId: transaction.providerEventId,
          action: 'duplicate',
          referenceType: 'SHIPMENT',
          settlementCode: null,
          settlementId: null,
          shipmentCode: codRecord.shipmentCode,
          codRecordId: codRecord.id,
          amount: transaction.amount,
          ignoredReason: 'Shipment COD is already REMITTED.',
        };
      }

      if (codRecord.status === 'COLLECTED' && codRecord.paymentMethod !== 'BANK_TRANSFER') {
        return ignoredResult(
          `COD record "${codRecord.shipmentCode}" was already collected as ${codRecord.paymentMethod}.`,
          shipmentContext,
        );
      }

      const previousStatus = codRecord.status;
      const received = await this.codRecordRepository.markBankTransferReceived(
        codRecord.id,
        transaction.amount,
        transaction.transactionDate ?? new Date(),
        `SePay ${transaction.referenceCode ?? transaction.providerEventId}`,
      );

      if (previousStatus === 'PENDING') {
        await this.codOutboxService.enqueueCodCollected(received);
      }

      await this.codOutboxService.enqueueCodRemitted(received);
      await this.codRecordRepository.updateSettlementPaymentEvent({
        id: eventRecord.event.id,
        referenceType: 'SHIPMENT',
        settlementBatchId: null,
        settlementCode: null,
        shipmentCode: received.shipmentCode,
        codRecordId: received.id,
        processingStatus: 'CONFIRMED',
        ignoredReason: null,
      });

      return {
        success: true,
        provider: 'SEPAY',
        providerEventId: transaction.providerEventId,
        action: 'confirmed',
        referenceType: 'SHIPMENT',
        settlementCode: null,
        settlementId: null,
        shipmentCode: received.shipmentCode,
        codRecordId: received.id,
        amount: transaction.amount,
      };
    }

    if (!transaction.settlementCode) {
      return ignoredResult('UNKNOWN_REFERENCE', {
        referenceType: 'SETTLEMENT',
        processingStatus: 'UNKNOWN_REFERENCE',
      });
    }

    const settlement = await this.codRecordRepository.findSettlementBatchByCode(
      transaction.settlementCode,
    );

    if (!settlement) {
      return ignoredResult(
        `COD settlement batch "${transaction.settlementCode}" was not found.`,
        {
          referenceType: 'SETTLEMENT',
          settlementCode: transaction.settlementCode,
          processingStatus: 'UNKNOWN_REFERENCE',
        },
      );
    }

    const amountTolerance = Number(process.env.SEPAY_AMOUNT_TOLERANCE_VND ?? '0');
    const amountDelta = Math.abs(normalizeMoney(settlement.totalAmount) - transaction.amount);

    if (amountDelta > amountTolerance) {
      return ignoredResult(
        `SePay transferAmount ${transaction.amount} does not match settlement totalAmount ${settlement.totalAmount}.`,
        {
          referenceType: 'SETTLEMENT',
          settlement,
          processingStatus: 'AMOUNT_MISMATCH',
        },
      );
    }

    if (settlement.status === 'PAID') {
      await this.codRecordRepository.updateSettlementPaymentEvent({
        id: eventRecord.event.id,
        referenceType: 'SETTLEMENT',
        settlementBatchId: settlement.id,
        settlementCode: settlement.settlementCode,
        shipmentCode: null,
        codRecordId: null,
        processingStatus: 'DUPLICATE',
        ignoredReason: 'Settlement batch is already PAID.',
      });

      return {
        success: true,
        provider: 'SEPAY',
        providerEventId: transaction.providerEventId,
        action: 'duplicate',
        referenceType: 'SETTLEMENT',
        settlementCode: settlement.settlementCode,
        settlementId: settlement.id,
        shipmentCode: null,
        codRecordId: null,
        amount: transaction.amount,
        ignoredReason: 'Settlement batch is already PAID.',
      };
    }

    if (settlement.status !== 'WAITING_PAYMENT') {
      return ignoredResult(
        `Cannot confirm settlement batch in status "${settlement.status}".`,
        {
          referenceType: 'SETTLEMENT',
          settlement,
        },
      );
    }

    const confirmed = await this.confirmCodSettlement(settlement.id, {
      confirmedBy: 'sepay:webhook',
      note: `SePay ${transaction.referenceCode ?? transaction.providerEventId}`,
    });

    await this.codRecordRepository.updateSettlementPaymentEvent({
      id: eventRecord.event.id,
      referenceType: 'SETTLEMENT',
      settlementBatchId: confirmed.id,
      settlementCode: confirmed.settlementCode,
      shipmentCode: null,
      codRecordId: null,
      processingStatus: 'CONFIRMED',
      ignoredReason: null,
    });

    return {
      success: true,
      provider: 'SEPAY',
      providerEventId: transaction.providerEventId,
      action: 'confirmed',
      referenceType: 'SETTLEMENT',
      settlementCode: confirmed.settlementCode,
      settlementId: confirmed.id,
      shipmentCode: null,
      codRecordId: null,
      amount: transaction.amount,
    };
  }

  private async fetchSePayTransactions(
    input: ReconcileSePayTransactionsInput,
    apiToken: string,
  ): Promise<Record<string, unknown>[]> {
    const dateRange = resolveSePayReconcileDateRange(input);
    const baseUrl = process.env.SEPAY_TRANSACTIONS_API_URL?.trim() ||
      'https://userapi.sepay.vn/v2/transactions';
    const url = new URL(baseUrl);

    url.searchParams.set('transaction_date_from', formatSePayDateTime(dateRange.dateFrom));
    url.searchParams.set('transaction_date_to', formatSePayDateTime(dateRange.dateTo));
    url.searchParams.set('per_page', String(normalizeSePayPerPage(input.perPage)));

    const sinceId = normalizeOptionalFilter(input.sinceId);
    if (sinceId) {
      url.searchParams.set('since_id', sinceId);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = readString(readObject(payload)?.message) ?? response.statusText;
      throw new BadRequestException(`SePay transaction reconcile failed: ${message}`);
    }

    return extractSePayTransactions(payload);
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
    const searchParams = new URLSearchParams({
      acc: bankInfo.accountNumber,
      bank: resolveSePayQrBankCode(bankInfo),
      amount: String(Math.round(amount)),
      des: memo,
    });

    return `https://qr.sepay.vn/img?${searchParams.toString()}`;
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

function normalizeListLimit(value: string | number | null | undefined): number {
  const rawValue = typeof value === 'number' ? value : Number(value ?? 50);
  const parsed = Number.isFinite(rawValue) ? Math.trunc(rawValue) : 50;

  return Math.min(200, Math.max(1, parsed));
}

function parseOptionalDateTime(
  value: string | null | undefined,
  fieldName: string,
): Date | null {
  const normalized = normalizeOptionalFilter(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO date/time value.`);
  }

  return parsed;
}

function resolveSePayReconcileDateRange(input: ReconcileSePayTransactionsInput): {
  dateFrom: Date;
  dateTo: Date;
} {
  const dateTo = parseOptionalDateTime(input.transactionDateTo, 'transactionDateTo') ?? new Date();
  const dateFrom = parseOptionalDateTime(input.transactionDateFrom, 'transactionDateFrom') ??
    new Date(dateTo.getTime() - 24 * 60 * 60 * 1000);

  if (dateFrom >= dateTo) {
    throw new BadRequestException('transactionDateFrom must be before transactionDateTo.');
  }

  return {
    dateFrom,
    dateTo,
  };
}

function normalizeSePayPerPage(value: string | number | null | undefined): number {
  const rawValue = typeof value === 'number' ? value : Number(value ?? 100);
  const parsed = Number.isFinite(rawValue) ? Math.trunc(rawValue) : 100;

  return Math.min(100, Math.max(1, parsed));
}

function formatSePayDateTime(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  const seconds = String(value.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function extractSePayTransactions(payload: unknown): Record<string, unknown>[] {
  const root = readObject(payload);
  const data = root?.data;

  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  const nestedData = readObject(data)?.data;
  if (Array.isArray(nestedData)) {
    return nestedData.filter(isRecord);
  }

  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]+/g, '');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function resolveShipmentHubCode(
  input: SyncShipmentCodRecordInput,
  metadata: Record<string, unknown> | null,
): string | null {
  const directHubCode = normalizeOptionalFilter(input.hubCode)?.toUpperCase();

  if (directHubCode) {
    return directHubCode;
  }

  const hubCandidates = [
    ['receiverHubCode'],
    ['destinationHubCode'],
    ['receiver', 'hubCode'],
    ['routing', 'destinationHubCode'],
    ['currentLocationCode'],
    ['currentLocation'],
    ['hubCode'],
    ['senderHubCode'],
    ['originHubCode'],
    ['sender', 'hubCode'],
    ['routing', 'originHubCode'],
  ];

  for (const path of hubCandidates) {
    const hubCode = normalizeOptionalFilter(readNestedString(metadata, path))?.toUpperCase();

    if (hubCode) {
      return hubCode;
    }
  }

  return null;
}

function readNestedString(
  root: Record<string, unknown> | null,
  path: string[],
): string | null {
  let current: unknown = root;

  for (const segment of path) {
    const currentRecord = readObject(current);

    if (!currentRecord) {
      return null;
    }

    current = currentRecord[segment];
  }

  return readString(current);
}

function mapSePayApiTransactionToWebhookPayload(
  transaction: Record<string, unknown>,
): SePaySettlementWebhookPayload {
  const amountIn = readNumber(transaction.amount_in) ?? 0;
  const amountOut = readNumber(transaction.amount_out) ?? 0;
  const transferAmount = amountIn > 0 ? amountIn : amountOut;
  const transferType = amountIn > 0
    ? 'in'
    : amountOut > 0
      ? 'out'
      : readString(transaction.transferType) ?? readString(transaction.transfer_type);

  return {
    id: readString(transaction.id) ??
      readString(transaction.uuid) ??
      readString(transaction.reference_number) ??
      readString(transaction.referenceCode),
    gateway: readString(transaction.bank_brand_name) ??
      readString(transaction.gateway) ??
      readString(transaction.bank),
    transactionDate: readString(transaction.transaction_date) ??
      readString(transaction.transactionDate),
    accountNumber: readString(transaction.account_number) ??
      readString(transaction.accountNumber),
    code: readString(transaction.code),
    content: readString(transaction.transaction_content) ??
      readString(transaction.content) ??
      readString(transaction.description),
    transferType,
    transferAmount,
    accumulated: readNumber(transaction.accumulated),
    subAccount: readString(transaction.va) ?? readString(transaction.subAccount),
    referenceCode: readString(transaction.reference_number) ??
      readString(transaction.referenceCode),
    description: readString(transaction.description) ??
      readString(transaction.transaction_content),
  };
}

interface NormalizedSePayTransaction {
  providerEventId: string;
  referenceType: 'SETTLEMENT' | 'SHIPMENT' | null;
  settlementCode: string | null;
  shipmentCode: string | null;
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

  const amount = readNumber(payload.transferAmount);

  if (amount === null) {
    throw new BadRequestException('SePay transferAmount must be numeric.');
  }

  const reference = extractCodReference(payload);

  return {
    providerEventId,
    referenceType: reference.referenceType,
    settlementCode: reference.referenceType === 'SETTLEMENT' ? reference.code : null,
    shipmentCode: reference.referenceType === 'SHIPMENT' ? reference.code : null,
    amount: normalizeMoney(amount),
    accountNumber: normalizeOptionalFilter(payload.accountNumber),
    transferType: normalizeOptionalFilter(payload.transferType)?.toLowerCase() ?? null,
    referenceCode,
    transactionDate: parseSePayTransactionDate(payload.transactionDate),
  };
}

function extractCodReference(payload: SePaySettlementWebhookPayload): {
  referenceType: 'SETTLEMENT' | 'SHIPMENT' | null;
  code: string | null;
} {
  const directCode = normalizeOptionalFilter(payload.code)?.toUpperCase();

  if (directCode && isSettlementCode(directCode)) {
    return {
      referenceType: 'SETTLEMENT',
      code: directCode,
    };
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

  const settlementMatch = /\bCOD-\d{8}-[A-Z0-9][A-Z0-9-]*-[A-Z0-9]{6}\b/.exec(haystack);

  if (settlementMatch) {
    return {
      referenceType: 'SETTLEMENT',
      code: settlementMatch[0],
    };
  }

  const shipmentMatch = /\bCOD\s+([A-Z0-9][A-Z0-9_-]{2,64})\b/.exec(haystack);

  if (shipmentMatch) {
    return {
      referenceType: 'SHIPMENT',
      code: shipmentMatch[1].replace(/_+/g, '-'),
    };
  }

  return {
    referenceType: null,
    code: null,
  };
}

function isSettlementCode(value: string): boolean {
  return /^COD-\d{8}-[A-Z0-9][A-Z0-9-]*-[A-Z0-9]{6}$/.test(value);
}

function toWebhookReferenceType(
  value: string | null,
): 'SETTLEMENT' | 'SHIPMENT' | null {
  return value === 'SETTLEMENT' || value === 'SHIPMENT' ? value : null;
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

function resolveSePayQrBankCode(bankInfo: CompanyBankInfo): string {
  return (
    process.env.SEPAY_QR_BANK_CODE?.trim() ||
    process.env.COMPANY_BANK_CODE?.trim() ||
    bankInfo.bankName.trim() ||
    bankInfo.bin.trim()
  );
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
