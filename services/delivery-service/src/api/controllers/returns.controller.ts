import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { ReturnsService } from '../../application/services/returns.service';
import type {
  CompleteReturnCaseInput,
  CreateReturnCaseInput,
  ReturnCase,
} from '../../domain/entities/return-case.entity';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  list(
    @Query('shipmentCode') shipmentCode?: string,
    @Query('ndrCaseId') ndrCaseId?: string,
    @Query('status') status?: string,
  ): Promise<ReturnCase[]> {
    return this.returnsService.list({ shipmentCode, ndrCaseId, status });
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<ReturnCase> {
    return this.returnsService.detail(id);
  }

  @Post()
  create(@Body() body: CreateReturnCaseInput): Promise<ReturnCase> {
    return this.returnsService.create(body);
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() body: CompleteReturnCaseInput,
  ): Promise<ReturnCase> {
    return this.returnsService.complete(id, body);
  }
}
