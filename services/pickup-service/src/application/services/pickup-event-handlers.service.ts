import { Injectable } from '@nestjs/common';

@Injectable()
export class PickupEventHandlersService {
  async handle(): Promise<void> {
    // No inbound event handlers in the slim event model.
  }
}
