import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';

import { CodService } from '../../application/services/cod.service';
import type {
  CodDailySettlementQuery,
  CodDailySettlementSummary,
  CodRecord,
  CodSettlementPaymentEvent,
  CodSettlementPaymentEventQuery,
  CodSettlementQr,
  SePaySettlementWebhookPayload,
  SePaySettlementWebhookResult,
  CodSettlementBatch,
  CodSummary,
  CollectCodInput,
  CompanyBankInfo,
  ConfirmCodSettlementInput,
  CreateCodSettlementInput,
  CreateCodRecordInput,
  ReconcileSePayTransactionsInput,
  ReconcileSePayTransactionsResult,
  RemitCodInput,
  SyncShipmentCodRecordInput,
  SyncShipmentCodRecordResult,
} from '../../domain/entities/cod-record.entity';

interface RawBodyRequest {
  rawBody?: Buffer;
}

@Controller('cod')
export class CodController {
  constructor(private readonly codService: CodService) {}

  @Post('records')
  createRecord(@Body() body: CreateCodRecordInput): Promise<CodRecord> {
    return this.codService.createCodRecord(body);
  }

  @Post('records/sync-shipment')
  syncShipmentRecord(
    @Body() body: SyncShipmentCodRecordInput,
  ): Promise<SyncShipmentCodRecordResult> {
    return this.codService.syncShipmentCodRecord(body);
  }

  @Post('collect')
  collect(@Body() body: CollectCodInput): Promise<CodRecord> {
    return this.codService.collectCod(body);
  }

  @Post('remit')
  remit(@Body() body: RemitCodInput): Promise<CodRecord> {
    return this.codService.remitCod(body);
  }

  @Get('shipment/:shipmentCode')
  getByShipment(
    @Param('shipmentCode') shipmentCode: string,
  ): Promise<CodRecord | null> {
    return this.codService.getCodByShipment(shipmentCode);
  }

  @Get('courier/:courierId')
  listByCourier(
    @Param('courierId') courierId: string,
    @Query('status') status?: string,
  ): Promise<CodRecord[]> {
    return this.codService.listCodByCourier(courierId, status);
  }

  @Get('summary/:courierId')
  getSummary(@Param('courierId') courierId: string): Promise<CodSummary> {
    return this.codService.getCodSummary(courierId);
  }

  @Get('settlements/daily')
  getDailySettlement(
    @Query() query: CodDailySettlementQuery,
  ): Promise<CodDailySettlementSummary> {
    return this.codService.getDailySettlement(query);
  }

  @Post('settlements')
  createSettlement(
    @Body() body: CreateCodSettlementInput,
  ): Promise<CodSettlementBatch> {
    return this.codService.createCodSettlement(body);
  }

  @Get('settlements/:id/qr')
  getSettlementQr(@Param('id') id: string): Promise<CodSettlementQr> {
    return this.codService.getCodSettlementQr(id);
  }

  @Post('settlements/:id/confirm')
  confirmSettlement(
    @Param('id') id: string,
    @Body() body: ConfirmCodSettlementInput,
  ): Promise<CodSettlementBatch> {
    return this.codService.confirmCodSettlement(id, body);
  }

  @Get('webhooks/sepay/events')
  listSePayWebhookEvents(
    @Query() query: CodSettlementPaymentEventQuery,
  ): Promise<CodSettlementPaymentEvent[]> {
    return this.codService.listSePayWebhookEvents(query);
  }

  @Post('webhooks/sepay/reconcile')
  reconcileSePayTransactions(
    @Body() body: ReconcileSePayTransactionsInput,
  ): Promise<ReconcileSePayTransactionsResult> {
    return this.codService.reconcileSePayTransactions(body);
  }

  @Post('webhooks/sepay/settlements')
  handleSePaySettlementWebhook(
    @Body() body: SePaySettlementWebhookPayload,
    @Req() request: RawBodyRequest,
    @Headers('authorization') authorization?: string,
    @Headers('x-sepay-signature') signature?: string,
    @Headers('x-sepay-timestamp') timestamp?: string,
  ): Promise<SePaySettlementWebhookResult> {
    return this.codService.handleSePaySettlementWebhook({
      payload: body,
      rawBody: request.rawBody ?? null,
      headers: {
        authorization,
        signature,
        timestamp,
      },
    });
  }

  @Post('webhooks/sepay')
  handleSePayWebhook(
    @Body() body: SePaySettlementWebhookPayload,
    @Req() request: RawBodyRequest,
    @Headers('authorization') authorization?: string,
    @Headers('x-sepay-signature') signature?: string,
    @Headers('x-sepay-timestamp') timestamp?: string,
  ): Promise<SePaySettlementWebhookResult> {
    return this.codService.handleSePaySettlementWebhook({
      payload: body,
      rawBody: request.rawBody ?? null,
      headers: {
        authorization,
        signature,
        timestamp,
      },
    });
  }

  @Get('bank-info')
  getBankInfo(): CompanyBankInfo {
    return this.codService.getCompanyBankInfo();
  }

  @Get('qr')
  getQrUrl(
    @Query('amount') amount: string,
    @Query('memo') memo: string,
  ): { url: string } {
    const parsedAmount = Number(amount) || 0;
    const resolvedMemo = memo || 'NOP TIEN COD';
    return { url: this.codService.buildVietQrUrl(parsedAmount, resolvedMemo) };
  }
}
