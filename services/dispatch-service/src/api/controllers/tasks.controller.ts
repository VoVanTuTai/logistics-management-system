import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { TasksService } from '../../application/services/tasks.service';
import type {
  AssignTaskInput,
  CreateTaskInput,
  ReassignTaskInput,
  Task,
  UpdateTaskStatusInput,
} from '../../domain/entities/task.entity';

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
  ): Promise<Task[]> {
    return this.tasksService.list({
      courierId,
      taskType,
      status,
      shipmentCode,
      pickupRequestId,
    });
  }

  @Get('couriers')
  listCouriers(): Promise<string[]> {
    return this.tasksService.listCouriers();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Task> {
    return this.tasksService.getById(id);
  }

  @Post()
  create(@Body() body: CreateTaskInput): Promise<Task> {
    return this.tasksService.create(body);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: AssignTaskInput,
  ): Promise<Task> {
    return this.tasksService.assign(id, body);
  }

  @Post(':id/reassign')
  reassign(
    @Param('id') id: string,
    @Body() body: ReassignTaskInput,
  ): Promise<Task> {
    return this.tasksService.reassign(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTaskStatusInput,
  ): Promise<Task> {
    return this.tasksService.updateStatus(id, body);
  }
}
