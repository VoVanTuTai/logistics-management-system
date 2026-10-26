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
  | 'action.fast-track-return'    // Fast-track Instant Return Approval during Sale
  | 'action.claim-compensate'     // Claim compensation approval
  | 'action.courier-dispatch'     // Courier dispatch assignment
  | 'action.inter-hub-transfer';  // Inter-hub transfer order

export const OPS_PERMISSION_STORAGE_KEY = 'nexus.ops-permission-matrix';
export const OPS_USER_OVERRIDE_STORAGE_KEY = 'nexus.ops-permission-overrides';

export const OPS_PERMISSION_MATRIX: Record<OpsActor, Record<OpsFeatureKey, boolean>> = {
  HQ_OPS: {
    'nav.hq-command-center': true,
    'nav.regional-flow-monitor': true,
    'nav.linehaul-fleet-control': true,
    'nav.sla-overdue-radar': true,
    'nav.operations-platform': true,
    'nav.branch-business': true,
    'nav.barcode-scan-hub': true,
    'nav.local-counter-create': true,
    'action.fast-track-return': true,
    'action.claim-compensate': true,
    'action.courier-dispatch': true,
    'action.inter-hub-transfer': true,
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
    'action.claim-compensate': true,
    'action.courier-dispatch': false,
    'action.inter-hub-transfer': true,
  },
  PROVINCIAL_OPS: {
    'nav.hq-command-center': false,
    'nav.regional-flow-monitor': false,
    'nav.linehaul-fleet-control': false,
    'nav.sla-overdue-radar': false,
    'nav.operations-platform': true,
    // Kế thừa 100% quyền của các bưu cục con:
    'nav.branch-business': true,
    'nav.barcode-scan-hub': true,
    'nav.local-counter-create': true,
    'action.courier-dispatch': true,
    // Quyền cấp Tỉnh:
    'action.fast-track-return': true,
    'action.claim-compensate': true,
    'action.inter-hub-transfer': true,
  },
  HUB_OPS: {
    'nav.hq-command-center': false,
    'nav.regional-flow-monitor': false,
    'nav.linehaul-fleet-control': false,
    'nav.sla-overdue-radar': false,
    'nav.operations-platform': true,
    // Nghiệp vụ cơ sở tại bưu cục:
    'nav.branch-business': true,
    'nav.barcode-scan-hub': true,
    'nav.local-counter-create': true,
    'action.courier-dispatch': true,
    // Mặc định false (có thể tuỳ chỉnh theo tài khoản):
    'action.fast-track-return': false,
    'action.claim-compensate': false,
    'action.inter-hub-transfer': false,
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
  actorOrUser:
    | OpsActor
    | { id?: string; username?: string | null; roles?: string[]; hubCodes?: string[] }
    | null
    | undefined,
  feature: OpsFeatureKey,
): boolean {
  if (!actorOrUser) {
    return false;
  }

  // 1. Kiểm tra cấu hình tuỳ chỉnh riêng theo tài khoản (Per-Account Custom Override)
  if (typeof actorOrUser !== 'string' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(OPS_USER_OVERRIDE_STORAGE_KEY);
      if (raw) {
        const overrides = JSON.parse(raw) as Record<string, Record<string, boolean>>;
        const userObj = actorOrUser as { id?: string; username?: string | null };
        const key = userObj.id || userObj.username;
        if (key && overrides[key] && typeof overrides[key][feature] === 'boolean') {
          return overrides[key][feature];
        }
      }
    } catch {
      // Bỏ qua lỗi parse, fallback về ma trận vai trò
    }
  }

  // 2. Xác định vai trò chuẩn của tài khoản
  let actor: OpsActor;
  if (typeof actorOrUser === 'string') {
    actor = actorOrUser;
  } else {
    actor = resolveOpsActor(actorOrUser.username, actorOrUser.roles ?? [], actorOrUser.hubCodes ?? []);
  }

  // 3. Kiểm tra ma trận phân quyền chung được Admin cập nhật
  if (typeof window !== 'undefined') {
    try {
      const rawMatrix = window.localStorage.getItem(OPS_PERMISSION_STORAGE_KEY);
      if (rawMatrix) {
        const matrix = JSON.parse(rawMatrix) as Record<string, Record<string, boolean>>;
        if (matrix[actor] && typeof matrix[actor][feature] === 'boolean') {
          return matrix[actor][feature];
        }
      }
    } catch {
      // fallback
    }
  }

  // 4. Fallback về ma trận phân cấp mặc định
  return OPS_PERMISSION_MATRIX[actor]?.[feature] === true;
}
