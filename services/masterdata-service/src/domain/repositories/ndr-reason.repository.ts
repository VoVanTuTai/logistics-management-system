import {
  NdrReason,
  NdrReasonListFilters,
  NdrReasonWriteInput,
} from '../entities/ndr-reason.entity';

export abstract class NdrReasonRepository {
  abstract list(filters?: NdrReasonListFilters): Promise<NdrReason[]>;
  abstract findById(id: string): Promise<NdrReason | null>;
  abstract findByCode(code: string): Promise<NdrReason | null>;
  abstract create(input: NdrReasonWriteInput): Promise<NdrReason>;
  abstract update(
    id: string,
    input: Partial<NdrReasonWriteInput>,
  ): Promise<NdrReason>;
}
