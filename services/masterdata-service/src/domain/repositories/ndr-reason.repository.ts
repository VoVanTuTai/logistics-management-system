import { NdrReason, NdrReasonWriteInput } from '../entities/ndr-reason.entity';

export abstract class NdrReasonRepository {
  abstract list(): Promise<NdrReason[]>;
  abstract findById(id: string): Promise<NdrReason | null>;
  abstract create(input: NdrReasonWriteInput): Promise<NdrReason>;
  abstract update(
    id: string,
    input: Partial<NdrReasonWriteInput>,
  ): Promise<NdrReason>;
}
