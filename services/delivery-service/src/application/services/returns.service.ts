import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CompleteReturnCaseInput,
  CreateReturnCaseInput,
  ListReturnCasesFilter,
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

  async list(filter?: {
    shipmentCode?: string;
    ndrCaseId?: string;
    status?: string;
  }): Promise<ReturnCase[]> {
    const normalizedFilter: ListReturnCasesFilter = {};
    const shipmentCode = normalizeShipmentCode(filter?.shipmentCode);
    const ndrCaseId = normalizeOptionalText(filter?.ndrCaseId);
    const status = normalizeOptionalText(filter?.status)?.toUpperCase();

    if (shipmentCode) {
      normalizedFilter.shipmentCode = shipmentCode;
    }

    if (ndrCaseId) {
      normalizedFilter.ndrCaseId = ndrCaseId;
    }

    if (status) {
      if (status !== 'STARTED' && status !== 'COMPLETED') {
        throw new BadRequestException(`Unsupported return status "${filter?.status}".`);
      }

      normalizedFilter.status = status;
    }

    return this.returnCaseRepository.list(normalizedFilter);
  }

  async detail(id: string): Promise<ReturnCase> {
    const returnCase = await this.returnCaseRepository.findById(id);

    if (!returnCase) {
      throw new NotFoundException(`Return case "${id}" was not found.`);
    }

    return returnCase;
  }

  async create(input: CreateReturnCaseInput): Promise<ReturnCase> {
    const shipmentCode = normalizeShipmentCode(input.shipmentCode);
    const ndrCaseId = normalizeOptionalText(input.ndrCaseId);

    if (!shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    if (ndrCaseId) {
      const existingByNdr = await this.returnCaseRepository.findByNdrCaseId(ndrCaseId);

      if (existingByNdr) {
        return existingByNdr;
      }
    }

    const existingByShipment = await this.returnCaseRepository.findByShipmentCode(shipmentCode);

    if (existingByShipment) {
      return existingByShipment;
    }

    const returnCase = await this.returnCaseRepository.create({
      ...input,
      shipmentCode,
      ndrCaseId,
      note: normalizeOptionalText(input.note),
    });

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

    if (existingCase.status === 'COMPLETED') {
      throw new BadRequestException(`Return case "${id}" is already completed.`);
    }

    const returnCase = await this.returnCaseRepository.complete(id, {
      note: normalizeOptionalText(input.note),
    });

    await this.deliveryOutboxService.enqueueReturnCompleted(returnCase);

    return returnCase;
  }
}

function normalizeShipmentCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}
