import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const smokeMocks = vi.hoisted(() => {
  const nowIso = () => new Date().toISOString();

  const querySuccess = (data: unknown) => ({
    data,
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
  });

  const queryError = (message: string) => ({
    data: undefined,
    error: new Error(message),
    isError: true,
    isFetching: false,
    isLoading: false,
    isPending: false,
    isSuccess: false,
    refetch: vi.fn(),
  });

  const mutationResult = (mutateAsync: ReturnType<typeof vi.fn>) => ({
    mutateAsync,
    error: null,
    isError: false,
    isPending: false,
  });

  return {
    assignTask: vi.fn(),
    createShipment: vi.fn(),
    deleteManifest: vi.fn(),
    generateBagCodes: vi.fn(),
    inboundScan: vi.fn(),
    listUsers: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    mutationResult,
    nowIso,
    outboundScan: vi.fn(),
    pickupScan: vi.fn(),
    queryError,
    querySuccess,
    reassignTask: vi.fn(),
  };
});

vi.mock('../features/auth/auth.api', () => ({
  authApi: {
    login: smokeMocks.login,
    logout: smokeMocks.logout,
  },
  useLoginMutation: () => smokeMocks.mutationResult(smokeMocks.login),
  useLogoutMutation: () => smokeMocks.mutationResult(smokeMocks.logout),
}));

vi.mock('../features/auth/auth.client', () => ({
  authClient: {
    listUsers: smokeMocks.listUsers,
  },
}));

vi.mock('../features/dashboard/dashboard.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/dashboard/dashboard.api')>();

  return {
    ...actual,
    useDashboardDailyMetricsQuery: vi.fn(() =>
      smokeMocks.querySuccess([
        { label: 'Hôm nay', value: 18 },
        { label: 'Hôm qua', value: 12 },
      ]),
    ),
    useDashboardKpisQuery: vi.fn(() =>
      smokeMocks.querySuccess({
        deliveriesDelivered: 9,
        deliveryAttempts: 12,
        pickupsCompleted: 7,
        scansInbound: 4,
        scansOutbound: 3,
        shipmentsCreated: 14,
      }),
    ),
    useDashboardMonthlyMetricsQuery: vi.fn(() =>
      smokeMocks.querySuccess([
        { label: '2026-05', value: 120 },
        { label: '2026-04', value: 98 },
      ]),
    ),
  };
});

vi.mock('../features/masterdata/masterdata.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/masterdata/masterdata.api')>();
  const hubs = [
    {
      id: 'hub-hcm01',
      code: 'HCM01',
      name: 'Hub HCM 01',
      zoneCode: 'SGN',
      address: JSON.stringify({
        addressLine: '1 Nguyen Trai',
        district: 'Quan 1',
        province: 'TP.HCM',
        workingRadiusKm: '8',
        serviceAreas: ['Quan 1', 'Quan 3'],
      }),
      isActive: true,
      createdAt: smokeMocks.nowIso(),
      updatedAt: smokeMocks.nowIso(),
    },
    {
      id: 'hub-hn01',
      code: 'HN01',
      name: 'Hub Ha Noi 01',
      zoneCode: 'HAN',
      address: null,
      isActive: true,
      createdAt: smokeMocks.nowIso(),
      updatedAt: smokeMocks.nowIso(),
    },
  ];

  return {
    ...actual,
    useHubsQuery: vi.fn(() => smokeMocks.querySuccess(hubs)),
  };
});

vi.mock('../features/shipments/shipments.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/shipments/shipments.api')>();

  const shipments = [
    {
      id: 'shipment-1',
      shipmentCode: 'NXS000001',
      currentStatus: 'CREATED',
      currentLocation: 'HCM01',
      parcelType: 'Parcel',
      shippingFee: 22000,
      receiverRegion: 'TP.HCM',
      senderWard: null,
      senderDistrict: null,
      senderProvince: null,
      senderHubCode: 'HCM01',
      receiverHubCode: 'HCM01',
      originHubCode: 'HCM01',
      destinationHubCode: 'HCM01',
      senderName: 'Nguyen Van A',
      senderPhone: '0900000001',
      senderAddress: '1 Nguyen Trai',
      receiverName: 'Tran Thi B',
      receiverPhone: '0900000002',
      receiverAddress: '2 Le Loi',
      platform: 'OPS_WALK_IN',
      serviceType: 'STANDARD',
      codAmount: 0,
      deliveryNote: null,
      createdAt: smokeMocks.nowIso(),
      updatedAt: smokeMocks.nowIso(),
    },
  ];

  return {
    ...actual,
    useCreateShipmentMutation: vi.fn(() =>
      smokeMocks.mutationResult(smokeMocks.createShipment),
    ),
    useShipmentsQuery: vi.fn(() => smokeMocks.querySuccess(shipments)),
    useShipmentPageQuery: vi.fn(() =>
      smokeMocks.querySuccess({
        items: shipments,
        pageInfo: {
          hasNextPage: false,
          total: shipments.length,
        },
      }),
    ),
  };
});

