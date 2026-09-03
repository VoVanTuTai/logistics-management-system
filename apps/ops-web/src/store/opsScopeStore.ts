import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ScopeLevel =
  | 'NATIONWIDE'
  | 'REGION_NORTH'
  | 'REGION_CENTRAL'
  | 'REGION_SOUTH'
  | 'PROVINCE'
  | 'HUB';

export type OpsTier = 'HQ' | 'REGION' | 'PROVINCE' | 'WARD';

export interface OpsTierMeta {
  tier: OpsTier;
  label: string;
  badgeLabel: string;
  badgeColor: string;
  icon: string;
  description: string;
}

export interface ScopeOption {
  key: ScopeLevel;
  label: string;
  badge: string;
  icon: string;
}

export const SCOPE_OPTIONS: ScopeOption[] = [
  {
    key: 'NATIONWIDE',
    label: 'Toàn Quốc (HQ Ops)',
    badge: 'HQ MASTER',
    icon: 'public',
  },
  {
    key: 'REGION_NORTH',
    label: 'Khu Vực Miền Bắc (Zone 1)',
    badge: 'MIỀN BẮC',
    icon: 'map',
  },
  {
    key: 'REGION_CENTRAL',
    label: 'Khu Vực Miền Trung (Zone 2)',
    badge: 'MIỀN TRUNG',
    icon: 'map',
  },
  {
    key: 'REGION_SOUTH',
    label: 'Khu Vực Miền Nam (Zone 3)',
    badge: 'MIỀN NAM',
    icon: 'map',
  },
  {
    key: 'PROVINCE',
    label: 'Khu Vực Toàn Tỉnh / Thành Phố',
    badge: 'TỈNH / TP',
    icon: 'location_city',
  },
  {
    key: 'HUB',
    label: 'Bưu Cục Cơ Sở (Xã / Phường)',
    badge: 'BƯU CỤC',
    icon: 'hub',
  },
];

export function resolveOpsTier(
  username?: string | null,
  roles: string[] = [],
  hubCodes: string[] = [],
): OpsTierMeta {
  const normUsername = (username ?? '').trim();

  // 1. HQ Level 0
  const isHqMaster =
    normUsername === '20000000' ||
    normUsername === '10000001' ||
    roles.includes('SYSTEM_ADMIN') ||
    roles.includes('HQ_OPS') ||
    roles.includes('HQ_MANAGER');

  if (isHqMaster) {
    return {
      tier: 'HQ',
      label: 'HQ Toàn Hệ Thống',
      badgeLabel: 'HQ MASTER',
      badgeColor: '#0284c7',
      icon: 'public',
      description: 'Giám sát vĩ mô toàn mạng lưới, radar SLA và hạm đội liên miền',
    };
  }

  // 2. Regional Level 1
  const isNorth =
    normUsername === '20000001' ||
    normUsername === '20000004' ||
    hubCodes.some((h) => h.includes('001') || h.includes('HN') || h.includes('HAN'));
  const isCentral =
    normUsername === '20000002' ||
    normUsername === '20000005' ||
    hubCodes.some((h) => h.includes('002') || h.includes('DN') || h.includes('DAN'));
  const isSouth =
    normUsername === '20000003' ||
    normUsername === '20000006' ||
    hubCodes.some((h) => h.includes('003') || h.includes('HCM'));

  const isRegional =
    normUsername >= '20000001' && normUsername <= '20000006';

  if (isRegional || (roles.includes('OPS_ADMIN') && (isNorth || isCentral || isSouth))) {
    const regionName = isNorth ? 'Miền Bắc' : isCentral ? 'Miền Trung' : 'Miền Nam';
    return {
      tier: 'REGION',
      label: `OPS Miền (${regionName})`,
      badgeLabel: `MIỀN ${regionName.toUpperCase()}`,
      badgeColor: '#7c3aed',
      icon: 'map',
      description: 'Tổng hợp sản lượng, tải trọng miền để trung chuyển liên miền',
    };
  }

  // 3. Provincial Level 2 (Bưu cục Tỉnh - Level 2)
  const isProvincial =
    roles.includes('PROVINCIAL_OPS') ||
    (normUsername >= '20000007' && normUsername <= '20000069') ||
    hubCodes.some((h) => h.includes('B'));

  if (isProvincial) {
    return {
      tier: 'PROVINCE',
      label: 'OPS Tỉnh / Thành Phố',
      badgeLabel: 'KHO TỈNH / TP',
      badgeColor: '#ea580c',
      icon: 'location_city',
      description: 'Thống kê toàn tỉnh, kiêm nhiệm bưu cục phường sở tại và chia tuyến Courier',
    };
  }

  // 4. Ward Level 3 (Bưu cục phường / xã)
  return {
    tier: 'WARD',
    label: 'OPS Xã / Phường (Bưu Cục)',
    badgeLabel: 'BƯU CỤC PHƯỜNG',
    badgeColor: '#10b981',
    icon: 'store',
    description: 'Khai thác bưu cục, tác nghiệp quầy và chia tuyến cho Courier',
  };
}

