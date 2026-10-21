import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  type AddCskhNoteInput,
  type CreateCskhTicketInput,
  CskhService,
  type EscalateToClaimInput,
} from '../../application/services/cskh.service';
import type { CskhTicket } from '@prisma/client';

@Controller('cskh/tickets')
export class CskhController {
  constructor(private readonly cskhService: CskhService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('customerPhone') customerPhone?: string,
    @Query('shipmentCode') shipmentCode?: string,
  ): Promise<CskhTicket[]> {
    return this.cskhService.list({
      search,
      status,
      category,
      priority,
      customerPhone,
      shipmentCode,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<CskhTicket> {
    return this.cskhService.getById(id);
  }

  @Post()
  create(@Body() body: CreateCskhTicketInput): Promise<CskhTicket> {
    return this.cskhService.create(body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; resolutionSummary?: string },
  ): Promise<CskhTicket> {
    return this.cskhService.updateStatus(id, body.status, body.resolutionSummary);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() body: AddCskhNoteInput,
  ): Promise<CskhTicket> {
    return this.cskhService.addNote(id, body);
  }

  @Post(':id/escalate-to-claim')
  escalateToClaim(
    @Param('id') id: string,
    @Body() body: EscalateToClaimInput,
  ): Promise<{ ticket: CskhTicket; claim: any }> {
    return this.cskhService.escalateToClaim(id, body);
  }
}
