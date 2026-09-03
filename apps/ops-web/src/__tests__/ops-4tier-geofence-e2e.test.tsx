import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canAccessOpsFeature,
  resolveOpsActor,
} from '../features/permissions/opsPermissions';
import {
  isPointInPolygon,
} from '../features/masterdata/vietnamBoundaryData';
import {
  resolveAllowedScopes,
  resolveOpsTier,
  useOpsScopeStore,
} from '../store/opsScopeStore';
import { AppProviders } from '../app/AppProviders';
import { CourierAreaAssignmentPage } from '../pages/tasks/CourierAreaAssignmentPage';

// Mock masterdata and tasks hooks
vi.mock('../features/masterdata/masterdata.api', () => ({
  useHubsQuery: () => ({
    data: [
      { code: 'HCM-001', name: 'Bưu cục Tân Bình', province: 'Thành phố Hồ Chí Minh', district: 'Quận Tân Bình' },
      { code: 'BD-001', name: 'Bưu cục Dĩ An', province: 'Tỉnh Bình Dương', district: 'Thành phố Dĩ An' },
    ],
    isLoading: false,
    isSuccess: true,
  }),
}));

vi.mock('../features/masterdata/masterdata.hooks', () => ({
  useCourierAreaAssignmentsQuery: () => ({
    data: [
      {
        id: 'caa-1',
        hubCode: 'HCM-001',
        courierId: '30000001',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận Tân Bình',
        ward: 'Tuyến Tân Bình Trung Tâm',
        zoneName: 'Tuyến Tân Bình Trung Tâm',
        colorHex: '#2563eb',
        isActive: true,
        boundaryPolygon: [
          [10.7900, 106.6500],
          [10.8100, 106.6500],
          [10.8100, 106.6700],
          [10.7900, 106.6700],
          [10.7900, 106.6500],
        ],
      },
    ],
    isLoading: false,
    isSuccess: true,
    refetch: vi.fn(),
  }),
  useCreateCourierAreaAssignmentMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-caa' }),
    isPending: false,
  }),
  useUpdateCourierAreaAssignmentMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useDeleteCourierAreaAssignmentMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useVietnamAdministrativeUnitsQuery: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../features/tasks/tasks.api', () => ({
  useCourierOptionsQuery: () => ({
    data: [
      { courierId: '30000001', label: 'Nguyễn Văn Shipper 1' },
      { courierId: '30000002', label: 'Trần Thị Shipper 2' },
    ],
    isLoading: false,
  }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: any) => any) =>
    selector({
      session: {
        tokens: { accessToken: 'mock-token' },
        user: {
          username: '20001001',
          roles: ['OPS_COURIER_ASSIGN'],
          hubCodes: ['HCM-001'],
        },
      },
    }),
}));

