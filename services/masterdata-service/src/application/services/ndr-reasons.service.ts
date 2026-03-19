import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  NdrReason,
  NdrReasonWriteInput,
} from '../../domain/entities/ndr-reason.entity';
import { NdrReasonRepository } from '../../domain/repositories/ndr-reason.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  normalizeCodeQuery,
  normalizeRequiredCode,
  normalizeRequiredText,
  normalizeTextQuery,
  parseBooleanQuery,
} from './masterdata-normalizers';

interface ListNdrReasonsQuery {
  code?: string;
  description?: string;
  isActive?: string;
  q?: string;
}

@Injectable()
export class NdrReasonsService {
  constructor(
    @Inject(NdrReasonRepository)
    private readonly ndrReasonRepository: NdrReasonRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
  ) {}

  list(query: ListNdrReasonsQuery = {}): Promise<NdrReason[]> {
    return this.ndrReasonRepository.list({
      code: normalizeCodeQuery(query.code, 'code'),
      description: normalizeTextQuery(query.description, 'description', 255),
      isActive: parseBooleanQuery(query.isActive, 'isActive'),
      q: normalizeTextQuery(query.q, 'q', 120),
    });
  }

  async getById(id: string): Promise<NdrReason> {
    const ndrReason = await this.ndrReasonRepository.findById(id);

    if (!ndrReason) {
      throw new NotFoundException(`NDR reason "${id}" was not found.`);
    }

    return ndrReason;
  }

  async create(input: NdrReasonWriteInput): Promise<NdrReason> {
    const normalizedInput = this.normalizeCreateInput(input);
    const existingReason = await this.ndrReasonRepository.findByCode(
      normalizedInput.code,
    );

    if (existingReason) {
      throw new ConflictException(
        `NDR reason code "${normalizedInput.code}" already exists.`,
      );
    }

    const ndrReason = await this.ndrReasonRepository.create(normalizedInput);

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
    const currentReason = await this.getById(id);
    const normalizedInput = this.normalizeUpdateInput(input);

    if (Object.keys(normalizedInput).length === 0) {
      return currentReason;
    }

    if (normalizedInput.code && normalizedInput.code !== currentReason.code) {
      const existingReason = await this.ndrReasonRepository.findByCode(
        normalizedInput.code,
      );

      if (existingReason) {
        throw new ConflictException(
          `NDR reason code "${normalizedInput.code}" already exists.`,
        );
      }
    }

    const ndrReason = await this.ndrReasonRepository.update(id, normalizedInput);

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

  private normalizeCreateInput(input: NdrReasonWriteInput): NdrReasonWriteInput {
    return {
      code: normalizeRequiredCode(input.code, 'code'),
      description: normalizeRequiredText(input.description, 'description', 255),
      isActive: this.normalizeIsActive(input.isActive, true),
    };
  }

  private normalizeUpdateInput(
    input: Partial<NdrReasonWriteInput>,
  ): Partial<NdrReasonWriteInput> {
    const normalizedInput: Partial<NdrReasonWriteInput> = {};

    if (input.code !== undefined) {
      normalizedInput.code = normalizeRequiredCode(input.code, 'code');
    }

    if (input.description !== undefined) {
      normalizedInput.description = normalizeRequiredText(
        input.description,
        'description',
        255,
      );
    }

    if (input.isActive !== undefined) {
      normalizedInput.isActive = this.normalizeIsActive(input.isActive, true);
    }

    return normalizedInput;
  }

  private normalizeIsActive(
    value: unknown,
    defaultValue: boolean,
  ): boolean {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean.');
    }

    return value;
  }
}
