export type OpsPermissionActor =
  | 'HQ_OPS'
  | 'REGIONAL_OPS'
  | 'PROVINCIAL_OPS'
  | 'HUB_OPS';

export type OpsPermissionFeature =
  | 'nav.hq-command-center'
  | 'nav.regional-flow-monitor'
  | 'nav.linehaul-fleet-control'
  | 'nav.sla-overdue-radar'
  | 'nav.operations-platform'
  | 'nav.branch-business'
  | 'nav.barcode-scan-hub'
  | 'nav.local-counter-create'
  | 'action.fast-track-return'
  | 'action.claim-compensate'
  | 'action.courier-dispatch'
  | 'action.inter-hub-transfer';

export type OpsPermissionCategory =
  | 'command'
  | 'linehaul'
  | 'branch'
  | 'dispatch'
  | 'claims';

export interface OpsPermissionFeatureDefinition {
  id: OpsPermissionFeature;
  label: string;
  category: OpsPermissionCategory;
  description: string;
  riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
}

export type OpsPermissionMatrix = Record<
  OpsPermissionActor,
  Record<OpsPermissionFeature, boolean>
>;

/** Per-feature permission map for a single user */
export type OpsUserPermissionMap = Record<OpsPermissionFeature, boolean>;

/** All per-user overrides keyed by userId */
export type OpsUserPermissionOverrides = Record<string, OpsUserPermissionMap>;

export const OPS_PERMISSION_STORAGE_KEY = 'nexus.ops-permission-matrix';
export const OPS_USER_OVERRIDE_STORAGE_KEY = 'nexus.ops-permission-overrides';

export const OPS_PERMISSION_ACTORS: Array<{
  id: OpsPermissionActor;
  label: string;
  badgeLabel: string;
  badgeColor: string;
  description: string;
}> = [
  {
    id: 'HQ_OPS',
    label: 'Ban Giám Đốc HQ (Toàn quốc)',
    badgeLabel: 'HQ MASTER',
    badgeColor: '#0284c7',
    description: 'Chỉ huy vĩ mô toàn hệ thống, kiểm soát hạm đội liên miền và cấu hình toàn quốc.',
  },
  {
    id: 'REGIONAL_OPS',
    label: 'Điều Phối Khu Vực (3 Miền)',
    badgeLabel: 'MIỀN (ZONE)',
    badgeColor: '#7c3aed',
    description: 'Điều phối xe tải đường trục, cân bằng tải trọng và luân chuyển hàng giữa các tỉnh.',
  },
  {
    id: 'PROVINCIAL_OPS',
    label: 'Quản Lý Tỉnh / Chi Nhánh',
    badgeLabel: 'CHI NHÁNH TỈNH',
    badgeColor: '#ea580c',
    description: 'Quản lý toàn tỉnh, kế thừa toàn bộ quyền của các bưu cục trực thuộc và duyệt bồi thường.',
  },
  {
    id: 'HUB_OPS',
    label: 'Bưu Cục Cơ Sở (Xã / Phường)',
    badgeLabel: 'BƯU CỤC',
    badgeColor: '#10b981',
    description: 'Tác nghiệp quầy, quét nhận/xuất bưu gửi, đóng bao seal và chia tuyến phát cho Shipper.',
  },
];

export const OPS_PERMISSION_CATEGORIES: Record<OpsPermissionCategory, string> = {
  command: 'Chỉ huy & Điều hành vĩ mô',
  linehaul: 'Vận tải đường trục & Xe tải',
  branch: 'Tác nghiệp Quầy & Bưu cục',
  dispatch: 'Điều phối & Chia tuyến Shipper',
  claims: 'Khiếu nại & Bồi thường chi nhánh',
};

