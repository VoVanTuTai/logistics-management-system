import type { AuthenticatedUserDto } from '../auth/auth.types';

export type CourierActor = 'OPS' | 'COURIER';

export type CourierPermissionFeature =
  | 'scan.delivery-sign'
  | 'scan.return-sign'
  | 'scan.pickup'
  | 'scan.bag-seal'
  | 'scan.bag-unseal'
  | 'scan.delivery'
  | 'scan.issue'
  | 'scan.outbound'
  | 'scan.inbound'
  | 'scan.vehicle-inbound'
  | 'scan.vehicle-outbound'
  | 'scan.inventory-check'
  | 'scan.branch-pickup'
  | 'scan.high-value-label'
  | 'scan.high-value-check';

export function resolveCourierActor(
  user: Pick<AuthenticatedUserDto, 'roles'> | null | undefined,
): CourierActor {
  const roles = new Set((user?.roles ?? []).map((role) => role.toUpperCase()));

  if (
    roles.has('OPS') ||
    roles.has('OPS_STAFF') ||
    roles.has('OPS_MANAGER') ||
    roles.has('ADMIN') ||
    roles.has('SYSTEM_ADMIN')
  ) {
    return 'OPS';
  }

  return 'COURIER';
}

export function canAccessCourierFeature(
  user:
    | Pick<AuthenticatedUserDto, 'roles' | 'mobilePermissions'>
    | null
    | undefined,
  feature: CourierPermissionFeature,
): boolean {
  return user?.mobilePermissions?.[feature] === true;
}

export function filterPermittedCourierFeatures<TItem extends { permission: CourierPermissionFeature }>(
  user:
    | Pick<AuthenticatedUserDto, 'roles' | 'mobilePermissions'>
    | null
    | undefined,
  items: TItem[],
): TItem[] {
  return items.filter((item) => canAccessCourierFeature(user, item.permission));
}
