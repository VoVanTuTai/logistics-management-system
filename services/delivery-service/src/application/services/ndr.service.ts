import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CreateNdrCaseInput,
  NdrCase,
  RescheduleNdrCaseInput,
} from '../../domain/entities/ndr-case.entity';
import { NdrCaseRepository } from '../../domain/repositories/ndr-case.repository';
import { DeliveryOutboxService } from '../../messaging/outbox/delivery-outbox.service';

@Injectable()
export class NdrService {
  constructor(
    @Inject(NdrCaseRepository)
    private readonly ndrCaseRepository: NdrCaseRepository,
    private readonly deliveryOutboxService: DeliveryOutboxService,
  ) {}

  async create(input: CreateNdrCaseInput): Promise<NdrCase> {
    if (!input.shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    const ndrCase = await this.ndrCaseRepository.create(input);

    await this.deliveryOutboxService.enqueueNdrCreated(ndrCase);

    return ndrCase;
  }

  async reschedule(
    id: string,
    input: RescheduleNdrCaseInput,
  ): Promise<NdrCase> {
    const existingCase = await this.ndrCaseRepository.findById(id);

    if (!existingCase) {
      throw new NotFoundException(`NDR case "${id}" was not found.`);
    }

    const ndrCase = await this.ndrCaseRepository.reschedule(id, input);

    await this.deliveryOutboxService.enqueueNdrRescheduled(ndrCase);

    return ndrCase;
  }
}