export function resolveAllowedScopes(
  username?: string | null,
  roles: string[] = [],
  hubCodes: string[] = [],
): ScopeOption[] {
  const meta = resolveOpsTier(username, roles, hubCodes);
  const normUsername = (username ?? '').trim();

  // 1. HQ -> Toàn quyền tất cả
  if (meta.tier === 'HQ') {
    return SCOPE_OPTIONS;
  }

  // 2. Miền -> Chọn miền tương ứng + Tỉnh + Hub trong miền
  if (meta.tier === 'REGION') {
    const isNorth =
      normUsername === '20000001' ||
      normUsername === '20000004' ||
      hubCodes.some((h) => h.includes('001') || h.includes('HN'));
    const isCentral =
      normUsername === '20000002' ||
      normUsername === '20000005' ||
      hubCodes.some((h) => h.includes('002') || h.includes('DN'));

    const regionKey: ScopeLevel = isNorth
      ? 'REGION_NORTH'
      : isCentral
        ? 'REGION_CENTRAL'
        : 'REGION_SOUTH';

    return SCOPE_OPTIONS.filter(
      (opt) => opt.key === regionKey || opt.key === 'PROVINCE' || opt.key === 'HUB',
    );
  }

  // 3. Tỉnh -> Xem phạm vi Tỉnh + Hub bưu cục tỉnh (phường sở tại)
  if (meta.tier === 'PROVINCE') {
    return SCOPE_OPTIONS.filter((opt) => opt.key === 'PROVINCE' || opt.key === 'HUB');
  }

  // 4. Xã / Phường -> Khóa cố định duy nhất tại Hub bưu cục
  return SCOPE_OPTIONS.filter((opt) => opt.key === 'HUB');
}

interface OpsScopeState {
  scopeLevel: ScopeLevel;
  selectedProvinceCode: string | null;
  selectedProvinceName: string | null;
  selectedHubCode: string | null;
  selectedHubName: string | null;
  setScopeLevel: (level: ScopeLevel) => void;
  setSelectedProvince: (code: string | null, name?: string | null) => void;
  setSelectedHub: (code: string | null, name?: string | null) => void;
  resetToNationwide: () => void;
}

export const useOpsScopeStore = create<OpsScopeState>()(
  persist(
    (set) => ({
      scopeLevel: 'NATIONWIDE',
      selectedProvinceCode: null,
      selectedProvinceName: null,
      selectedHubCode: null,
      selectedHubName: null,
      setScopeLevel: (level) =>
        set((state) => ({
          scopeLevel: level,
          selectedHubCode: level === 'HUB' ? state.selectedHubCode : null,
          selectedHubName: level === 'HUB' ? state.selectedHubName : null,
          selectedProvinceCode: level === 'PROVINCE' ? state.selectedProvinceCode : null,
          selectedProvinceName: level === 'PROVINCE' ? state.selectedProvinceName : null,
        })),
      setSelectedProvince: (code, name = null) =>
        set({
          scopeLevel: 'PROVINCE',
          selectedProvinceCode: code,
          selectedProvinceName: name,
        }),
      setSelectedHub: (code, name = null) =>
        set({
          scopeLevel: 'HUB',
          selectedHubCode: code,
          selectedHubName: name,
        }),
      resetToNationwide: () =>
        set({
          scopeLevel: 'NATIONWIDE',
          selectedProvinceCode: null,
          selectedProvinceName: null,
          selectedHubCode: null,
          selectedHubName: null,
        }),
    }),
    {
      name: 'nexus-ops-scope-storage',
    },
  ),
);
