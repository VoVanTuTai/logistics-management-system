import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { NdrReasonsService } from '../../application/services/ndr-reasons.service';
import type {
  NdrReason,
  NdrReasonWriteInput,
} from '../../domain/entities/ndr-reason.entity';

@Controller('ndr-reasons')
export class NdrReasonsController {
  constructor(private readonly ndrReasonsService: NdrReasonsService) {}

  @Get()
  list(
    @Query('code') code?: string,
    @Query('description') description?: string,
    @Query('isActive') isActive?: string,
    @Query('q') q?: string,
  ): Promise<NdrReason[]> {
    return this.ndrReasonsService.list({
      code,
      description,
      isActive,
      q,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<NdrReason> {
    return this.ndrReasonsService.getById(id);
  }

  @Post()
  create(@Body() body: NdrReasonWriteInput): Promise<NdrReason> {
    return this.ndrReasonsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<NdrReasonWriteInput>,
  ): Promise<NdrReason> {
    return this.ndrReasonsService.update(id, body);
  }
}
