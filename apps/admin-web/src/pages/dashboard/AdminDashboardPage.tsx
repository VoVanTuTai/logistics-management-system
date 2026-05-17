import React, { Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAdminUsersQuery } from '../../features/auth/auth.api';
import type { AdminUserDto } from '../../features/auth/auth.types';
import {
  useConfigsQuery,
  useHubsQuery,
  useNdrReasonsQuery,
  useZonesQuery,
} from '../../features/masterdata/masterdata.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';

interface DashboardStat {
  label: string;
  value: string;
  description: string;
}

export interface RoleMixChartPoint {
  name: string;
  value: number;
}

export interface UserStatusChartPoint {
  name: string;
  value: number;
}

export interface MasterdataHealthChartPoint {
  name: string;
  active: number;
  inactive: number;
}

const AdminDashboardCharts = React.lazy(() =>
  import('./AdminDashboardCharts').then((module) => ({
    default: module.AdminDashboardCharts,
  })),
);

interface DashboardChartsErrorBoundaryProps {
  children: React.ReactNode;
}

interface DashboardChartsErrorBoundaryState {
  hasError: boolean;
}

class DashboardChartsErrorBoundary extends React.Component<
  DashboardChartsErrorBoundaryProps,
  DashboardChartsErrorBoundaryState
> {
  state: DashboardChartsErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): DashboardChartsErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <section className="admin-dashboard-status admin-dashboard-status-warning">
          Biểu đồ phân tích đang gặp lỗi tải thư viện, các số liệu KPI vẫn hiển thị bình thường.
        </section>
      );
    }

    return this.props.children;
  }
}