export const OPS_PERMISSION_FEATURES: OpsPermissionFeatureDefinition[] = [
  // 1. Chỉ huy vĩ mô
  {
    id: 'nav.hq-command-center',
    label: 'Trung tâm chỉ huy HQ Ops',
    category: 'command',
    description: 'Bảng điều khiển chỉ huy cấp cao vĩ mô toàn quốc và radar điều hành.',
    riskLevel: 'Cao',
  },
  {
    id: 'nav.sla-overdue-radar',
    label: 'Radar cảnh báo trễ hạn SLA',
    category: 'command',
    description: 'Giám sát thời gian thực các đơn hàng có nguy cơ trễ hạn cam kết.',
    riskLevel: 'Trung bình',
  },

  // 2. Vận tải đường trục
  {
    id: 'nav.regional-flow-monitor',
    label: 'Giám sát luồng luân chuyển 3 miền',
    category: 'linehaul',
    description: 'Theo dõi luồng hàng Bắc - Trung - Nam và các điểm nghẽn trung chuyển.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'nav.linehaul-fleet-control',
    label: 'Quản lý hạm đội xe tải liên tỉnh',
    category: 'linehaul',
    description: 'Điều xe tải đường trục, niêm phong seal xe và theo dõi hành trình GPS.',
    riskLevel: 'Cao',
  },

  // 3. Tác nghiệp bưu cục & quầy
  {
    id: 'nav.operations-platform',
    label: 'Nền tảng tác nghiệp điều hành',
    category: 'branch',
    description: 'Truy cập vào các phân hệ giám sát bưu gửi và dữ liệu khai thác kho.',
    riskLevel: 'Thấp',
  },
  {
    id: 'nav.branch-business',
    label: 'Nghiệp vụ quầy bưu cục',
    category: 'branch',
    description: 'Tiếp nhận khách vãng lai, tra cứu cước và đối soát doanh thu ca tại quầy.',
    riskLevel: 'Thấp',
  },
  {
    id: 'nav.barcode-scan-hub',
    label: 'Trung tâm quét mã vạch bưu gửi',
    category: 'branch',
    description: 'Quét nhận hàng, xuất kho, nhập kho, kiểm kê và đóng/gỡ bao seal.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'nav.local-counter-create',
    label: 'Tạo đơn tại quầy bưu cục',
    category: 'branch',
    description: 'Nhập thông tin bưu gửi, cân đo và in phiếu gửi bưu cục cho người gửi.',
    riskLevel: 'Trung bình',
  },

  // 4. Điều phối & Chia tuyến
  {
    id: 'action.courier-dispatch',
    label: 'Chia tuyến & Điều phối Shipper',
    category: 'dispatch',
    description: 'Phân bổ danh sách đơn giao và đơn lấy cho Courier theo khu vực phụ trách.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'action.inter-hub-transfer',
    label: 'Lệnh điều chuyển liên bưu cục',
    category: 'dispatch',
    description: 'Tạo biên bản và điều chuyển các kiện hàng nhầm tuyến giữa các bưu cục.',
    riskLevel: 'Cao',
  },

  // 5. Khiếu nại & Bồi thường
  {
    id: 'action.fast-track-return',
    label: 'Duyệt chuyển hoàn nhanh',
    category: 'claims',
    description: 'Phê duyệt trả hàng ngay tại bưu cục khi giao thất bại hoặc người gửi yêu cầu.',
    riskLevel: 'Cao',
  },
  {
    id: 'action.claim-compensate',
    label: 'Phê duyệt bồi thường chi nhánh',
    category: 'claims',
    description: 'Thẩm định hồ sơ sự cố vỡ hỏng/thất lạc và duyệt hạn mức bồi thường cho khách.',
    riskLevel: 'Cao',
  },
];

/**
 * Ma trận phân quyền chuẩn mực theo cấp bậc kế thừa (Hierarchical Permission Matrix):
 * - Cấp HQ: Toàn quyền toàn bộ tính năng.
 * - Cấp Miền: Có quyền liên miền, xe đường trục, radar SLA và điều chuyển.
 * - Cấp Tỉnh: KẾ THỪA 100% QUYỀN CỦA BƯU CỤC + có thêm quyền duyệt bồi thường, điều chuyển bưu cục, hoàn nhanh.
 * - Cấp Bưu cục: Quyền tại quầy, quét bưu gửi, chia tuyến shipper.
 */
export const DEFAULT_OPS_PERMISSION_MATRIX: OpsPermissionMatrix = {
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
    // Kế thừa toàn bộ quyền của Bưu cục con:
    'nav.branch-business': true,
    'nav.barcode-scan-hub': true,
    'nav.local-counter-create': true,
    'action.courier-dispatch': true,
    // Thêm đặc quyền cấp Tỉnh:
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
    // Quyền cơ sở tại bưu cục:
    'nav.branch-business': true,
    'nav.barcode-scan-hub': true,
    'nav.local-counter-create': true,
    'action.courier-dispatch': true,
    // Các quyền rủi ro cao mặc định là false, nhưng Admin CÓ THỂ BẬT TÙY CHỈNH THEO USER:
    'action.fast-track-return': false,
    'action.claim-compensate': false,
    'action.inter-hub-transfer': false,
  },
};

