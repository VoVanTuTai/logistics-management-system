import { Inject, Injectable } from '@nestjs/common';

import type { AuthSession } from '../../domain/entities/auth-session.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { AuthEventsProducer } from '../producers/auth-events.producer';

@Injectable()
export class AuthOutboxService {
  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly authEventsProducer: AuthEventsProducer,
  ) {}

  async enqueueSessionCreated(
    session: AuthSession,
    actor: string,
  ): Promise<void> {
    await this.outboxEventRepository.create(
      this.authEventsProducer.buildSessionCreatedEvent(session, actor),
    );
  }

  async enqueueSessionRefreshed(
    session: AuthSession,
    actor: string,
  ): Promise<void> {
    await this.outboxEventRepository.create(
      this.authEventsProducer.buildSessionRefreshedEvent(session, actor),
    );
  }

  async enqueueSessionRevoked(
    session: AuthSession,
    actor: string,
  ): Promise<void> {
    await this.outboxEventRepository.create(
      this.authEventsProducer.buildSessionRevokedEvent(session, actor),
    );
  }
}
