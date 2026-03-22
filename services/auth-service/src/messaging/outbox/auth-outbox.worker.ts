import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthOutboxWorker {
  private readonly logger = new Logger(AuthOutboxWorker.name);

  async runOnce(): Promise<void> {
    // TODO: load pending events from outbox table
    // TODO: publish to RabbitMQ exchange `domain.events` with routing key `context.action`
    // TODO: update event status PUBLISHED/FAILED and apply retry or DLQ policy
    this.logger.debug('TODO: auth outbox worker runOnce');
  }
}
