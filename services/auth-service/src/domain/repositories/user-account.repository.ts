import type { UserAccount } from '../entities/user-account.entity';

export abstract class UserAccountRepository {
  abstract findById(id: string): Promise<UserAccount | null>;

  abstract findByUsername(username: string): Promise<UserAccount | null>;
}