vi.mock('../features/scans/scans.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/scans/scans.api')>();

  return {
    ...actual,
    useInboundScanMutation: vi.fn(() =>
      smokeMocks.mutationResult(smokeMocks.inboundScan),
    ),
    useOutboundScanMutation: vi.fn(() =>
      smokeMocks.mutationResult(smokeMocks.outboundScan),
    ),
    usePickupScanMutation: vi.fn(() =>
      smokeMocks.mutationResult(smokeMocks.pickupScan),
    ),
  };
});

vi.mock('../features/tasks/tasks.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/tasks/tasks.api')>();
  const tasks = [
    {
      id: 'task-1',
      taskCode: 'TASK-001',
      taskType: 'DELIVERY',
      status: 'CREATED',
      shipmentCode: 'NXS000001',
      pickupRequestId: null,
      assignedCourierId: null,
      note: null,
      createdAt: smokeMocks.nowIso(),
      updatedAt: smokeMocks.nowIso(),
    },
  ];
  const couriers = [{ courierId: 'courier-1', label: 'Courier One' }];

  return {
    ...actual,
    tasksClient: {
      ...actual.tasksClient,
      assign: smokeMocks.assignTask,
      reassign: smokeMocks.reassignTask,
    },
    useCourierOptionsQuery: vi.fn(() => smokeMocks.querySuccess(couriers)),
    useDispatchTasksRealtime: vi.fn(() => 'connected'),
    useTasksQuery: vi.fn(() => smokeMocks.querySuccess(tasks)),
  };
});

vi.mock('../features/manifests/manifests.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/manifests/manifests.api')>();
  const manifests = [
    {
      id: 'manifest-1',
      manifestCode: 'BAG-HCM-HN-001',
      status: 'CREATED',
      originHubCode: 'HCM01',
      destinationHubCode: 'HN01',
      sealedAt: null,
      createdAt: smokeMocks.nowIso(),
      updatedAt: smokeMocks.nowIso(),
      shipmentCount: 0,
    },
  ];

  return {
    ...actual,
    useDeleteManifestMutation: vi.fn(() =>
      smokeMocks.mutationResult(smokeMocks.deleteManifest),
    ),
    useCreateManifestMutation: vi.fn(() =>
      smokeMocks.mutationResult(vi.fn()),
    ),
    useGenerateBagCodesMutation: vi.fn(() =>
      smokeMocks.mutationResult(smokeMocks.generateBagCodes),
    ),
    useManifestsQuery: vi.fn(() => smokeMocks.querySuccess(manifests)),
  };
});

vi.mock('../features/tracking/tracking.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/tracking/tracking.api')>();

  return {
    ...actual,
    useTrackingDetailQuery: vi.fn((_accessToken: string | null, shipmentCode: string) => {
      if (!shipmentCode) {
        return smokeMocks.querySuccess(null);
      }

      if (shipmentCode.includes('ERROR')) {
        return smokeMocks.queryError('Tracking API unavailable');
      }

      return smokeMocks.querySuccess({
        current: {
          shipmentCode,
          currentStatusCode: 'SCAN_INBOUND',
          currentStatus: 'Hàng đến hub',
          currentLocation: 'HCM01',
          currentLocationText: 'Hub HCM 01',
          lastEventTypeCode: 'SCAN_INBOUND',
          lastEventType: 'Quét nhập hub',
          updatedAt: smokeMocks.nowIso(),
        },
        timeline: [
          {
            id: 'tracking-event-1',
            eventType: 'SCAN_INBOUND',
            eventSource: 'scan-service',
            statusAfterEventCode: 'SCAN_INBOUND',
            statusAfterEvent: 'Hàng đến hub',
            locationCode: 'HCM01',
            locationText: 'Hub HCM 01',
            occurredAt: smokeMocks.nowIso(),
            note: 'Đã đến hub nhận',
          },
        ],
      });
    }),
  };
});

