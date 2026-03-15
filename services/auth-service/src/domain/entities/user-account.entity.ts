export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  status: UserStatus;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  roles: string[];
}