describe('E2E Automated Test Suite: 4-Tier Ops Scope & Courier Geofence Polygon Dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 4-Tier Operations Scope Resolution & Badges', () => {
    it('resolves HQ tier correctly for executive / admin accounts', () => {
      const hqTier = resolveOpsTier('20000000', ['SYSTEM_ADMIN'], ['000HQ001']);
      expect(hqTier.tier).toBe('HQ');
      expect(hqTier.badgeLabel).toBe('HQ MASTER');

      const hqScopes = resolveAllowedScopes('20000000', ['SYSTEM_ADMIN'], ['000HQ001']);
      expect(hqScopes.map((s) => s.key)).toEqual([
        'NATIONWIDE',
        'REGION_NORTH',
        'REGION_CENTRAL',
        'REGION_SOUTH',
        'PROVINCE',
        'HUB',
      ]);
    });

    it('resolves REGION tier correctly for regional operators', () => {
      const regionTier = resolveOpsTier('20000003', ['REGIONAL_OPS'], ['003']);
      expect(regionTier.tier).toBe('REGION');
      expect(regionTier.badgeLabel).toBe('MIỀN MIỀN NAM');

      const regionScopes = resolveAllowedScopes('20000003', ['REGIONAL_OPS'], ['003']);
      expect(regionScopes.map((s) => s.key)).toEqual(['REGION_SOUTH', 'PROVINCE', 'HUB']);
    });

    it('resolves PROVINCE tier correctly for provincial hub managers', () => {
      const provTier = resolveOpsTier('20000025', ['PROVINCIAL_OPS'], ['003079B001']);
      expect(provTier.tier).toBe('PROVINCE');
      expect(provTier.badgeLabel).toBe('KHO TỈNH / TP');

      const provScopes = resolveAllowedScopes('20000025', ['PROVINCIAL_OPS'], ['003079B001']);
      expect(provScopes.map((s) => s.key)).toEqual(['PROVINCE', 'HUB']);
    });

    it('resolves WARD tier correctly for local ward hub operators', () => {
      const wardTier = resolveOpsTier('20001001', ['HUB_OPS'], ['HCM-001']);
      expect(wardTier.tier).toBe('WARD');
      expect(wardTier.badgeLabel).toBe('BƯU CỤC PHƯỜNG');

      const wardScopes = resolveAllowedScopes('20001001', ['HUB_OPS'], ['HCM-001']);
      expect(wardScopes.map((s) => s.key)).toEqual(['HUB']);
    });
  });

  describe('2. Operations Permissions Matrix Across 4 Tiers', () => {
    it('grants HQ_OPS access to system-wide dashboards and linehaul fleet', () => {
      expect(canAccessOpsFeature('HQ_OPS', 'nav.hq-command-center')).toBe(true);
      expect(canAccessOpsFeature('HQ_OPS', 'nav.regional-flow-monitor')).toBe(true);
      expect(canAccessOpsFeature('HQ_OPS', 'nav.linehaul-fleet-control')).toBe(true);
      expect(canAccessOpsFeature('HQ_OPS', 'nav.sla-overdue-radar')).toBe(true);
      expect(canAccessOpsFeature('HQ_OPS', 'action.fast-track-return')).toBe(true);
    });

    it('grants REGIONAL_OPS regional flow & linehaul, but restricts branch counter', () => {
      expect(canAccessOpsFeature('REGIONAL_OPS', 'nav.regional-flow-monitor')).toBe(true);
      expect(canAccessOpsFeature('REGIONAL_OPS', 'nav.linehaul-fleet-control')).toBe(true);
      expect(canAccessOpsFeature('REGIONAL_OPS', 'nav.branch-business')).toBe(false);
      expect(canAccessOpsFeature('REGIONAL_OPS', 'nav.barcode-scan-hub')).toBe(false);
    });

    it('grants PROVINCIAL_OPS branch counter, scan hub, and courier assignment', () => {
      expect(canAccessOpsFeature('PROVINCIAL_OPS', 'nav.branch-business')).toBe(true);
      expect(canAccessOpsFeature('PROVINCIAL_OPS', 'nav.barcode-scan-hub')).toBe(true);
      expect(canAccessOpsFeature('PROVINCIAL_OPS', 'action.fast-track-return')).toBe(true);
      expect(canAccessOpsFeature('PROVINCIAL_OPS', 'nav.hq-command-center')).toBe(false);
    });

    it('grants HUB_OPS local hub counter, scan hub, and courier assignment', () => {
      expect(canAccessOpsFeature('HUB_OPS', 'nav.branch-business')).toBe(true);
      expect(canAccessOpsFeature('HUB_OPS', 'nav.barcode-scan-hub')).toBe(true);
      expect(canAccessOpsFeature('HUB_OPS', 'action.fast-track-return')).toBe(false);
      expect(canAccessOpsFeature('HUB_OPS', 'nav.regional-flow-monitor')).toBe(false);
    });
  });

  describe('3. Ray-Casting Geofence Point-in-Polygon Algorithm', () => {
    const polygonTanBinh: Array<[number, number]> = [
      [10.7900, 106.6500],
      [10.8100, 106.6500],
      [10.8100, 106.6700],
      [10.7900, 106.6700],
      [10.7900, 106.6500],
    ];

    it('accurately identifies coordinates inside custom drawn polygon', () => {
      const insidePoint = { latitude: 10.8000, longitude: 106.6600 };
      expect(isPointInPolygon(insidePoint, polygonTanBinh)).toBe(true);
    });

    it('accurately rejects coordinates outside custom drawn polygon', () => {
      const outsidePoint = { latitude: 10.8500, longitude: 106.7000 };
      expect(isPointInPolygon(outsidePoint, polygonTanBinh)).toBe(false);
    });

    it('handles complex non-convex concave polygons (L-shaped polygon)', () => {
      const lPolygon: Array<[number, number]> = [
        [10.0, 10.0],
        [10.0, 14.0],
        [12.0, 14.0],
        [12.0, 12.0],
        [14.0, 12.0],
        [14.0, 10.0],
        [10.0, 10.0],
      ];

      // Point inside the vertical arm
      expect(isPointInPolygon({ latitude: 11.0, longitude: 13.0 }, lPolygon)).toBe(true);
      // Point inside the bottom base
      expect(isPointInPolygon({ latitude: 13.0, longitude: 11.0 }, lPolygon)).toBe(true);
      // Point inside the hollow nook outside the L shape
      expect(isPointInPolygon({ latitude: 13.0, longitude: 13.0 }, lPolygon)).toBe(false);
    });
  });

  describe('4. CourierAreaAssignmentPage Interactive Workbench UI', () => {
    it('renders drawing toolbar and allows tab switching to Custom Drawn Zones', async () => {
      const user = userEvent.setup();

      render(
        <AppProviders>
          <MemoryRouter>
            <CourierAreaAssignmentPage />
          </MemoryRouter>
        </AppProviders>
      );

      // Check Header & Drawing Button
      expect(screen.getByText(/Quản lý Phân vùng Nội bộ & Phân công Tuyến Shipper/i)).toBeInTheDocument();
      expect(screen.getByText(/✏️ Vẽ Dải Toạ Độ Mới Cho Shipper/i)).toBeInTheDocument();

      // Check Tab "Dải Toạ Độ Đã Vẽ"
      const customZonesTab = screen.getByRole('button', { name: /Dải Toạ Độ Đã Vẽ/i });
      expect(customZonesTab).toBeInTheDocument();

      // Click tab "Dải Toạ Độ Đã Vẽ"
      await user.click(customZonesTab);

      // Verify custom zone table renders the mock custom drawn polygon
      expect(screen.getByText('Tuyến Tân Bình Trung Tâm')).toBeInTheDocument();
      expect(screen.getByText(/5 điểm khép kín/i)).toBeInTheDocument();
      expect(screen.getByText(/Đang kích hoạt/i)).toBeInTheDocument();
      expect(screen.getByText('Xem bản đồ')).toBeInTheDocument();
    });

    it('activates drawing mode when user clicks Start Drawing', async () => {
      const user = userEvent.setup();

      render(
        <AppProviders>
          <MemoryRouter>
            <CourierAreaAssignmentPage />
          </MemoryRouter>
        </AppProviders>
      );

      const startDrawBtn = screen.getByText(/✏️ Vẽ Dải Toạ Độ Mới Cho Shipper/i);
      await user.click(startDrawBtn);

      // Verify drawing mode banner appears
      expect(screen.getByText(/Đang ở Chế độ Vẽ Tuyến/i)).toBeInTheDocument();
      expect(screen.getByText(/Hủy vẽ/i)).toBeInTheDocument();

      // Verify Drawing Form is rendered in sidebar
      expect(screen.getByText(/✏️ Thiết lập Tuyến Dải Toạ Độ Mới/i)).toBeInTheDocument();
      expect(screen.getByText(/Tên Tuyến \/ Dải Toạ Độ:/i)).toBeInTheDocument();
      expect(screen.getByText(/Shipper phụ trách tuyến:/i)).toBeInTheDocument();
      expect(screen.getByText(/Lưu Tuyến Dải Toạ Độ/i)).toBeInTheDocument();

      // Click cancel drawing
      const cancelBtn = screen.getByText(/Hủy vẽ/i);
      await user.click(cancelBtn);

      // Drawing mode is closed
      expect(screen.queryByText(/Đang ở Chế độ Vẽ Tuyến/i)).not.toBeInTheDocument();
    });
  });
});
