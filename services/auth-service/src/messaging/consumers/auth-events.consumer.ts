import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthEventsConsumer {
  private readonly logger = new Logger(AuthEventsConsumer.name);

  async handle(): Promise<void> {
    // TODO: auth-service currently does not consume domain events
    // Keep skeleton for event-driven consistency and future extension.
    this.logger.debug('TODO: auth events consumer handle');
  }
}
