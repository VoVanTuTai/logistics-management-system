import type {
  ApproveChangeRequestInput,
  ChangeRequest,
  CreateChangeRequestInput,
} from '../entities/change-request.entity';

export abstract class ChangeRequestRepository {
  abstract list(): Promise<ChangeRequest[]>;
  abstract findById(id: string): Promise<ChangeRequest | null>;
  abstract create(input: CreateChangeRequestInput): Promise<ChangeRequest>;
  abstract approve(
    id: string,
    input: ApproveChangeRequestInput,
  ): Promise<ChangeRequest>;
}
