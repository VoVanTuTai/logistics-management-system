import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CreateNdrCaseInput,
  ListNdrCasesFilter,
  NdrCase,
  ReturnDecisionInput,
  RescheduleNdrCaseInput,
} from '../../domain/entities/ndr-case.entity';
import type { ReturnCase } from '../../domain/entities/return-case.entity';
import { NdrCaseRepository } from '../../domain/repositories/ndr-case.repository';
import { ReturnCaseRepository } from '../../domain/repositories/return-case.repository';
import { DeliveryOutboxService } from '../../messaging/outbox/delivery-outbox.service';

export interface NdrReturnDecisionResult {
  action: 'RETURN_TO_SENDER' | 'KEEP_FOR_REDELIVERY';
  ndrCase: NdrCase;
  returnCase: ReturnCase | null;
}

@Injectable()
export class NdrService {
  constructor(
    @Inject(NdrCaseRepository)
    private readonly ndrCaseRepository: NdrCaseRepository,
    @Inject(ReturnCaseRepository)
    private readonly returnCaseRepository: ReturnCaseRepository,
    private readonly deliveryOutboxService: DeliveryOutboxService,
  ) {}

  async list(filter?: { shipmentCode?: string; status?: string }): Promise<NdrCase[]> {
    const normalizedFilter: ListNdrCasesFilter = {};

    const shipmentCode = filter?.shipmentCode?.trim();
    if (shipmentCode) {
      normalizedFilter.shipmentCode = shipmentCode;
    }

    const status = filter?.status?.trim().toUpperCase();
    if (status) {
      if (!this.ndrCaseRepository.isValidStatus(status)) {
        throw new BadRequestException(`Unsupported NDR status "${status}".`);
      }

      normalizedFilter.status = status;
    }

    return this.ndrCaseRepository.list(normalizedFilter);
  }

  async detail(id: string): Promise<NdrCase> {
    const ndrCase = await this.ndrCaseRepository.findById(id);
    if (!ndrCase) {
      throw new NotFoundException(`NDR case "${id}" was not found.`);
    }

    return ndrCase;
  }

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
    const nextDeliveryAt = input.nextDeliveryAt ?? input.rescheduleAt;
    if (!nextDeliveryAt) {
      throw new BadRequestException(
        'nextDeliveryAt (or rescheduleAt) is required.',
      );
    }

    const existingCase = await this.ndrCaseRepository.findById(id);

    if (!existingCase) {
      throw new NotFoundException(`NDR case "${id}" was not found.`);
    }

    const ndrCase = await this.ndrCaseRepository.reschedule(id, input);

    await this.deliveryOutboxService.enqueueNdrRescheduled(ndrCase);

    return ndrCase;
  }

  async returnDecision(
    id: string,
    input: ReturnDecisionInput,
  ): Promise<NdrReturnDecisionResult> {
    const existingCase = await this.ndrCaseRepository.findById(id);
    if (!existingCase) {
      throw new NotFoundException(`NDR case "${id}" was not found.`);
    }

    if (input.returnToSender) {
      const ndrCase = await this.ndrCaseRepository.markReturnRequested(id, {
        note: input.note,
      });
      const existingReturnCase = await this.returnCaseRepository.findByNdrCaseId(id);
      const returnCase =
        existingReturnCase ??
        (await this.returnCaseRepository.create({
          shipmentCode: ndrCase.shipmentCode,
          ndrCaseId: ndrCase.id,
          note: input.note ?? null,
        }));

      if (!existingReturnCase) {
        await this.deliveryOutboxService.enqueueReturnStarted(returnCase);
      }

      return {
        action: 'RETURN_TO_SENDER',
        ndrCase,
        returnCase,
      };
    }

    return {
      action: 'KEEP_FOR_REDELIVERY',
      ndrCase: existingCase,
      returnCase: null,
    };
  }
}
