import type {
  UserAccount,
  UserAccountCreateInput,
  UserAccountListFilters,
  UserAccountUpdateInput,
} from '../entities/user-account.entity';

export abstract class UserAccountRepository {
  abstract list(filters?: UserAccountListFilters): Promise<UserAccount[]>;

  abstract findById(id: string): Promise<UserAccount | null>;

  abstract findByUsername(username: string): Promise<UserAccount | null>;

  abstract create(input: UserAccountCreateInput): Promise<UserAccount>;

  abstract update(id: string, input: UserAccountUpdateInput): Promise<UserAccount>;

  abstract delete(id: string): Promise<boolean>;
}
