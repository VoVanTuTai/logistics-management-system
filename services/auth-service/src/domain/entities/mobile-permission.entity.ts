export const MOBILE_PERMISSION_ACTORS = ['OPS', 'COURIER'] as const;

export type MobilePermissionActor = typeof MOBILE_PERMISSION_ACTORS[number];

export const MOBILE_PERMISSION_FEATURES = [
  'scan.delivery-sign',
  'scan.return-sign',
  'scan.pickup',
  'scan.bag-seal',
  'scan.bag-unseal',
  'scan.delivery',
  'scan.issue',
  'scan.outbound',
  'scan.inbound',
  'scan.vehicle-inbound',
  'scan.vehicle-outbound',
  'scan.inventory-check',
  'scan.branch-pickup',
  'scan.high-value-label',
  'scan.high-value-check',
] as const;

export type MobilePermissionFeature = typeof MOBILE_PERMISSION_FEATURES[number];

export type MobilePermissionMap = Record<MobilePermissionFeature, boolean>;

export type MobilePermissionMatrix = Record<
  MobilePermissionActor,
  MobilePermissionMap
>;

export interface MobilePermissionProfile {
  id: string;
  actor: MobilePermissionActor;
  permissions: MobilePermissionMap;
  createdAt: Date;
  updatedAt: Date;
}

export interface MobilePermissionOverride {
  id: string;
  userId: string;
  permissions: MobilePermissionMap;
  createdAt: Date;
  updatedAt: Date;
}

export interface MobilePermissionMatrixUpdateInput {
  matrix?: Partial<Record<MobilePermissionActor, Partial<MobilePermissionMap>>>;
  OPS?: Partial<MobilePermissionMap>;
  COURIER?: Partial<MobilePermissionMap>;
}

export interface MobilePermissionUserOverrideInput {
  permissions?: Partial<MobilePermissionMap>;
}

export interface MobilePermissionEffectiveView {
  userId: string;
  actor: MobilePermissionActor;
  permissions: MobilePermissionMap;
  hasOverride: boolean;
}

export interface MobilePermissionUserOverrideView {
  userId: string;
  permissions: MobilePermissionMap;
}
