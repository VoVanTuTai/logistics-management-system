import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CompleteReturnCaseInput,
  CreateReturnCaseInput,
  ReturnCase,
} from '../../domain/entities/return-case.entity';
import { ReturnCaseRepository } from '../../domain/repositories/return-case.repository';
import { DeliveryOutboxService } from '../../messaging/outbox/delivery-outbox.service';

@Injectable()
export class ReturnsService {
  constructor(
    @Inject(ReturnCaseRepository)
    private readonly returnCaseRepository: ReturnCaseRepository,
    private readonly deliveryOutboxService: DeliveryOutboxService,
  ) {}

  async create(input: CreateReturnCaseInput): Promise<ReturnCase> {
    if (!input.shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    const returnCase = await this.returnCaseRepository.create(input);

    await this.deliveryOutboxService.enqueueReturnStarted(returnCase);

    return returnCase;
  }

  async complete(
    id: string,
    input: CompleteReturnCaseInput,
  ): Promise<ReturnCase> {
    const existingCase = await this.returnCaseRepository.findById(id);

    if (!existingCase) {
      throw new NotFoundException(`Return case "${id}" was not found.`);
    }

    const returnCase = await this.returnCaseRepository.complete(id, input);

    await this.deliveryOutboxService.enqueueReturnCompleted(returnCase);

    return returnCase;
  }
}
