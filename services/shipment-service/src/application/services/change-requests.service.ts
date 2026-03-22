import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  ApproveChangeRequestInput,
  ChangeRequest,
  CreateChangeRequestInput,
} from '../../domain/entities/change-request.entity';
import { ChangeRequestRepository } from '../../domain/repositories/change-request.repository';
import { ShipmentOutboxService } from '../../messaging/outbox/shipment-outbox.service';

@Injectable()
export class ChangeRequestsService {
  constructor(
    @Inject(ChangeRequestRepository)
    private readonly changeRequestRepository: ChangeRequestRepository,
    private readonly shipmentOutboxService: ShipmentOutboxService,
  ) {}

  list(): Promise<ChangeRequest[]> {
    return this.changeRequestRepository.list();
  }

  async getById(id: string): Promise<ChangeRequest> {
    const changeRequest = await this.changeRequestRepository.findById(id);

    if (!changeRequest) {
      throw new NotFoundException(`Change request "${id}" was not found.`);
    }

    return changeRequest;
  }

  async create(input: CreateChangeRequestInput): Promise<ChangeRequest> {
    const changeRequest = await this.changeRequestRepository.create(input);

    await this.shipmentOutboxService.enqueueChangeRequested(changeRequest);

    return changeRequest;
  }

  async approve(
    id: string,
    input: ApproveChangeRequestInput,
  ): Promise<ChangeRequest> {
    await this.getById(id);

    const changeRequest = await this.changeRequestRepository.approve(id, input);

    await this.shipmentOutboxService.enqueueChangeApproved(changeRequest);

    return changeRequest;
  }
}
