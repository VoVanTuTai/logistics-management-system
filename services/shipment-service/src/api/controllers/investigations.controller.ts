import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  type CreateDisputeInput,
  type EscalateClaimInput,
  InvestigationsService,
  type ResolveFoundInput,
} from '../../application/services/investigations.service';
import type { BreakPointType, InvestigationCase, InvestigationStatus } from '@prisma/client';

@Controller('investigations')
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: InvestigationStatus,
    @Query('breakPointType') breakPointType?: BreakPointType,
  ): Promise<InvestigationCase[]> {
    return this.investigationsService.list({ search, status, breakPointType });
  }

  @Post()
  create(
    @Body()
    body: {
      shipmentCode: string;
      breakPointType: BreakPointType;
      suspectPartyCode: string;
      suspectPartyName: string;
      breakPointDescription?: string;
    },
  ): Promise<InvestigationCase> {
    return this.investigationsService.create(body);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<InvestigationCase> {
    return this.investigationsService.getById(id);
  }

  @Post(':id/disputes')
  submitDispute(
    @Param('id') id: string,
    @Body() body: CreateDisputeInput,
  ): Promise<InvestigationCase> {
    return this.investigationsService.submitDispute(id, body);
  }

  @Post(':id/resolve-found')
  resolveFound(
    @Param('id') id: string,
    @Body() body: ResolveFoundInput,
  ): Promise<InvestigationCase> {
    return this.investigationsService.resolveFound(id, body);
  }

  @Post(':id/extend-hearing')
  extendHearing(
    @Param('id') id: string,
    @Body('hours') hours?: number,
  ): Promise<InvestigationCase> {
    return this.investigationsService.extendHearing(id, hours ?? 12);
  }

  @Post(':id/escalate-claim')
  escalateClaim(
    @Param('id') id: string,
    @Body() body: EscalateClaimInput,
  ): Promise<{ case: InvestigationCase; claimCode: string }> {
    return this.investigationsService.escalateClaim(id, body);
  }
}
