import type {
  CreateNdrCaseInput,
  NdrCase,
  RescheduleNdrCaseInput,
} from '../entities/ndr-case.entity';

export abstract class NdrCaseRepository {
  abstract findById(id: string): Promise<NdrCase | null>;

  abstract create(input: CreateNdrCaseInput): Promise<NdrCase>;

  abstract reschedule(
    id: string,
    input: RescheduleNdrCaseInput,
  ): Promise<NdrCase>;
}