import { AppProviders } from '../app/AppProviders';
import { AppRouter } from '../app/AppRouter';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ManifestManagementPage } from '../pages/manifests/ManifestManagementPage';
import { ShipmentListPage } from '../pages/shipments/ShipmentListPage';
import { TaskAssignmentPage } from '../pages/tasks/TaskAssignmentPage';
import { TrackingLookupPage } from '../pages/tracking/TrackingLookupPage';
import { writeLinehaulTrips } from '../pages/function-groups/operations-platform/linehaul/linehaulTrips';
import { queryClient } from '../store/queryClient';
import { useAuthStore } from '../store/authStore';

function setAuthenticatedSession(): void {
  useAuthStore.getState().setSession({
    user: {
      id: 'ops-user-1',
      username: '88000001',
      displayName: 'Ops Smoke User',
      roles: ['OPS_MANAGER', 'SYSTEM_ADMIN'],
      hubCodes: ['HCM01'],
    },
    tokens: {
      accessToken: 'ops-access-token',
      refreshToken: 'ops-refresh-token',
      tokenType: 'Bearer',
      accessTokenExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    },
  });
}

function resetAuthStore(): void {
  useAuthStore.setState({
    authError: null,
    isAuthenticated: false,
    isSubmitting: false,
    session: null,
    status: 'guest',
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  initialRoute = '/app/dashboard',
) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </AppProviders>,
  );
}

