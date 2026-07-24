import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { CourierAreaAssignmentsService } from '../../application/services/courier-area-assignments.service';
import type { CourierAreaAssignment, CourierAreaAssignmentWriteInput } from '../../domain/entities/courier-area-assignment.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

@Controller('courier-area-assignments')
export class CourierAreaAssignmentsController {
  constructor(private readonly courierAreaAssignmentsService: CourierAreaAssignmentsService) {}

  @Get()
  list(
    @Query('courierId') courierId?: string,
    @Query('hubCode') hubCode?: string,
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('ward') ward?: string,
    @Query('isActive') isActive?: string,
  ): Promise<CourierAreaAssignment[]> {
    return this.courierAreaAssignmentsService.list({
      courierId,
      hubCode,
      province,
      district,
      ward,
      isActive,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<CourierAreaAssignment> {
    return this.courierAreaAssignmentsService.getById(id);
  }

  @Post()
  create(
    @Body() body: CourierAreaAssignmentWriteInput,
    @Req() request: AuditRequest,
  ): Promise<CourierAreaAssignment> {
    return this.courierAreaAssignmentsService.create(body, getAdminAuditContext(request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<CourierAreaAssignmentWriteInput>,
    @Req() request: AuditRequest,
  ): Promise<CourierAreaAssignment> {
    return this.courierAreaAssignmentsService.update(id, body, getAdminAuditContext(request));
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; assignmentId: string | null }> {
    return this.courierAreaAssignmentsService.remove(id, getAdminAuditContext(request));
  }
}
