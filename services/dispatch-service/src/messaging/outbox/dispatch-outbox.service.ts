import { Inject, Injectable } from '@nestjs/common';

import type { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import type { Task } from '../../domain/entities/task.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { DispatchEventsProducer } from '../producers/dispatch-events.producer';

@Injectable()
export class DispatchOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly dispatchEventsProducer: DispatchEventsProducer,
  ) {}

  enqueueTaskCreated(task: Task): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.dispatchEventsProducer.buildTaskCreatedEvent(task),
    );
  }

  enqueueTaskAssigned(task: Task): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.dispatchEventsProducer.buildTaskAssignedEvent(task),
    );
  }

  enqueueTaskReassigned(task: Task): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.dispatchEventsProducer.buildTaskReassignedEvent(task),
    );
  }

  enqueueTaskCompleted(task: Task): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.dispatchEventsProducer.buildTaskCompletedEvent(task),
    );
  }

  enqueueTaskCancelled(task: Task): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.dispatchEventsProducer.buildTaskCancelledEvent(task),
    );
  }
}
