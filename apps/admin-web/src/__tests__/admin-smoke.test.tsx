import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AppRouter } from '../app/AppRouter';
import { AdminDashboardPage } from '../pages/dashboard/AdminDashboardPage';
import { HubManagementPage } from '../pages/masterdata/HubManagementPage';
import { CourierPermissionMatrixPage } from '../pages/permissions/CourierPermissionMatrixPage';
import { MerchantUsersPage } from '../pages/users/MerchantUsersPage';
import { OpsUsersPage } from '../pages/users/OpsUsersPage';
import { useAuthStore } from '../store/authStore';
import type {
  AdminUserDto,
  AuthSessionDto,
  UserRoleGroup,
} from '../features/auth/auth.types';
import type {
  ConfigDto,
  HubDto,
  MerchantProfileDto,
  NdrReasonDto,
  ZoneDto,
} from '../features/masterdata/masterdata.types';
import {
  COURIER_PERMISSION_FEATURES,
  type CourierPermissionMatrix,
  type UserPermissionMap,
} from '../features/permissions/courierPermissionMatrix';

const mocks = vi.hoisted(() => ({
  loginMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  logoutMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  createUserMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  updateUserMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  createHubMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  updateHubMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  createConfigMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  updateConfigMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  upsertMerchantProfileMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  updateMatrixMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  updateUserOverrideMutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  usersByRole: {} as Record<string, AdminUserDto[]>,
  hubs: [] as HubDto[],
  zones: [] as ZoneDto[],
  ndrReasons: [] as NdrReasonDto[],
  configs: [] as ConfigDto[],
  merchantProfiles: [] as MerchantProfileDto[],
  matrix: null as CourierPermissionMatrix | null,
  effectivePermissions: null as {
    userId: string;
    actor: string;
    permissions: UserPermissionMap;
    hasOverride: boolean;
  } | null,
  matrixError: null as Error | null,
  userEffectiveError: null as Error | null,
}));

vi.mock('../features/auth/auth.api', () => ({
  useLoginMutation: () => mocks.loginMutation,
  useLogoutMutation: () => mocks.logoutMutation,
  useAdminUsersQuery: (
    _accessToken: string | null,
    filters: { roleGroup: UserRoleGroup },
  ) => querySuccess(mocks.usersByRole[filters.roleGroup] ?? []),
  useCreateAdminUserMutation: () => mocks.createUserMutation,
  useUpdateAdminUserMutation: () => mocks.updateUserMutation,
}));

vi.mock('../features/masterdata/masterdata.api', () => ({
  useHubsQuery: () => querySuccess(mocks.hubs),
  useZonesQuery: () => querySuccess(mocks.zones),
  useNdrReasonsQuery: () => querySuccess(mocks.ndrReasons),
  useConfigsQuery: () => querySuccess(mocks.configs),
  useMerchantProfilesQuery: () => querySuccess(mocks.merchantProfiles),
  useCreateHubMutation: () => mocks.createHubMutation,
  useUpdateHubMutation: () => mocks.updateHubMutation,
  useUpsertMerchantProfileMutation: () => mocks.upsertMerchantProfileMutation,
  useCreateZoneMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateZoneMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateNdrReasonMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateNdrReasonMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateConfigMutation: () => mocks.createConfigMutation,
  useUpdateConfigMutation: () => mocks.updateConfigMutation,
}));

vi.mock('../features/permissions/permissions.api', () => ({
  useCourierPermissionMatrixQuery: () =>
    mocks.matrixError
      ? queryError(mocks.matrixError)
      : querySuccess(mocks.matrix),
  useUpdateCourierPermissionMatrixMutation: () => mocks.updateMatrixMutation,
  useUpdateUserPermissionOverrideMutation: () => mocks.updateUserOverrideMutation,
  useUserEffectivePermissionsQuery: () =>
    mocks.userEffectiveError
      ? queryError(mocks.userEffectiveError)
      : querySuccess(mocks.effectivePermissions),
}));

vi.mock('../pages/dashboard/AdminDashboardCharts', () => ({
  AdminDashboardCharts: () => <div>Biểu đồ smoke</div>,
}));

function querySuccess<T>(data: T) {
  return {
    data,
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    isSuccess: true,
    refetch: vi.fn(),
  };
}

function queryError(error: Error) {
  return {
    data: undefined,
    error,
    isError: true,
    isFetching: false,
    isLoading: false,
    isSuccess: false,
    refetch: vi.fn(),
  };
}

