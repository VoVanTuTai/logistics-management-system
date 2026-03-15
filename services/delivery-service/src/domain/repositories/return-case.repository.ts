import type {
  CompleteReturnCaseInput,
  CreateReturnCaseInput,
  ReturnCase,
} from '../entities/return-case.entity';

export abstract class ReturnCaseRepository {
  abstract findById(id: string): Promise<ReturnCase | null>;

  abstract create(input: CreateReturnCaseInput): Promise<ReturnCase>;

  abstract complete(
    id: string,
    input: CompleteReturnCaseInput,
  ): Promise<ReturnCase>;
}