export function createDefaultOpsUserPermissionMap(): OpsUserPermissionMap {
  const map: Partial<OpsUserPermissionMap> = {};
  for (const feature of OPS_PERMISSION_FEATURES) {
    map[feature.id] = false;
  }
  return map as OpsUserPermissionMap;
}

export function normalizeOpsPermissionMatrix(raw: unknown): OpsPermissionMatrix {
  const result = { ...DEFAULT_OPS_PERMISSION_MATRIX };
  if (!raw || typeof raw !== 'object') return result;

  const src = raw as Record<string, unknown>;
  for (const actor of ['HQ_OPS', 'REGIONAL_OPS', 'PROVINCIAL_OPS', 'HUB_OPS'] as const) {
    if (src[actor] && typeof src[actor] === 'object') {
      const actorSrc = src[actor] as Record<string, unknown>;
      result[actor] = { ...DEFAULT_OPS_PERMISSION_MATRIX[actor] };
      for (const feature of OPS_PERMISSION_FEATURES) {
        if (typeof actorSrc[feature.id] === 'boolean') {
          result[actor][feature.id] = actorSrc[feature.id] as boolean;
        }
      }
    }
  }
  return result;
}

export function normalizeOpsUserPermissionMap(raw: unknown): OpsUserPermissionMap {
  const map = createDefaultOpsUserPermissionMap();
  if (!raw || typeof raw !== 'object') return map;
  const src = raw as Record<string, unknown>;
  for (const feature of OPS_PERMISSION_FEATURES) {
    if (typeof src[feature.id] === 'boolean') {
      map[feature.id] = src[feature.id] as boolean;
    }
  }
  return map;
}

export function loadGlobalOpsMatrix(): OpsPermissionMatrix {
  try {
    const raw = window.localStorage.getItem(OPS_PERMISSION_STORAGE_KEY);
    if (!raw) return normalizeOpsPermissionMatrix(DEFAULT_OPS_PERMISSION_MATRIX);
    return normalizeOpsPermissionMatrix(JSON.parse(raw));
  } catch {
    return normalizeOpsPermissionMatrix(DEFAULT_OPS_PERMISSION_MATRIX);
  }
}

export function saveGlobalOpsMatrix(matrix: OpsPermissionMatrix): void {
  try {
    window.localStorage.setItem(OPS_PERMISSION_STORAGE_KEY, JSON.stringify(matrix, null, 2));
  } catch (err) {
    console.warn('[OpsPermissionMatrix] Failed to save matrix to localStorage:', err);
  }
}

export function loadOpsUserPermissionOverrides(): OpsUserPermissionOverrides {
  try {
    const raw = window.localStorage.getItem(OPS_USER_OVERRIDE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const res: OpsUserPermissionOverrides = {};
    for (const [userId, perms] of Object.entries(parsed)) {
      if (perms && typeof perms === 'object') {
        res[userId] = normalizeOpsUserPermissionMap(perms);
      }
    }
    return res;
  } catch {
    return {};
  }
}

export function saveOpsUserPermissionOverride(
  userId: string,
  permissions: OpsUserPermissionMap | null,
): void {
  try {
    const all = loadOpsUserPermissionOverrides();
    if (!permissions) {
      delete all[userId];
    } else {
      all[userId] = permissions;
    }
    window.localStorage.setItem(OPS_USER_OVERRIDE_STORAGE_KEY, JSON.stringify(all, null, 2));
  } catch (err) {
    console.warn('[OpsPermissionMatrix] Failed to save override for user:', userId, err);
  }
}

export function countOpsActorEnabledPermissions(
  matrix: OpsPermissionMatrix,
  actor: OpsPermissionActor,
): number {
  return OPS_PERMISSION_FEATURES.filter((f) => matrix[actor]?.[f.id] === true).length;
}

export function countOpsUserEnabledPermissions(userMap: OpsUserPermissionMap): number {
  return OPS_PERMISSION_FEATURES.filter((f) => userMap[f.id] === true).length;
}
