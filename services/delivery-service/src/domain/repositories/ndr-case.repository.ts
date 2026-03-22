import type {
  CreateNdrCaseInput,
  ListNdrCasesFilter,
  NdrCase,
  NdrCaseStatus,
  RescheduleNdrCaseInput,
} from '../entities/ndr-case.entity';

export abstract class NdrCaseRepository {
  abstract list(filter?: ListNdrCasesFilter): Promise<NdrCase[]>;

  abstract findById(id: string): Promise<NdrCase | null>;

  abstract create(input: CreateNdrCaseInput): Promise<NdrCase>;

  abstract reschedule(
    id: string,
    input: RescheduleNdrCaseInput,
  ): Promise<NdrCase>;

  abstract markReturnRequested(
    id: string,
    input: { note?: string | null },
  ): Promise<NdrCase>;

  abstract isValidStatus(value: string): value is NdrCaseStatus;
}