function renderWithProviders(
  ui: React.ReactElement,
  options: { route?: string; router?: boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const content = options.router === false ? (
    ui
  ) : (
    <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
  );

  return render(
    <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>,
  );
}

function setAdminSession() {
  const session: AuthSessionDto = {
    user: {
      id: '10000001',
      username: '10000001',
      displayName: 'System Admin',
      phone: null,
      roles: ['SYSTEM_ADMIN'],
      hubCodes: [],
    },
    tokens: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 2_592_000_000).toISOString(),
    },
  };

  useAuthStore.getState().setSession(session);
}

function resetMocks() {
  mocks.loginMutation.mutateAsync.mockReset();
  mocks.logoutMutation.mutateAsync.mockReset();
  mocks.createUserMutation.mutateAsync.mockReset();
  mocks.updateUserMutation.mutateAsync.mockReset();
  mocks.createHubMutation.mutateAsync.mockReset();
  mocks.updateHubMutation.mutateAsync.mockReset();
  mocks.createConfigMutation.mutateAsync.mockReset();
  mocks.updateConfigMutation.mutateAsync.mockReset();
  mocks.upsertMerchantProfileMutation.mutateAsync.mockReset();
  mocks.updateMatrixMutation.mutateAsync.mockReset();
  mocks.updateUserOverrideMutation.mutateAsync.mockReset();

  mocks.usersByRole = {
    OPS: [],
    SHIPPER: [],
    MERCHANT: [],
  };
  mocks.hubs = [];
  mocks.zones = [];
  mocks.ndrReasons = [];
  mocks.configs = [];
  mocks.merchantProfiles = [];
  mocks.matrix = createMatrix(false);
  mocks.effectivePermissions = null;
  mocks.matrixError = null;
  mocks.userEffectiveError = null;

  window.localStorage.clear();
  useAuthStore.getState().clearSession();
  useAuthStore.getState().clearAuthError();
}

function createUser(overrides: Partial<AdminUserDto>): AdminUserDto {
  return {
    id: overrides.id ?? 'user-1',
    username: overrides.username ?? '20000001',
    status: overrides.status ?? 'ACTIVE',
    roles: overrides.roles ?? ['OPS_VIEWER'],
    displayName: overrides.displayName ?? 'Ops User',
    phone: overrides.phone ?? null,
    hubCodes: overrides.hubCodes ?? [],
    createdAt: overrides.createdAt ?? '2026-05-18T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-18T00:00:00.000Z',
  };
}

function createHub(overrides: Partial<HubDto>): HubDto {
  return {
    id: overrides.id ?? 'hub-1',
    code: overrides.code ?? 'HCM-001',
    name: overrides.name ?? 'Hub HCM',
    zoneCode: overrides.zoneCode ?? 'ZONE-HCM',
    address:
      overrides.address ??
      JSON.stringify({
        addressLine: '1 Nguyen Hue',
        ward: 'Ben Nghe',
        district: 'Quận 1',
        province: 'Hồ Chí Minh',
      }),
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? '2026-05-18T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-18T00:00:00.000Z',
  };
}

function createZone(overrides: Partial<ZoneDto>): ZoneDto {
  return {
    id: overrides.id ?? 'zone-1',
    code: overrides.code ?? 'ZONE-HCM',
    name: overrides.name ?? 'Zone HCM',
    parentCode: overrides.parentCode ?? null,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? '2026-05-18T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-18T00:00:00.000Z',
  };
}

function createNdrReason(overrides: Partial<NdrReasonDto>): NdrReasonDto {
  return {
    id: overrides.id ?? 'ndr-1',
    code: overrides.code ?? 'NO_CONTACT',
    description: overrides.description ?? 'Không liên hệ được',
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? '2026-05-18T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-18T00:00:00.000Z',
  };
}

function createConfig(overrides: Partial<ConfigDto>): ConfigDto {
  return {
    id: overrides.id ?? 'config-1',
    key: overrides.key ?? 'system.pickup_sla',
    value: overrides.value ?? 24,
    scope: overrides.scope ?? 'SYSTEM',
    description: overrides.description ?? null,
    createdAt: overrides.createdAt ?? '2026-05-18T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-18T00:00:00.000Z',
  };
}

function createMatrix(value: boolean): CourierPermissionMatrix {
  return {
    COURIER: createPermissionMap(value),
    OPS: createPermissionMap(value),
  };
}

function createPermissionMap(value: boolean): UserPermissionMap {
  return COURIER_PERMISSION_FEATURES.reduce((permissions, feature) => {
    permissions[feature.id] = value;
    return permissions;
  }, {} as UserPermissionMap);
}

