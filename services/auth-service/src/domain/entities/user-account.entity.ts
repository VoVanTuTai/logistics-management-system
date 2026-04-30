export type UserStatus = 'ACTIVE' | 'DISABLED';
export type UserRoleGroup = 'OPS' | 'SHIPPER';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  status: UserStatus;
  roles: string[];
  displayName: string | null;
  phone: string | null;
  hubCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string | null;
  roles: string[];
  hubCodes: string[];
}

export interface UserAccountListFilters {
  roleGroup?: UserRoleGroup;
  status?: UserStatus;
  hubCode?: string;
  q?: string;
}

export interface UserAccountCreateInput {
  id: string;
  username: string;
  passwordHash: string;
  status: UserStatus;
  roles: string[];
  displayName?: string | null;
  phone?: string | null;
  hubCodes?: string[];
}

export interface UserAccountUpdateInput {
  username?: string;
  passwordHash?: string;
  status?: UserStatus;
  roles?: string[];
  displayName?: string | null;
  phone?: string | null;
  hubCodes?: string[];
}

export interface UserAccountView {
  id: string;
  username: string;
  status: UserStatus;
  roles: string[];
  displayName: string | null;
  phone: string | null;
  hubCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  username: string;
  password?: string;
  roles: string[];
  status?: UserStatus;
  displayName?: string | null;
  phone?: string | null;
  hubCodes?: string[];
}

export interface UserUpdateInput {
  username?: string;
  password?: string;
  roles?: string[];
  status?: UserStatus;
  displayName?: string | null;
  phone?: string | null;
  hubCodes?: string[];
}
