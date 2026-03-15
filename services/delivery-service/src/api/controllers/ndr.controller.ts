import { Body, Controller, Param, Post } from '@nestjs/common';

import { NdrService } from '../../application/services/ndr.service';
import type {
  CreateNdrCaseInput,
  NdrCase,
  RescheduleNdrCaseInput,
} from '../../domain/entities/ndr-case.entity';

@Controller('ndr')
export class NdrController {
  constructor(private readonly ndrService: NdrService) {}

  @Post()
  create(@Body() body: CreateNdrCaseInput): Promise<NdrCase> {
    return this.ndrService.create(body);
  }

  @Post(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() body: RescheduleNdrCaseInput,
  ): Promise<NdrCase> {
    return this.ndrService.reschedule(id, body);
  }
}
