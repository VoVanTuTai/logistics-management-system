import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CodService } from '../../application/services/cod.service';
import type {
  CodRecord,
  CodSummary,
  CollectCodInput,
  CompanyBankInfo,
  CreateCodRecordInput,
  RemitCodInput,
} from '../../domain/entities/cod-record.entity';

@Controller('cod')
export class CodController {
  constructor(private readonly codService: CodService) {}

  @Post('records')
  createRecord(@Body() body: CreateCodRecordInput): Promise<CodRecord> {
    return this.codService.createCodRecord(body);
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