beforeEach(() => {
  resetMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('admin smoke workflows', () => {
  it('redirects unauthenticated users away from protected admin routes', async () => {
    window.history.pushState({}, '', '/app/dashboard');

    renderWithProviders(<AppRouter />, { router: false });

    expect(
      await screen.findByRole('heading', {
        name: /đăng nhập hệ thống quản trị/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tổng quan admin/i)).not.toBeInTheDocument();
  });

  it('renders the dashboard KPI shell from mocked API data', async () => {
    setAdminSession();
    mocks.usersByRole = {
      OPS: [createUser({ id: 'ops-1', username: '20000001' })],
      SHIPPER: [
        createUser({
          id: 'courier-1',
          username: '30000001',
          roles: ['COURIER'],
        }),
      ],
      MERCHANT: [
        createUser({
          id: 'merchant-1',
          username: '41100001',
          roles: ['MERCHANT'],
          status: 'DISABLED',
        }),
      ],
    };
    mocks.hubs = [createHub({})];
    mocks.zones = [createZone({})];
    mocks.ndrReasons = [createNdrReason({})];
    mocks.configs = [createConfig({})];

    renderWithProviders(<AdminDashboardPage />);

    expect(
      await screen.findByRole('heading', { name: /tổng quan admin/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tổng người dùng')).toBeInTheDocument();
    expect(screen.getByText('Tài khoản Ops')).toBeInTheDocument();
    expect(screen.getByText('Hub')).toBeInTheDocument();
    expect(screen.getByText(/số liệu được lấy từ api/i)).toBeInTheDocument();
  });

  it('keeps create user validation client-side and submits valid updates', async () => {
    const user = userEvent.setup();
    setAdminSession();
    mocks.usersByRole = {
      OPS: [
        createUser({
          id: 'ops-1',
          username: '20000001',
          displayName: 'Old Ops',
        }),
      ],
      SHIPPER: [],
      MERCHANT: [],
    };
    mocks.hubs = [createHub({ code: 'HCM-001' })];
    mocks.updateUserMutation.mutateAsync.mockResolvedValue(
      createUser({
        id: 'ops-1',
        username: '20000001',
        displayName: 'Updated Ops',
      }),
    );

    renderWithProviders(<OpsUsersPage />);

    await user.click(screen.getByRole('button', { name: /^tạo tài khoản$/i }));
    expect(mocks.createUserMutation.mutateAsync).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^sửa$/i }));
    await user.clear(screen.getByLabelText(/tên hiển thị/i));
    await user.type(screen.getByLabelText(/tên hiển thị/i), 'Updated Ops');
    await user.click(screen.getByRole('button', { name: /lưu tài khoản/i }));

    await waitFor(() =>
      expect(mocks.updateUserMutation.mutateAsync).toHaveBeenCalledWith({
        userId: 'ops-1',
        payload: expect.objectContaining({
          displayName: 'Updated Ops',
          roles: ['OPS_VIEWER'],
          status: 'ACTIVE',
        }),
      }),
    );
  });

  it('shows only active hubs in the assigned hub select for ops accounts', async () => {
    setAdminSession();
    mocks.usersByRole = {
      OPS: [createUser({ id: 'ops-1', username: '20000001' })],
      SHIPPER: [],
      MERCHANT: [],
    };
    mocks.hubs = [
      createHub({ id: 'hub-inactive', code: 'HAN-NTL', name: 'Hub Inactive', isActive: false }),
      createHub({ id: 'hub-active', code: 'HAN-CG', name: 'Hub Active', isActive: true }),
    ];

    renderWithProviders(<OpsUsersPage />);

    const assignedHubSelect = await screen.findByLabelText(/hub/i);

    expect(
      within(assignedHubSelect).queryByRole('option', { name: /hub inactive/i }),
    ).not.toBeInTheDocument();
    expect(
      within(assignedHubSelect).getByRole('option', { name: /hub active/i }),
    ).toBeInTheDocument();
  });

  it('saves merchant address detail into the merchant profile payload', async () => {
    const user = userEvent.setup();
    setAdminSession();
    mocks.usersByRole = {
      OPS: [],
      SHIPPER: [],
      MERCHANT: [],
    };
    mocks.hubs = [
      createHub({
        id: 'hub-hn',
        code: 'HAN-CG',
        name: 'Hub Ha Noi',
        address: JSON.stringify({
          addressLine: 'Hub Ha Noi',
          ward: 'Dich Vong',
          district: 'Cau Giay',
          province: 'Ha Noi',
        }),
      }),
    ];
    mocks.createUserMutation.mutateAsync.mockResolvedValue(
      createUser({
        id: 'merchant-1',
        username: '41100001',
        displayName: 'Merchant A',
        phone: '0900000000',
        roles: ['MERCHANT'],
        hubCodes: ['HAN-CG'],
      }),
    );
    mocks.createConfigMutation.mutateAsync.mockResolvedValue({
      id: 'config-merchant-1',
      key: 'merchant.profile.41100001',
      value: {
        username: '41100001',
      },
      scope: 'MERCHANT_PROFILE',
      description: null,
      createdAt: '2026-05-18T00:00:00.000Z',
      updatedAt: '2026-05-18T00:00:00.000Z',
    });
    mocks.upsertMerchantProfileMutation.mutateAsync.mockResolvedValue({
      id: 'profile-1',
      username: '41100001',
      citizenId: '123456789012',
      regionCode: 'HA_NOI',
      regionLabel: 'Ha Noi',
      defaultHubCode: 'HAN-CG',
      defaultHubName: 'Hub Ha Noi',
      defaultSenderAddress: '123 Nguyen Trai, Dich Vong, Cau Giay, Ha Noi',
      businessAddressDetail: '123 Nguyen Trai',
      createdAt: '2026-05-18T00:00:00.000Z',
      updatedAt: '2026-05-18T00:00:00.000Z',
    });

    renderWithProviders(<MerchantUsersPage />);

    await user.type(screen.getByLabelText(/họ tên/i), 'Merchant A');
    await user.type(screen.getByLabelText(/số điện thoại/i), '0900000000');
    await user.type(screen.getByLabelText(/cccd/i), '123456789012');
    await user.type(screen.getByLabelText(/dia chi chi tiet/i), '123 Nguyen Trai');
    await user.type(screen.getByLabelText(/^mật khẩu/i), 'Secret123!');
    await user.type(screen.getByLabelText(/xác nhận mật khẩu/i), 'Secret123!');
    await user.click(screen.getByRole('button', { name: /merchant/i }));

    await waitFor(() =>
      expect(mocks.createUserMutation.mutateAsync).toHaveBeenCalledWith({
        username: '41100001',
        password: 'Secret123!',
        roles: ['MERCHANT'],
        status: 'ACTIVE',
        displayName: 'Merchant A',
        phone: '0900000000',
        hubCodes: ['HAN-CG'],
      }),
    );
    await waitFor(() =>
      expect(mocks.upsertMerchantProfileMutation.mutateAsync).toHaveBeenCalledWith({
        username: '41100001',
        payload: expect.objectContaining({
          businessAddressDetail: '123 Nguyen Trai',
          defaultSenderAddress: '123 Nguyen Trai, Dich Vong, Cau Giay, Ha Noi',
        }),
      }),
    );
    await waitFor(() =>
      expect(mocks.createConfigMutation.mutateAsync).toHaveBeenCalledWith({
        key: 'merchant.profile.41100001',
        scope: 'MERCHANT_PROFILE',
        value: expect.objectContaining({
          businessAddressDetail: '123 Nguyen Trai',
          defaultSenderAddress: '123 Nguyen Trai, Dich Vong, Cau Giay, Ha Noi',
        }),
        description: 'Merchant profile for 41100001',
      }),
    );
  });

  it('validates hub form and uses disable flow instead of hard delete', async () => {
    const user = userEvent.setup();
    setAdminSession();
    mocks.hubs = [createHub({ id: 'hub-1', code: 'HCM-001', isActive: true })];
    mocks.zones = [createZone({ code: 'ZONE-HCM' })];
    mocks.usersByRole = {
      OPS: [],
      SHIPPER: [],
      MERCHANT: [],
    };
    mocks.updateHubMutation.mutateAsync.mockResolvedValue(
      createHub({ id: 'hub-1', code: 'HCM-001', isActive: false }),
    );

    renderWithProviders(<HubManagementPage />);

    await user.click(screen.getByRole('button', { name: /tạo bưu cục/i }));
    const createDialog = await screen.findByRole('dialog', {
      name: /tạo hub/i,
    });
    await user.type(within(createDialog).getByLabelText(/mã hub/i), 'HCM-002');
    await user.type(
      within(createDialog).getByLabelText(/tên hub/i),
      'Hub HCM 2',
    );
    await user.selectOptions(
      within(createDialog).getByLabelText(/mã zone/i),
      'ZONE-HCM',
    );
    await user.selectOptions(
      within(createDialog).getByLabelText(/tỉnh\/thành/i),
      'Hồ Chí Minh',
    );
    await user.selectOptions(
      within(createDialog).getByLabelText(/quận\/huyện/i),
      'Quận 1',
    );
    await user.click(
      within(createDialog).getByRole('button', { name: /^tạo hub$/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /phường\/xã là bắt buộc/i,
    );
    expect(mocks.createHubMutation.mutateAsync).not.toHaveBeenCalled();

    await user.click(within(createDialog).getByRole('button', { name: /đóng/i }));
    await user.click(screen.getByRole('button', { name: /vô hiệu hóa/i }));

    await waitFor(() =>
      expect(mocks.updateHubMutation.mutateAsync).toHaveBeenCalledWith({
        hubId: 'hub-1',
        payload: {
          isActive: false,
        },
      }),
    );
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Dữ liệu bưu cục'),
    );
  });

  it('normalizes Da Nang province to the API value when editing a hub', async () => {
    const user = userEvent.setup();
    setAdminSession();
    mocks.hubs = [
      createHub({
        id: 'hub-dn',
        code: 'DAN-001',
        name: 'Hub DN',
        zoneCode: 'ZONE-DN',
        address: JSON.stringify({
          addressLine: '1 Bach Dang',
          ward: 'Hai Chau 1',
          district: 'Hai Chau',
          province: 'Da Nang',
        }),
      }),
    ];
    mocks.zones = [createZone({ code: 'ZONE-DN', name: 'Zone DN' })];
    mocks.usersByRole = {
      OPS: [],
      SHIPPER: [],
      MERCHANT: [],
    };
    mocks.updateHubMutation.mutateAsync.mockResolvedValue(
      createHub({
        id: 'hub-dn',
        code: 'DAN-001',
        name: 'Hub DN',
        zoneCode: 'ZONE-DN',
        address: JSON.stringify({
          addressLine: '1 Bach Dang',
          ward: 'Hai Chau 1',
          district: 'H\u1ea3i Ch\u00e2u',
          province: 'Da Nang',
        }),
      }),
    );

    renderWithProviders(<HubManagementPage />);

    await user.click(screen.getByRole('button', { name: /s\u1eeda/i }));
    const editDialog = await screen.findByRole('dialog', {
      name: /s\u1eeda hub/i,
    });

    await user.selectOptions(
      within(editDialog).getByLabelText(/t\u1ec9nh\/th\u00e0nh/i),
      '\u0110\u00e0 N\u1eb5ng',
    );
    await user.selectOptions(
      within(editDialog).getByLabelText(/qu\u1eadn\/huy\u1ec7n/i),
      'H\u1ea3i Ch\u00e2u',
    );
    await user.click(
      within(editDialog).getByRole('button', { name: /l\u01b0u thay \u0111\u1ed5i/i }),
    );

    await waitFor(() =>
      expect(mocks.updateHubMutation.mutateAsync).toHaveBeenCalledWith({
        hubId: 'hub-dn',
        payload: expect.objectContaining({
          name: 'Hub DN',
          zoneCode: 'ZONE-DN',
          isActive: true,
          address: expect.stringContaining('"province":"Da Nang"'),
        }),
      }),
    );
  });

  it('saves permission matrix successfully and reports backend failures', async () => {
    const user = userEvent.setup();
    setAdminSession();
    mocks.matrix = createMatrix(false);
    mocks.updateMatrixMutation.mutateAsync.mockResolvedValue(createMatrix(true));

    renderWithProviders(<CourierPermissionMatrixPage />);

    const courierCard = screen
      .getByText(/shipper\/courier thao tác/i)
      .closest('article') as HTMLElement;
    await user.click(
      within(courierCard).getByRole('button', { name: /bật tất cả/i }),
    );
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    expect(
      await screen.findByText(/đã lưu ma trận phân quyền chung lên backend/i),
    ).toBeInTheDocument();

    mocks.updateMatrixMutation.mutateAsync.mockRejectedValueOnce(
      new Error('backend down'),
    );

    const opsCard = screen
      .getByText(/nhân sự điều hành\/hub/i)
      .closest('article') as HTMLElement;
    await user.click(
      within(opsCard).getByRole('button', { name: /tắt tất cả/i }),
    );
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/không lưu được ma trận phân quyền: backend down/i);
  });

  it('shows backend permission error without prototype fallback and disables edits', async () => {
    const user = userEvent.setup();
    setAdminSession();
    mocks.matrixError = new Error('permission API down');

    renderWithProviders(<CourierPermissionMatrixPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /không tải được phân quyền từ backend: permission api down/i,
    );
    expect(screen.getByRole('button', { name: /tải lại/i })).toBeInTheDocument();

    for (const button of screen.getAllByRole('button', { name: /bật tất cả/i })) {
      expect(button).toBeDisabled();
    }

    expect(screen.getByRole('button', { name: /lưu thay đổi/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));
    expect(mocks.updateMatrixMutation.mutateAsync).not.toHaveBeenCalled();
  });
});
