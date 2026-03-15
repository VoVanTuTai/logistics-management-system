import { Body, Controller, Param, Post } from '@nestjs/common';

import { ReturnsService } from '../../application/services/returns.service';
import type {
  CompleteReturnCaseInput,
  CreateReturnCaseInput,
  ReturnCase,
} from '../../domain/entities/return-case.entity';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

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
