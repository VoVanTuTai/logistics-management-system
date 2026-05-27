import type {
  CompleteReturnCaseInput,
  CreateReturnCaseInput,
  ListReturnCasesFilter,
  ReturnCase,
} from '../entities/return-case.entity';

export abstract class ReturnCaseRepository {
  abstract list(filter?: ListReturnCasesFilter): Promise<ReturnCase[]>;

  abstract findById(id: string): Promise<ReturnCase | null>;

  abstract findByNdrCaseId(ndrCaseId: string): Promise<ReturnCase | null>;

  abstract findByShipmentCode(shipmentCode: string): Promise<ReturnCase | null>;

  abstract create(input: CreateReturnCaseInput): Promise<ReturnCase>;

  abstract complete(
    id: string,
    input: CompleteReturnCaseInput,
  ): Promise<ReturnCase>;
}
