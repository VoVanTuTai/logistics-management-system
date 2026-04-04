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

  enqueueTaskAssigned(task: Task): Promise<OutboxEvent> {
    return this.outboxEventRepository.create(
      this.dispatchEventsProducer.buildTaskAssignedEvent(task),
    );
  }
}
