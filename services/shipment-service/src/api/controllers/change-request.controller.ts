import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ChangeRequestsService } from '../../application/services/change-requests.service';
import type {
  ApproveChangeRequestInput,
  ChangeRequest,
  CreateChangeRequestInput,
} from '../../domain/entities/change-request.entity';

@Controller('change-requests')
export class ChangeRequestController {
  constructor(
    private readonly changeRequestsService: ChangeRequestsService,
  ) {}

  @Get()
  list(): Promise<ChangeRequest[]> {
    return this.changeRequestsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<ChangeRequest> {
    return this.changeRequestsService.getById(id);
  }

  @Post()
  create(@Body() body: CreateChangeRequestInput): Promise<ChangeRequest> {
    return this.changeRequestsService.create(body);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: ApproveChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.changeRequestsService.approve(id, body);
  }
}
