import type {
  CustomerProfile,
  CustomerProfileListFilters,
  CustomerProfileWriteInput,
} from '../entities/customer-profile.entity';

export abstract class CustomerProfileRepository {
  abstract list(filters?: CustomerProfileListFilters): Promise<CustomerProfile[]>;

  abstract findById(id: string): Promise<CustomerProfile | null>;

  abstract findByUserId(userId: string): Promise<CustomerProfile | null>;

  abstract findByPhone(phone: string): Promise<CustomerProfile | null>;

  abstract create(input: CustomerProfileWriteInput): Promise<CustomerProfile>;

  abstract update(
    id: string,
    input: Partial<CustomerProfileWriteInput>,
  ): Promise<CustomerProfile>;

  abstract upsertByUserId(
    userId: string,
    input: CustomerProfileWriteInput,
  ): Promise<CustomerProfile>;

  abstract remove(id: string): Promise<boolean>;
}
