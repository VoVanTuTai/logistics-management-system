import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  type AdjudicateClaimInput,
  ClaimsService,
  type CreateClaimInput,
  type HubClaimStatisticItem,
} from '../../application/services/claims.service';
import type {
  ClaimStatus,
  CompensationClaim,
  IncidentType,
  ResponsiblePartyType,
} from '@prisma/client';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: ClaimStatus,
    @Query('incidentType') incidentType?: IncidentType,
    @Query('responsibleParty') responsibleParty?: ResponsiblePartyType,
  ): Promise<CompensationClaim[]> {
    return this.claimsService.list({ search, status, incidentType, responsibleParty });
  }

  @Get('statistics/hub-summary')
  getHubStatistics(): Promise<HubClaimStatisticItem[]> {
    return this.claimsService.getHubStatistics();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<CompensationClaim> {
    return this.claimsService.getById(id);
  }

  @Post()
  create(@Body() body: CreateClaimInput): Promise<CompensationClaim> {
    return this.claimsService.create(body);
  }

  @Post(':id/adjudicate')
  adjudicate(
    @Param('id') id: string,
    @Body() body: AdjudicateClaimInput,
  ): Promise<CompensationClaim> {
    return this.claimsService.adjudicate(id, body);
  }

  @Post(':id/approve-payment')
  approvePayment(@Param('id') id: string): Promise<CompensationClaim> {
    return this.claimsService.approvePayment(id);
  }

  @Post(':id/settle-deduction')
  settleDeduction(@Param('id') id: string): Promise<CompensationClaim> {
    return this.claimsService.settleDeduction(id);
  }
}
