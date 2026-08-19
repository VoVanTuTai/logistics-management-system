import React, { Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAdminUsersQuery } from '../../features/auth/auth.api';
import type { AdminUserDto } from '../../features/auth/auth.types';
import {
  useConfigsQuery,
  useHubsQuery,
  useNdrReasonsQuery,
  useRegionalHierarchyQuery,
  useZonesQuery,
} from '../../features/masterdata/masterdata.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { BusinessOperationsSection } from './components/BusinessOperationsSection';

interface DashboardStat {
  label: string;
  value: string;
  description: string;
  icon: string;
  badge: string;
  color: string;
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
  const regionalHierarchyQuery = useRegionalHierarchyQuery(accessToken);

  const queryStates = [
    opsUsersQuery,
    shipperUsersQuery,
    merchantUsersQuery,
    hubsQuery,
    zonesQuery,
    ndrReasonsQuery,
    configsQuery,
    regionalHierarchyQuery,
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
        description: `${formatCount(activeUsers)} Hoạt động / ${formatCount(disabledUsers)} Vô hiệu`,
        icon: 'group',
        badge: 'Hệ thống RBAC',
        color: '#4f46e5',
      },
      {
        label: 'Tài khoản Ops',
        value: formatCount(opsUsers.length),
        description: 'Nhóm vận hành nội bộ',
        icon: 'admin_panel_settings',
        badge: 'Vận hành',
        color: '#0284c7',
      },
      {
        label: 'Tài khoản Shipper',
        value: formatCount(shipperUsers.length),
        description: 'Nhân sự giao nhận / Courier',
        icon: 'local_shipping',
        badge: 'Giao nhận',
        color: '#059669',
      },
      {
        label: 'Tài khoản Merchant',
        value: formatCount(merchantUsers.length),
        description: 'Khách hàng / Đối tác gửi đơn',
        icon: 'storefront',
        badge: 'Khách hàng',
        color: '#d97706',
      },
      {
        label: 'Hub',
        value: formatCount(hubs.length),
        description: `${formatCount(activeHubs)} Hoạt động / ${formatCount(inactiveHubs)} Tắt`,
        icon: 'hub',
        badge: 'Bưu cục',
        color: '#7c3aed',
      },
      {
        label: 'Zone Hoạt động',
        value: formatCount(activeZones),
        description: `${formatCount(zones.length)} Zone phân vùng toàn quốc`,
        icon: 'map',
        badge: 'Khu vực',
        color: '#0d9488',
      },
      {
        label: 'Lý do NDR Active',
        value: formatCount(activeNdrReasons),
        description: `${formatCount(ndrReasons.length)} lý do không giao được`,
        icon: 'report_problem',
        badge: 'Sự cố đơn',
        color: '#ea580c',
      },
      {
        label: 'Cấu hình Masterdata',
        value: formatCount(configs.length),
        description: 'Tham số hệ thống dùng chung',
        icon: 'settings_suggest',
        badge: 'Cấu hình',
        color: '#475569',
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
    { label: 'Quản lý tài khoản Ops', subtitle: 'Phân quyền & tài khoản vận hành nội bộ', icon: 'manage_accounts', to: routePaths.opsUsers },
    { label: 'Quản lý tài khoản Shipper', subtitle: 'Tài khoản ứng dụng courier giao hàng', icon: 'badge', to: routePaths.shipperUsers },
    { label: 'Quản lý tài khoản Merchant', subtitle: 'Cấu hình tài khoản & hồ sơ khách hàng gửi đơn', icon: 'storefront', to: routePaths.merchantUsers },
    { label: 'Quản lý phân quyền mobile', subtitle: 'Phân quyền tính năng ứng dụng mobile', icon: 'phonelink_lock', to: routePaths.courierPermissions },
    { label: 'Quản lý Hub', subtitle: 'Mạng lưới bưu cục tổng và cấp tỉnh', icon: 'hub', to: routePaths.masterdataHubs },
    { label: 'Quản lý Zone', subtitle: 'Phân vùng và phân tầng khu vực', icon: 'map', to: routePaths.masterdataZones },
    { label: 'Quản lý lý do NDR', subtitle: 'Cấu hình mã lý do không giao được đơn', icon: 'report_problem', to: routePaths.masterdataNdrReasons },
    { label: 'Quản lý cấu hình', subtitle: 'Cấu hình biểu phí và hệ thống masterdata', icon: 'tune', to: routePaths.masterdataConfigs },
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
          <article key={item.label} className="admin-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `4px solid ${item.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <small style={{ fontWeight: 600, color: '#64748b', fontSize: '13px' }}>{item.label}</small>
              <span className="material-symbols-outlined" style={{ color: item.color, fontSize: '22px' }}>
                {item.icon}
              </span>
            </div>
            <strong style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
              {isLoading ? '...' : item.value}
            </strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{isLoading ? 'Đang tải dữ liệu' : item.description}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: `${item.color}15`, color: item.color }}>
                {item.badge}
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* Báo cáo Mạng lưới Hub 3 Miền Toàn quốc */}
      <section style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              Báo Cáo Mạng Lưới Hub 3 Miền & Phụ Trách Phủ Sóng Toàn Quốc
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Hệ thống Thống kê Phân cấp 3 Tầng: Hub Tổng Khu Vực (Miền Bắc, Trung, Nam) ➔ Bưu cục Cấp Tỉnh ➔ 63 Tỉnh/Thành
            </p>
          </div>
          <Link
            to={routePaths.masterdataHubs}
            style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}
          >
            Quản lý Bưu cục ➔
          </Link>
        </div>

        {regionalHierarchyQuery.isLoading ? <p>Đang tải báo cáo tổng quan 3 miền...</p> : null}
        {regionalHierarchyQuery.isSuccess && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {(regionalHierarchyQuery.data ?? []).map((region) => (
              <div
                key={region.regionKey}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                    Zone {region.zoneCode}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>● Hoạt động</span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                  {region.regionName}
                </h4>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                  Hub Tổng: <strong>{region.regionalHub?.name ?? 'Hub Khu vực'}</strong> ({region.regionalHub?.code ?? 'N/A'})
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <span>Phủ sóng: <strong>{region.provincesCount} Tỉnh/Thành</strong></span>
                  <span>Bưu cục Tỉnh: <strong>{region.branchHubsCount} Hub</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
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

      <section className="admin-link-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', margin: '20px 0' }}>
        {quickLinks.map((item) => (
          <Link key={item.label} to={item.to} className="admin-link-tile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.15s ease' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4f46e5', padding: '8px', backgroundColor: '#eef2ff', borderRadius: '8px' }}>
              {item.icon}
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{item.label}</strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{item.subtitle}</span>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>
              arrow_forward_ios
            </span>
          </Link>
        ))}
      </section>

      <BusinessOperationsSection
        hubs={hubsQuery.data ?? []}
        ndrReasons={ndrReasonsQuery.data ?? []}
      />
    </div>
  );
}
