import type { AuthenticatedUserDto } from '../auth/auth.types';
import { appEnv } from '../../utils/env';

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

const COURIER_PERMISSION_MATRIX: Record<
  CourierActor,
  Record<CourierPermissionFeature, boolean>
> = {
  OPS: {
    'scan.delivery-sign': true,
    'scan.return-sign': true,
    'scan.pickup': true,
    'scan.bag-seal': true,
    'scan.bag-unseal': true,
    'scan.delivery': false,
    'scan.issue': true,
    'scan.outbound': true,
    'scan.inbound': true,
    'scan.vehicle-inbound': true,
    'scan.vehicle-outbound': true,
    'scan.inventory-check': true,
    'scan.branch-pickup': true,
    'scan.high-value-label': true,
    'scan.high-value-check': true,
  },
  COURIER: {
    'scan.delivery-sign': true,
    'scan.return-sign': true,
    'scan.pickup': true,
    'scan.bag-seal': true,
    'scan.bag-unseal': true,
    'scan.delivery': true,
    'scan.issue': true,
    'scan.outbound': true,
    'scan.inbound': true,
    'scan.vehicle-inbound': true,
    'scan.vehicle-outbound': true,
    'scan.inventory-check': true,
    'scan.branch-pickup': true,
    'scan.high-value-label': true,
    'scan.high-value-check': true,
  },
};

export function resolveCourierActor(
  user:
    | Pick<AuthenticatedUserDto, 'roles' | 'mobilePermissionActor'>
    | null
    | undefined,
): CourierActor {
  if (user?.mobilePermissionActor === 'OPS' || user?.mobilePermissionActor === 'COURIER') {
    return user.mobilePermissionActor;
  }

  const roles = new Set((user?.roles ?? []).map((role) => role.toUpperCase()));

  if (
    roles.has('OPS') ||
    roles.has('OPS_ADMIN') ||
    roles.has('OPS_VIEWER') ||
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
    | Pick<AuthenticatedUserDto, 'roles' | 'mobilePermissionActor' | 'mobilePermissions'>
    | null
    | undefined,
  feature: CourierPermissionFeature,
): boolean {
  if (appEnv.allowAllCourierMobilePermissionsForTesting) {
    return true;
  }

  const effectivePermission = user?.mobilePermissions?.[feature];
  if (typeof effectivePermission === 'boolean') {
    return effectivePermission;
  }

  const actor = resolveCourierActor(user);
  return COURIER_PERMISSION_MATRIX[actor][feature] === true;
}

export function filterPermittedCourierFeatures<TItem extends { permission: CourierPermissionFeature }>(
  user:
    | Pick<AuthenticatedUserDto, 'roles' | 'mobilePermissionActor' | 'mobilePermissions'>
    | null
    | undefined,
  items: TItem[],
): TItem[] {
  return items.filter((item) => canAccessCourierFeature(user, item.permission));
}
