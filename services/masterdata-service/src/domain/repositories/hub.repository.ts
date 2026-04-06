import {
  Hub,
  HubCreateInput,
  HubListFilters,
  HubWriteInput,
} from '../entities/hub.entity';

export abstract class HubRepository {
  abstract list(filters?: HubListFilters): Promise<Hub[]>;
  abstract findById(id: string): Promise<Hub | null>;
  abstract findByCode(code: string): Promise<Hub | null>;
  abstract create(input: HubCreateInput): Promise<Hub>;
  abstract update(id: string, input: Partial<HubWriteInput>): Promise<Hub>;
  abstract delete(id: string): Promise<boolean>;
}