function uniqueUsersById(users: AdminUserDto[]): AdminUserDto[] {
  return Array.from(new Map(users.map((user) => [user.id, user])).values());
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function AdminDashboardPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  const opsUsersQuery = useAdminUsersQuery(accessToken, { roleGroup: 'OPS' });
  const shipperUsersQuery = useAdminUsersQuery(accessToken, { roleGroup: 'SHIPPER' });
  const merchantUsersQuery = useAdminUsersQuery(accessToken, { roleGroup: 'MERCHANT' });
  const hubsQuery = useHubsQuery(accessToken, {});
  const zonesQuery = useZonesQuery(accessToken, {});
  const ndrReasonsQuery = useNdrReasonsQuery(accessToken, {});
  const configsQuery = useConfigsQuery(accessToken, {});

  const queryStates = [
    opsUsersQuery,
    shipperUsersQuery,
    merchantUsersQuery,
    hubsQuery,
    zonesQuery,
    ndrReasonsQuery,
    configsQuery,
  ];

  const isLoading = queryStates.some((query) => query.isLoading);
  const isFetching = queryStates.some((query) => query.isFetching);
  const errors = queryStates
    .filter((query) => query.isError)
    .map((query) => getErrorMessage(query.error));

  const stats = useMemo<DashboardStat[]>(() => {
    const opsUsers = opsUsersQuery.data ?? [];
    const shipperUsers = shipperUsersQuery.data ?? [];
    const merchantUsers = merchantUsersQuery.data ?? [];
    const allUsers = uniqueUsersById([
      ...opsUsers,
      ...shipperUsers,
      ...merchantUsers,
    ]);
    const activeUsers = allUsers.filter((user) => user.status === 'ACTIVE').length;
    const disabledUsers = allUsers.filter((user) => user.status === 'DISABLED').length;

    const hubs = hubsQuery.data ?? [];
    const activeHubs = hubs.filter((hub) => hub.isActive).length;
    const inactiveHubs = hubs.length - activeHubs;

    const zones = zonesQuery.data ?? [];
    const activeZones = zones.filter((zone) => zone.isActive).length;

    const ndrReasons = ndrReasonsQuery.data ?? [];
    const activeNdrReasons = ndrReasons.filter((reason) => reason.isActive).length;

    const configs = configsQuery.data ?? [];

    return [
      {
        label: 'Tổng người dùng',
        value: formatCount(allUsers.length),
        description: `${formatCount(activeUsers)} ACTIVE / ${formatCount(disabledUsers)} DISABLED`,
      },
      {
        label: 'Tài khoản Ops',
        value: formatCount(opsUsers.length),
        description: 'Nhóm vận hành nội bộ',
      },
      {
        label: 'Tài khoản Shipper',
        value: formatCount(shipperUsers.length),
        description: 'Nhân sự giao nhận/courier',
      },
      {
        label: 'Tài khoản Merchant',
        value: formatCount(merchantUsers.length),
        description: 'Khách hàng gửi đơn',
      },
      {
        label: 'Hub',
        value: formatCount(hubs.length),
        description: `${formatCount(activeHubs)} active / ${formatCount(inactiveHubs)} inactive`,
      },
      {
        label: 'Zone active',
        value: formatCount(activeZones),
        description: `${formatCount(zones.length)} zone trong hệ thống`,
      },
      {
        label: 'Lý do NDR active',
        value: formatCount(activeNdrReasons),
        description: `${formatCount(ndrReasons.length)} lý do đã cấu hình`,
      },
      {
        label: 'Cấu hình',
        value: formatCount(configs.length),
        description: 'Bản ghi cấu hình masterdata',
      },
    ];
  }, [
    configsQuery.data,
    hubsQuery.data,
    merchantUsersQuery.data,
    ndrReasonsQuery.data,
    opsUsersQuery.data,
    shipperUsersQuery.data,
    zonesQuery.data,
  ]);
  const charts = useMemo(() => {
    const opsUsers = opsUsersQuery.data ?? [];
    const shipperUsers = shipperUsersQuery.data ?? [];
    const merchantUsers = merchantUsersQuery.data ?? [];
    const allUsers = uniqueUsersById([
      ...opsUsers,
      ...shipperUsers,
      ...merchantUsers,
    ]);

    const hubs = hubsQuery.data ?? [];
    const zones = zonesQuery.data ?? [];
    const ndrReasons = ndrReasonsQuery.data ?? [];
    const configs = configsQuery.data ?? [];

    const activeUsers = allUsers.filter((user) => user.status === 'ACTIVE').length;
    const disabledUsers = allUsers.filter((user) => user.status === 'DISABLED').length;

    const roleMix = [
      { name: 'Ops', value: opsUsers.length },
      { name: 'Shipper', value: shipperUsers.length },
      { name: 'Merchant', value: merchantUsers.length },
    ];

    const userStatus = [
      { name: 'ACTIVE', value: activeUsers },
      { name: 'DISABLED', value: disabledUsers },
    ];

    const masterdataHealth = [
      {
        name: 'Hub',
        active: hubs.filter((hub) => hub.isActive).length,
        inactive: hubs.filter((hub) => !hub.isActive).length,
      },
      {
        name: 'Zone',
        active: zones.filter((zone) => zone.isActive).length,
        inactive: zones.filter((zone) => !zone.isActive).length,
      },
      {
        name: 'NDR',
        active: ndrReasons.filter((reason) => reason.isActive).length,
        inactive: ndrReasons.filter((reason) => !reason.isActive).length,
      },
      {
        name: 'Config',
        active: configs.length,
        inactive: 0,
      },
    ];

    return {
      roleMix,
      userStatus,
      masterdataHealth,
    };
  }, [
    configsQuery.data,
    hubsQuery.data,
    merchantUsersQuery.data,
    ndrReasonsQuery.data,
    opsUsersQuery.data,
    shipperUsersQuery.data,
    zonesQuery.data,
  ]);
  const hasAnyMetricData = stats.some((item) => item.value !== '0');
  const hasUserData = charts.roleMix.some((item) => item.value > 0);
  const hasStatusData = charts.userStatus.some((item) => item.value > 0);
  const hasMasterdataData = charts.masterdataHealth.some(
    (item) => item.active > 0 || item.inactive > 0,
  );
  const statusMessage = (() => {
    if (isLoading) {
      return 'Đang tải số liệu dashboard...';
    }

    if (errors.length > 0) {
      return `Không tải được một phần số liệu: ${Array.from(new Set(errors)).join('; ')}`;
    }

    if (!hasAnyMetricData) {
      return 'Chưa có dữ liệu người dùng hoặc masterdata để thống kê.';
    }

    if (isFetching) {
      return 'Đang đồng bộ số liệu mới...';
    }

    return 'Số liệu được lấy từ API người dùng và masterdata hiện có.';
  })();

  const quickLinks = [
    { label: 'Quản lý tài khoản Ops', to: routePaths.opsUsers },
    { label: 'Quản lý tài khoản Shipper', to: routePaths.shipperUsers },
    { label: 'Quản lý phân quyền mobile', to: routePaths.courierPermissions },
    { label: 'Quản lý Hub', to: routePaths.masterdataHubs },
    { label: 'Quản lý Zone', to: routePaths.masterdataZones },
    { label: 'Quản lý lý do NDR', to: routePaths.masterdataNdrReasons },
    { label: 'Quản lý cấu hình', to: routePaths.masterdataConfigs },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-dashboard-kicker">Quản trị hệ thống</p>
          <h2>Tổng quan admin</h2>
          <p>Điều phối tập trung cho tài khoản, danh mục dùng chung và cấu hình cấp hệ thống.</p>
        </div>
        <div className="admin-user-summary">
          <strong>{session?.user.username ?? 'Không có'}</strong>
          <small>Vai trò: {(session?.user.roles ?? []).join(', ') || 'Không có'}</small>
        </div>
      </section>

      <section className="admin-dashboard-status" aria-live="polite">
        <span>{statusMessage}</span>
      </section>

      <section className="admin-stats-grid">
        {stats.map((item) => (
          <article key={item.label} className="admin-stat-card">
            <small>{item.label}</small>
            <strong>{isLoading ? '...' : item.value}</strong>
            <span>{isLoading ? 'Đang tải dữ liệu' : item.description}</span>
          </article>
        ))}
      </section>

      <DashboardChartsErrorBoundary>
        <Suspense
          fallback={
            <section className="admin-dashboard-status">
              Đang tải biểu đồ phân tích...
            </section>
          }
        >
          <AdminDashboardCharts
            roleMix={charts.roleMix}
            userStatus={charts.userStatus}
            masterdataHealth={charts.masterdataHealth}
            hasUserData={hasUserData}
            hasStatusData={hasStatusData}
            hasMasterdataData={hasMasterdataData}
            formatCount={formatCount}
          />
        </Suspense>
      </DashboardChartsErrorBoundary>

      <section className="admin-link-grid">
        {quickLinks.map((item) => (
          <Link key={item.label} to={item.to} className="admin-link-tile">
            <strong>{item.label}</strong>
            <span>Mở module</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
