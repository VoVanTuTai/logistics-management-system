import type { AuthSessionDto } from './auth.types';

export const ADMIN_ROLES = ['SYSTEM_ADMIN', 'SYS_ADMIN'] as const;

export function hasAdminRole(session: AuthSessionDto | null | undefined): boolean {
  if (!session) {
    return false;
  }

  return session.user.roles.some((role) => ADMIN_ROLES.includes(role as never));
}
