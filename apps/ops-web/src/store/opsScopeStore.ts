import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ScopeLevel =
  | 'NATIONWIDE'
  | 'REGION_NORTH'
  | 'REGION_CENTRAL'
  | 'REGION_SOUTH'
  | 'HUB';

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
    key: 'HUB',
    label: 'Theo Bưu Cục Cụ Thể',
    badge: 'BƯU CỤC',
    icon: 'hub',
  },
];

export function resolveAllowedScopes(
  username?: string | null,
  roles: string[] = [],
  hubCodes: string[] = [],
): ScopeOption[] {
  const normUsername = (username ?? '').trim();
  const isHqMaster =
    normUsername === '20000000' ||
    normUsername === '10000001' ||
    roles.includes('SYSTEM_ADMIN') ||
    roles.includes('HQ_OPS') ||
    roles.includes('HQ_MANAGER');

  if (isHqMaster) {
    return SCOPE_OPTIONS;
  }

  const isNorthAdmin = normUsername === '20000001' || hubCodes.some((h) => h.includes('HN') || h.includes('HAN'));
  const isCentralAdmin = normUsername === '20000002' || hubCodes.some((h) => h.includes('DN') || h.includes('DAN'));
  const isSouthAdmin = normUsername === '20000003' || hubCodes.some((h) => h.includes('HCM'));

  if (roles.includes('OPS_ADMIN')) {
    if (isNorthAdmin) {
      return SCOPE_OPTIONS.filter((opt) => opt.key === 'REGION_NORTH' || opt.key === 'HUB');
    }
    if (isCentralAdmin) {
      return SCOPE_OPTIONS.filter((opt) => opt.key === 'REGION_CENTRAL' || opt.key === 'HUB');
    }
    if (isSouthAdmin) {
      return SCOPE_OPTIONS.filter((opt) => opt.key === 'REGION_SOUTH' || opt.key === 'HUB');
    }
  }

  // Default Local Hub User
  return SCOPE_OPTIONS.filter((opt) => opt.key === 'HUB');
}

interface OpsScopeState {
  scopeLevel: ScopeLevel;
  selectedHubCode: string | null;
  selectedHubName: string | null;
  setScopeLevel: (level: ScopeLevel) => void;
  setSelectedHub: (code: string | null, name?: string | null) => void;
  resetToNationwide: () => void;
}

export const useOpsScopeStore = create<OpsScopeState>()(
  persist(
    (set) => ({
      scopeLevel: 'NATIONWIDE',
      selectedHubCode: null,
      selectedHubName: null,
      setScopeLevel: (level) =>
        set((state) => ({
          scopeLevel: level,
          selectedHubCode: level === 'HUB' ? state.selectedHubCode : null,
          selectedHubName: level === 'HUB' ? state.selectedHubName : null,
        })),
      setSelectedHub: (code, name = null) =>
        set({
          scopeLevel: 'HUB',
          selectedHubCode: code,
          selectedHubName: name,
        }),
      resetToNationwide: () =>
        set({
          scopeLevel: 'NATIONWIDE',
          selectedHubCode: null,
          selectedHubName: null,
        }),
    }),
    {
      name: 'nexus-ops-scope-storage',
    },
  ),
);
