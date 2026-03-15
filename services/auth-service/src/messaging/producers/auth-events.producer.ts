import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { AuthSession } from '../../domain/entities/auth-session.entity';
import type {
  AuthPublishedEventType,
  QueueOutboxEventInput,
} from '../../domain/entities/outbox-event.entity';

@Injectable()
export class AuthEventsProducer {
  readonly exchangeName = process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  buildSessionCreatedEvent(
    session: AuthSession,
    actor: string,
  ): QueueOutboxEventInput {
    return this.buildEvent('auth.session_created', session, actor);
  }

  buildSessionRefreshedEvent(
    session: AuthSession,
    actor: string,
  ): QueueOutboxEventInput {
    return this.buildEvent('auth.session_refreshed', session, actor);
  }

  buildSessionRevokedEvent(
    session: AuthSession,
    actor: string,
  ): QueueOutboxEventInput {
    return this.buildEvent('auth.session_revoked', session, actor);
  }

  private buildEvent(
    eventType: AuthPublishedEventType,
    session: AuthSession,
    actor: string,
  ): QueueOutboxEventInput {
    const eventId = randomUUID();
    const occurredAt = new Date();

    return {
      eventId,
      eventType,
      routingKey: eventType,
      aggregateType: 'auth_session',
      aggregateId: session.id,
      payload: {
        event_id: eventId,
        event_type: eventType,
        occurred_at: occurredAt.toISOString(),
        shipment_code: null,
        actor,
        location: null,
        data: {
          session,
        },
        idempotency_key: `${eventType}:session:${session.id}:${occurredAt.toISOString()}`,
      },
      occurredAt,
    };
  }
}
