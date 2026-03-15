import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  NdrReason,
  NdrReasonWriteInput,
} from '../../domain/entities/ndr-reason.entity';
import { NdrReasonRepository } from '../../domain/repositories/ndr-reason.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';

@Injectable()
export class NdrReasonsService {
  constructor(
    @Inject(NdrReasonRepository)
    private readonly ndrReasonRepository: NdrReasonRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(): Promise<NdrReason[]> {
    return this.ndrReasonRepository.list();
  }

  async getById(id: string): Promise<NdrReason> {
    const ndrReason = await this.ndrReasonRepository.findById(id);

    if (!ndrReason) {
      throw new NotFoundException(`NDR reason "${id}" was not found.`);
    }

    return ndrReason;
  }

  async create(input: NdrReasonWriteInput): Promise<NdrReason> {
    // TODO: add NDR reason code policy and duplicate checks.
    const ndrReason = await this.ndrReasonRepository.create(input);

    await this.masterdataOutboxService.enqueueNdrReasonUpdated(
      ndrReason.id,
      {
        action: 'created',
        entity: 'ndr-reason',
        record: ndrReason,
      },
    );

    return ndrReason;
  }

  async update(
    id: string,
    input: Partial<NdrReasonWriteInput>,
  ): Promise<NdrReason> {
    await this.getById(id);

    const ndrReason = await this.ndrReasonRepository.update(id, input);

    await this.masterdataOutboxService.enqueueNdrReasonUpdated(
      ndrReason.id,
      {
        action: 'updated',
        entity: 'ndr-reason',
        record: ndrReason,
      },
    );

    return ndrReason;
  }
}
