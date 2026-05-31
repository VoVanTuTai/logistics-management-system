import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import {
  type OpsTaskScopeContext,
  TasksService,
} from '../../application/services/tasks.service';
import type {
  AssignTaskInput,
  CreateTaskInput,
  ReassignTaskInput,
  Task,
  UpdateTaskStatusInput,
} from '../../domain/entities/task.entity';
import {
  type AuditRequest,
  getOpsAuditContext,
} from './ops-audit-context';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(
    @Query('courierId') courierId?: string,
    @Query('taskType') taskType?: string,
    @Query('status') status?: string,
    @Query('shipmentCode') shipmentCode?: string,
    @Query('pickupRequestId') pickupRequestId?: string,
    @Req() request?: AuditRequest,
  ): Promise<Task[]> {
    return this.tasksService.list(
      {
        courierId,
        taskType,
        status,
        shipmentCode,
        pickupRequestId,
      },
      getOpsTaskScopeContext(request),
    );
  }

  @Get('couriers')
  listCouriers(): Promise<string[]> {
    return this.tasksService.listCouriers();
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() request: AuditRequest): Promise<Task> {
    return this.tasksService.getById(id, getOpsTaskScopeContext(request));
  }

  @Post()
  create(@Body() body: CreateTaskInput): Promise<Task> {
    return this.tasksService.create(body);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: AssignTaskInput,
    @Req() request: AuditRequest,
  ): Promise<Task> {
    return this.tasksService.assign(id, body, getOpsAuditContext(request));
  }

  @Post(':id/reassign')
  reassign(
    @Param('id') id: string,
    @Body() body: ReassignTaskInput,
    @Req() request: AuditRequest,
  ): Promise<Task> {
    return this.tasksService.reassign(id, body, getOpsAuditContext(request));
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTaskStatusInput,
    @Req() request: AuditRequest,
  ): Promise<Task> {
    return this.tasksService.updateStatus(
      id,
      body,
      getOpsTaskScopeContext(request),
    );
  }
}

function getOpsTaskScopeContext(
  request: AuditRequest | undefined,
): OpsTaskScopeContext | undefined {
  if (!request) {
    return undefined;
  }

  const roles = getHeaderList(request, 'x-ops-roles');
  const hubCodes = getHeaderList(request, 'x-ops-hub-codes');

  if (roles.length === 0 && hubCodes.length === 0) {
    return undefined;
  }

  return {
    hubCodes,
    canAccessAllHubs: roles.includes('SYSTEM_ADMIN'),
  };
}

function getHeaderList(request: AuditRequest, name: string): string[] {
  const value = request.headers[name];
  const rawValues = Array.isArray(value) ? value : [value];

  return Array.from(
    new Set(
      rawValues
        .filter((item): item is string => typeof item === 'string')
        .flatMap((item) => item.split(','))
        .map((item) => item.trim().toUpperCase())
        .filter((item) => item.length > 0),
    ),
  );
}
