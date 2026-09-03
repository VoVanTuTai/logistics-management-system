export type OpsActor = 'HQ_OPS' | 'REGIONAL_OPS' | 'PROVINCIAL_OPS' | 'HUB_OPS';

export type OpsFeatureKey =
  | 'nav.hq-command-center'       // Macro Command Center (/app/hq-ops)
  | 'nav.regional-flow-monitor'   // 3-Region Flow & Bottlenecks
  | 'nav.linehaul-fleet-control'  // Inter-region Linehaul Fleet
  | 'nav.sla-overdue-radar'       // System-wide SLA Radar
  | 'nav.operations-platform'     // Operations Platform Section
  | 'nav.branch-business'         // Local Counter Order & Branch Business
  | 'nav.barcode-scan-hub'        // Local Hub Barcode Scanner Operations
  | 'nav.local-counter-create'    // Local Counter Order Creation Form
  | 'action.fast-track-return';   // Fast-track Instant Return Approval during Sale

const OPS_PERMISSION_MATRIX: Record<OpsActor, Record<OpsFeatureKey, boolean>> = {
  HQ_OPS: {
    'nav.hq-command-center': true,
    'nav.regional-flow-monitor': true,
    'nav.linehaul-fleet-control': true,
    'nav.sla-overdue-radar': true,
    'nav.operations-platform': true,
    'nav.branch-business': false,
    'nav.barcode-scan-hub': false,
    'nav.local-counter-create': false,
    'action.fast-track-return': true,
  },
  REGIONAL_OPS: {
    'nav.hq-command-center': false,
    'nav.regional-flow-monitor': true,
    'nav.linehaul-fleet-control': true,
    'nav.sla-overdue-radar': true,
    'nav.operations-platform': true,
    'nav.branch-business': false,
    'nav.barcode-scan-hub': false,
    'nav.local-counter-create': false,
    'action.fast-track-return': true,
  },
  PROVINCIAL_OPS: {
    'nav.hq-command-center': false,
    'nav.regional-flow-monitor': false,
    'nav.linehaul-fleet-control': false,
    'nav.sla-overdue-radar': false,
    'nav.operations-platform': true,
    'nav.branch-business': true, // Đảm nhiệm phường sở tại
    'nav.barcode-scan-hub': true,
    'nav.local-counter-create': true,
    'action.fast-track-return': true, // Có quyền duyệt trả hàng cấp tỉnh
  },
  HUB_OPS: {
    'nav.hq-command-center': false,
    'nav.regional-flow-monitor': false,
    'nav.linehaul-fleet-control': false,
    'nav.sla-overdue-radar': false,
    'nav.operations-platform': true,
    'nav.branch-business': true,
    'nav.barcode-scan-hub': true,
    'nav.local-counter-create': true,
    'action.fast-track-return': false,
  },
};

export function resolveOpsActor(
  username?: string | null,
  roles: string[] = [],
  hubCodes: string[] = [],
): OpsActor {
  const normUsername = (username ?? '').trim();
  if (
    normUsername === '20000000' ||
    normUsername === '10000001' ||
    roles.includes('HQ_OPS') ||
    roles.includes('HQ_MANAGER') ||
    roles.includes('SYSTEM_ADMIN')
  ) {
    return 'HQ_OPS';
  }

  // Cấp miền: 20000001 - 20000006
  if (
    (normUsername >= '20000001' && normUsername <= '20000006') ||
    (roles.includes('OPS_ADMIN') && !normUsername.startsWith('20001') && normUsername < '20000007')
  ) {
    return 'REGIONAL_OPS';
  }

  // Cấp tỉnh: 20000007 - 20000069 hoặc role PROVINCIAL_OPS hoặc có chữ B trong hub code
  if (
    roles.includes('PROVINCIAL_OPS') ||
    (normUsername >= '20000007' && normUsername <= '20000069') ||
    hubCodes.some((h) => h.includes('B'))
  ) {
    return 'PROVINCIAL_OPS';
  }

  // Cấp xã / phường (bưu cục cơ sở)
  return 'HUB_OPS';
}

export function canAccessOpsFeature(
  actorOrUser: OpsActor | { username?: string | null; roles?: string[]; hubCodes?: string[] } | null | undefined,
  feature: OpsFeatureKey,
): boolean {
  if (!actorOrUser) {
    return false;
  }

  let actor: OpsActor;
  if (typeof actorOrUser === 'string') {
    actor = actorOrUser;
  } else {
    actor = resolveOpsActor(actorOrUser.username, actorOrUser.roles ?? [], actorOrUser.hubCodes ?? []);
  }

  return OPS_PERMISSION_MATRIX[actor]?.[feature] === true;
}