describe('ops-web smoke coverage', () => {
  beforeEach(() => {
    queryClient.clear();
    window.localStorage.clear();
    resetAuthStore();
    smokeMocks.assignTask.mockResolvedValue({
      task: {
        id: 'task-1',
        taskCode: 'TASK-001',
        taskType: 'DELIVERY',
        status: 'ASSIGNED',
        shipmentCode: 'NXS000001',
        assignedCourierId: 'courier-1',
        updatedAt: smokeMocks.nowIso(),
      },
    });
    smokeMocks.createShipment.mockResolvedValue({
      id: 'shipment-new',
      shipmentCode: 'NXS-WALKIN-001',
    });
    smokeMocks.deleteManifest.mockResolvedValue(undefined);
    smokeMocks.generateBagCodes.mockResolvedValue([
      {
        id: 'manifest-generated-1',
        manifestCode: 'BAG-GEN-001',
        status: 'CREATED',
        originHubCode: 'HCM01',
        destinationHubCode: 'HN01',
        sealedAt: null,
        createdAt: smokeMocks.nowIso(),
        updatedAt: smokeMocks.nowIso(),
        shipmentCount: 0,
      },
    ]);
    smokeMocks.inboundScan.mockResolvedValue({});
    smokeMocks.listUsers.mockResolvedValue([
      {
        id: 'shipper-1',
        username: '77000001',
        status: 'ACTIVE',
        roles: ['SHIPPER'],
        displayName: 'Courier One',
        phone: '0900000003',
        hubCodes: ['HCM01'],
        createdAt: smokeMocks.nowIso(),
        updatedAt: smokeMocks.nowIso(),
      },
    ]);
    smokeMocks.login.mockResolvedValue(undefined);
    smokeMocks.logout.mockResolvedValue({ revoked: true });
    smokeMocks.outboundScan.mockResolvedValue({});
    smokeMocks.pickupScan.mockResolvedValue({});
    smokeMocks.reassignTask.mockResolvedValue({});
  });

  it('redirects unauthenticated users to login', async () => {
    window.history.pushState({}, '', '/app/dashboard');

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', { name: /Đăng nhập NEXUS Ops/i }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('renders embedded analytics on the dashboard for an authenticated ops user', async () => {
    setAuthenticatedSession();

    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByRole('heading', { name: /Bảng phân tích vận hành/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tổng đơn trong ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/Menu chính/i)).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Hub đang theo dõi/i)).getByText('HCM01')).toBeInTheDocument();
  });

  it('renders shipment list and validates required walk-in fields', async () => {
    const user = userEvent.setup();
    setAuthenticatedSession();

    renderWithProviders(<ShipmentListPage />, '/app/shipments');

    expect(
      await screen.findByRole('heading', { name: /Danh sách vận đơn/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('NXS000001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tạo đơn hàng/i }));
    await user.click(screen.getByRole('button', { name: /^Tạo vận đơn$/i }));

    expect(
      await screen.findByRole('alert', {
        name: '',
      }),
    ).toHaveTextContent('Cần tỉnh/thành người nhận.');
    expect(smokeMocks.createShipment).not.toHaveBeenCalled();
  });

  it('renders task assignment data and calls assign mutation', async () => {
    const user = userEvent.setup();
    setAuthenticatedSession();

    renderWithProviders(<TaskAssignmentPage />, '/app/tasks');

    expect(
      await screen.findByRole('heading', { name: /Phân công tác vụ/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('NXS000001')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Courier One')).toBeInTheDocument();
    });

    const taskCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(taskCheckbox);
    await user.click(screen.getByRole('button', { name: /Phân công các tác vụ đã chọn/i }));

    await waitFor(() => {
      expect(smokeMocks.assignTask).toHaveBeenCalledWith('ops-access-token', {
        courierId: 'courier-1',
        note: 'phân công hàng loạt từ màn hình ops',
        taskId: 'task-1',
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Đã phân công 1');
  });

  it('renders manifest list and generates bag codes', async () => {
    const user = userEvent.setup();
    setAuthenticatedSession();

    renderWithProviders(<ManifestManagementPage />, '/app/manifests');

    expect(
      await screen.findByRole('heading', { name: /Quản lý bao tải/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('BAG-HCM-HN-001')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Hub đích/i), 'HN01');
    await user.click(screen.getByRole('button', { name: /^Tạo mã bao$/i }));

    await waitFor(() => {
      expect(smokeMocks.generateBagCodes).toHaveBeenCalledWith({
        destinationHubCode: 'HN01',
        note: 'EMPTY_BAG',
        originHubCode: 'HCM01',
        quantity: 1,
      });
    });
    expect(await screen.findAllByText(/Đã tạo 1 mã bao trống/i)).toHaveLength(2);
    expect(screen.getByText('BAG-GEN-001')).toBeInTheDocument();
  });

  it('renders linehaul trip creation and management flow', async () => {
    setAuthenticatedSession();
    window.history.pushState(
      {},
      '',
      '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh/tem-xe',
    );

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: /Tạo tem xe/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Thông tin chuyến xe/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Hub đi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hub đến/i)).toBeInTheDocument();
  });

  it('renders linehaul trip list from created trips', async () => {
    setAuthenticatedSession();
    writeLinehaulTrips([
      {
        id: 'trip-1',
        tripCode: 'TRIP-HCM01-HN01-001',
        originHubCode: 'HCM01',
        destinationHubCode: 'HN01',
        tripType: 'PICKUP',
        plannedStartAt: smokeMocks.nowIso(),
        plannedEndAt: new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
        createdAt: smokeMocks.nowIso(),
      },
    ]);
    window.history.pushState(
      {},
      '',
      '/app/function-groups/capability-platform/van-chuyen-tuyen-nhanh/quan-ly-chuyen-xe',
    );

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', { name: /Quản lý chuyến xe/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('TRIP-HCM01-HN01-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /In tem/i })).toBeInTheDocument();
  });

  it('renders tracking empty, error, and success states', async () => {
    const user = userEvent.setup();
    setAuthenticatedSession();

    renderWithProviders(<TrackingLookupPage />, '/app/tracking');

    expect(screen.getByText(/Chưa có mã vận đơn/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Chọn mã vận đơn ở cột trái để xem lịch sử trạng thái/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Ví dụ: JT0123456789/i),
      'ERROR123',
    );
    await user.click(screen.getByRole('button', { name: /Tìm kiếm/i }));
    expect(await screen.findByText(/Chưa lấy được timeline từ API/i)).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Ví dụ: JT0123456789/i),
      'SUCCESS123',
    );
    await user.click(screen.getByRole('button', { name: /Tìm kiếm/i }));

    expect(await screen.findByText('SCAN_INBOUND')).toBeInTheDocument();
    expect(screen.getByText('Hub HCM 01')).toBeInTheDocument();
    expect(screen.getByText('Đã đến hub nhận')).toBeInTheDocument();
  });
});
