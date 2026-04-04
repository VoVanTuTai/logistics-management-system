import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  ApproveChangeRequestInput,
  ChangeRequest,
  CreateChangeRequestInput,
} from '../../domain/entities/change-request.entity';
import { ChangeRequestRepository } from '../../domain/repositories/change-request.repository';

@Injectable()
export class ChangeRequestsService {
  constructor(
    @Inject(ChangeRequestRepository)
    private readonly changeRequestRepository: ChangeRequestRepository,
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

  create(input: CreateChangeRequestInput): Promise<ChangeRequest> {
    return this.changeRequestRepository.create(input);
  }

  async approve(
    id: string,
    input: ApproveChangeRequestInput,
  ): Promise<ChangeRequest> {
    await this.getById(id);

    return this.changeRequestRepository.approve(id, input);
  }
}
