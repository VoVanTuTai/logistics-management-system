import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  useDashboardDailyMetricsQuery,
  useDashboardKpisQuery,
  useDashboardMonthlyMetricsQuery,
} from '../../features/dashboard/dashboard.api';
import type { DashboardFilters } from '../../features/dashboard/dashboard.types';
import { authClient } from '../../features/auth/auth.client';
import type { OpsUserDto } from '../../features/auth/auth.types';
import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatUserStatusLabel } from '../../utils/logisticsLabels';
import { DashboardFiltersForm } from './DashboardFiltersForm';
import { DashboardMetricsTable } from './DashboardMetricsTable';
import { KpiCards } from './KpiCards';
import { DashboardBarChart } from './charts/DashboardBarChart';
import { DashboardTrendChart } from './charts/DashboardTrendChart';
import './DashboardPage.css';

interface HubAddressPayload {
  addressLine: string;
  district: string;
  province: string;
  workingRadiusKm: string;
  serviceAreas: string[];
}

function parseHubAddress(address: string | null): HubAddressPayload {
  if (!address) {
    return {
      addressLine: '',
      district: '',
      province: '',
      workingRadiusKm: '',
      serviceAreas: [],
    };
  }

  try {
    const parsed = JSON.parse(address) as Record<string, unknown>;
    return {
      addressLine: typeof parsed.addressLine === 'string' ? parsed.addressLine : '',
      district: typeof parsed.district === 'string' ? parsed.district : '',
      province: typeof parsed.province === 'string' ? parsed.province : '',
      workingRadiusKm:
        typeof parsed.workingRadiusKm === 'string' ? parsed.workingRadiusKm : '',
      serviceAreas: Array.isArray(parsed.serviceAreas)
        ? parsed.serviceAreas
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [],
    };
  } catch {
    const segments = address
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return {
      addressLine: segments.slice(0, -2).join(', '),
      district: segments.length >= 2 ? segments[segments.length - 2] : '',
      province: segments.length >= 1 ? segments[segments.length - 1] : '',
      workingRadiusKm: '',
      serviceAreas: [],
    };
  }
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function dedupeCodes(codes: string[]): string[] {
  return Array.from(
    new Set(
      codes
        .map((code) => normalizeCode(code))
        .filter((code) => code.length > 0),
    ),
  );
}

export function DashboardPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipperSearch, setShipperSearch] = useState('');
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const currentRoles = session?.user.roles ?? [];
  const assignedHubCodes = dedupeCodes(session?.user.hubCodes ?? []);
  const canViewAllHubData = currentRoles.includes('SYSTEM_ADMIN');
  const rawFilters: DashboardFilters = {
    date: searchParams.get('date') ?? undefined,
    hubCode: searchParams.get('hubCode') ?? undefined,
    zoneCode: searchParams.get('zoneCode') ?? undefined,
    courierId: searchParams.get('courierId') ?? undefined,
  };

  const effectiveHubCode = useMemo(() => {
    const requestedHubCode = rawFilters.hubCode
      ? normalizeCode(rawFilters.hubCode)
      : '';

    if (canViewAllHubData) {
      return requestedHubCode || undefined;
    }

    if (assignedHubCodes.length === 0) {
      return undefined;
    }

    if (!requestedHubCode || !assignedHubCodes.includes(requestedHubCode)) {
      return assignedHubCodes[0];
    }

    return requestedHubCode;
  }, [assignedHubCodes, canViewAllHubData, rawFilters.hubCode]);

  const effectiveFilters: DashboardFilters = useMemo(
    () => ({
      date: rawFilters.date,
      hubCode: effectiveHubCode,
      zoneCode: rawFilters.zoneCode,
      courierId: rawFilters.courierId,
    }),
    [effectiveHubCode, rawFilters.courierId, rawFilters.date, rawFilters.zoneCode],
  );

  const hubsQuery = useHubsQuery(accessToken, {});
  const kpiQuery = useDashboardKpisQuery(accessToken, effectiveFilters);
  const dailyMetricsQuery = useDashboardDailyMetricsQuery(accessToken, effectiveFilters);
  const monthlyMetricsQuery = useDashboardMonthlyMetricsQuery(accessToken, effectiveFilters);
  const shipperQuery = useQuery({
    queryKey: [
      'dashboard',
      'shippers',
      effectiveHubCode ?? '',
      shipperSearch.trim().toLowerCase(),
    ],
    queryFn: () =>
      authClient.listUsers(accessToken, {
        roleGroup: 'SHIPPER',
        hubCode: effectiveHubCode,
        q: shipperSearch.trim() || undefined,
      }),
    enabled: Boolean(accessToken && effectiveHubCode),
  });

  const hubOptions = useMemo(() => {
    if (!canViewAllHubData) {
      return assignedHubCodes;
    }

    const fromMasterData = (hubsQuery.data ?? []).map((hub) => normalizeCode(hub.code));
    return dedupeCodes(fromMasterData);
  }, [assignedHubCodes, canViewAllHubData, hubsQuery.data]);

  const scopedHubs = useMemo(() => {
    if (canViewAllHubData) {
      return hubsQuery.data ?? [];
    }

    const assignedSet = new Set(assignedHubCodes);
    return (hubsQuery.data ?? []).filter((hub) =>
      assignedSet.has(normalizeCode(hub.code)),
    );
  }, [assignedHubCodes, canViewAllHubData, hubsQuery.data]);

  const currentHub = useMemo(() => {
    if (scopedHubs.length === 0) {
      return null;
    }

    if (!effectiveHubCode) {
      return scopedHubs[0];
    }

    return (
      scopedHubs.find((hub) => normalizeCode(hub.code) === effectiveHubCode) ??
      scopedHubs[0]
    );
  }, [effectiveHubCode, scopedHubs]);

  const currentHubAddress = parseHubAddress(currentHub?.address ?? null);
  const currentHubAddressText = [
    currentHubAddress.addressLine,
    currentHubAddress.district,
    currentHubAddress.province,
  ]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(', ');
  const currentHubScopeText = [
    currentHubAddress.workingRadiusKm
      ? `Bán kính ${currentHubAddress.workingRadiusKm.trim()} km`
      : '',
    currentHubAddress.serviceAreas.join(', '),
  ]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(' | ');

  const onApplyFilters = (nextFilters: DashboardFilters) => {
    const next = new URLSearchParams();
    const normalizedHubCode = nextFilters.hubCode
      ? normalizeCode(nextFilters.hubCode)
      : '';
    const resolvedHubCode = canViewAllHubData
      ? normalizedHubCode
      : assignedHubCodes.includes(normalizedHubCode)
      ? normalizedHubCode
      : assignedHubCodes[0] ?? '';

    if (nextFilters.date) {
      next.set('date', nextFilters.date);
    }

    if (resolvedHubCode) {
      next.set('hubCode', resolvedHubCode);
    }

    if (nextFilters.zoneCode) {
      next.set('zoneCode', nextFilters.zoneCode);
    }

    if (nextFilters.courierId) {
      next.set('courierId', nextFilters.courierId);
    }

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    const next = new URLSearchParams();
    if (!canViewAllHubData && assignedHubCodes.length > 0) {
      next.set('hubCode', assignedHubCodes[0]);
    }
    setSearchParams(next, { replace: true });
  };

  const kpiData = kpiQuery.data ?? null;
  const kpiEntries = kpiData ? Object.entries(kpiData) : [];
  const dailyData = dailyMetricsQuery.data ?? [];
  const monthlyData = monthlyMetricsQuery.data ?? [];
  const shippers = shipperQuery.data ?? [];
  const quickMenu = [
    {
      title: 'Danh sách vận đơn',
      description: 'Theo dõi và rà soát lượng vận đơn.',
      to: routePaths.shipments,
      icon: 'S',
    },
    {
      title: 'Duyệt lấy hàng',
      description: 'Duyệt hoặc từ chối yêu cầu lấy hàng.',
      to: routePaths.pickups,
      icon: 'P',
    },
    {
      title: 'Phân công tác vụ',
      description: 'Phân công và phân công lại tác vụ.',
      to: routePaths.tasks,
      icon: 'T',
    },
    {
      title: 'Quản lý bao tải',
      description: 'Tạo và xử lý bao tải trung chuyển.',
      to: routePaths.manifests,
      icon: 'M',
    },
    {
      title: 'Quét hub',
      description: 'Gửi quét nhập hub và xuất hub.',
      to: routePaths.scans,
      icon: 'H',
    },
    {
      title: 'Xử lý NDR',
      description: 'Xử lý các hành động tiếp theo của NDR.',
      to: routePaths.ndr,
      icon: 'N',
    },
    {
      title: 'Tra cứu hành trình',
      description: 'Tra cứu nhanh trạng thái vận đơn.',
      to: routePaths.tracking,
      icon: 'L',
    },
  ] as const;
  const notices = [
    'Bảng tổng quan chỉ hiển thị dữ liệu tổng hợp từ backend.',
    'Tài khoản điều hành được giới hạn theo hub đã gán.',
    'Nếu cần thay đổi phạm vi hub, vui lòng cập nhật trong trang quản trị.',
  ] as const;
  const quickApps = [
    { title: 'Tổng quan', to: routePaths.dashboard },
    { title: 'Vận đơn', to: routePaths.shipments },
    { title: 'Duyệt lấy hàng', to: routePaths.pickups },
  ] as const;

  return (
    <div className="ops-dashboard">
      <section className="ops-dashboard__hero">
        <div>
          <p className="ops-dashboard__hero-kicker">Trung tâm điều hành OPS</p>
          <h2 className="ops-dashboard__hero-title">Trang tổng quan vận hàng JMS</h2>
          <p className="ops-dashboard__hero-subtitle">
            Báo cáo KPI theo HUB được gắn cho tài khoản điều hành và các điểm vào tác vụ vận hành.
          </p>
        </div>
        <div className="ops-dashboard__hero-badge">
          <small>Hub dang theo doi</small>
          <strong>{currentHub?.code ?? effectiveHubCode ?? 'Chưa gán'}</strong>
        </div>
      </section>

      <section className="ops-dashboard__content">
        <div className="ops-dashboard__main">
          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Danh muc chinh</h3>
            </header>
            <div className="ops-menu-grid">
              {quickMenu.map((item) => (
                <Link key={item.title} to={item.to} className="ops-menu-tile">
                  <span className="ops-menu-tile__icon">{item.icon}</span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </Link>
              ))}
            </div>
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Bo loc bao cao</h3>
            </header>
            <p className="ops-dashboard__subtitle">
              Du lieu bao cao luon duoc gioi han theo hub cua tai khoan điều hành.
            </p>
            <DashboardFiltersForm
              filters={effectiveFilters}
              onApply={onApplyFilters}
              onReset={onResetFilters}
              hubOptions={hubOptions}
              lockHubCode={!canViewAllHubData && assignedHubCodes.length <= 1}
            />
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Hub dang quan ly</h3>
            </header>
            {hubsQuery.isLoading ? <p className="ops-state">Đang tải thong tin hub...</p> : null}
            {hubsQuery.isError ? (
              <p className="ops-state ops-state--error">{getErrorMessage(hubsQuery.error)}</p>
            ) : null}
            {hubsQuery.isSuccess && !currentHub ? (
              <p className="ops-state">
                Tai khoan chua duoc gan hub. Vui long gan hub trong trang quản trị.
              </p>
            ) : null}
            {currentHub ? (
              <div className="ops-hub-card">
                <div>
                  <small>Mã hub</small>
                  <strong>{currentHub.code}</strong>
                </div>
                <div>
                  <small>Tên hub</small>
                  <strong>{currentHub.name}</strong>
                </div>
                <div>
                  <small>Khu vuc</small>
                  <strong>{currentHub.zoneCode ?? 'Không có'}</strong>
                </div>
                <div>
                  <small>Dia chi</small>
                  <strong>{currentHubAddressText || 'Không có'}</strong>
                </div>
                <div>
                  <small>Pham vi phuc vu</small>
                  <strong>{currentHubScopeText || 'Không có'}</strong>
                </div>
              </div>
            ) : null}
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Danh sach nhan vien giao theo hub</h3>
            </header>
            <div className="ops-shipper-tools">
              <input
                placeholder="Tìm tên đăng nhập / tên hiển thị / số điện thoại"
                value={shipperSearch}
                onChange={(event) => setShipperSearch(event.target.value)}
              />
            </div>
            {!effectiveHubCode ? (
              <p className="ops-state">Tai khoan chua duoc gan hub, nen chua the tai danh sach nhan vien giao.
              </p>
            ) : null}
            {shipperQuery.isLoading ? <p className="ops-state">Đang tải danh sach nhan vien giao...</p> : null}
            {shipperQuery.isError ? (
              <p className="ops-state ops-state--error">{getErrorMessage(shipperQuery.error)}</p>
            ) : null}
            {shipperQuery.isSuccess && shippers.length === 0 ? (
              <p className="ops-state">Không có nhan vien giao nao thuoc hub hien tai.</p>
            ) : null}
            {shippers.length > 0 ? (
              <table className="ops-shipper-table">
                <thead>
                  <tr>
                    <th>Tên đăng nhập</th>
                    <th>Ten hien thi</th>
                    <th>So dien thoai</th>
                    <th>Trạng thái</th>
                    <th>Danh sach hub</th>
                  </tr>
                </thead>
                <tbody>
                  {shippers.map((shipper: OpsUserDto) => (
                    <tr key={shipper.id}>
                      <td>{shipper.username}</td>
                      <td>{shipper.displayName ?? '-'}</td>
                      <td>{shipper.phone ?? '-'}</td>
                      <td>{formatUserStatusLabel(shipper.status)}</td>
                      <td>{shipper.hubCodes.join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Bo KPI</h3>
            </header>
            {kpiQuery.isLoading ? <p className="ops-state">Đang tải KPI...</p> : null}
            {kpiQuery.isError ? (
              <p className="ops-state ops-state--error">{getErrorMessage(kpiQuery.error)}</p>
            ) : null}
            {kpiQuery.isSuccess && kpiEntries.length === 0 ? (
              <p className="ops-state">Không có du lieu KPI.</p>
            ) : null}
            {kpiEntries.length > 0 ? <KpiCards kpis={kpiData ?? {}} /> : null}
          </article>

          <section className="ops-dashboard__metric-block">
            <header className="ops-card__header">
              <h3>Chi so theo ngay</h3>
            </header>
            {dailyMetricsQuery.isLoading ? (
              <p className="ops-state">Đang tải chi so ngay...</p>
            ) : null}
            {dailyMetricsQuery.isError ? (
              <p className="ops-state ops-state--error">
                {getErrorMessage(dailyMetricsQuery.error)}
              </p>
            ) : null}
            {dailyMetricsQuery.isSuccess && dailyData.length === 0 ? (
              <p className="ops-state">Không có chi so theo ngay.</p>
            ) : null}
            {dailyData.length > 0 ? (
              <div className="ops-dashboard__metrics-grid">
                <DashboardBarChart title="Biểu đồ chỉ số ngày" points={dailyData} />
                <DashboardMetricsTable title="Bảng chỉ số ngày" rows={dailyData} />
              </div>
            ) : null}
          </section>

          <section className="ops-dashboard__metric-block">
            <header className="ops-card__header">
              <h3>Chi so theo thang</h3>
            </header>
            {monthlyMetricsQuery.isLoading ? (
              <p className="ops-state">Đang tải chi so thang...</p>
            ) : null}
            {monthlyMetricsQuery.isError ? (
              <p className="ops-state ops-state--error">
                {getErrorMessage(monthlyMetricsQuery.error)}
              </p>
            ) : null}
            {monthlyMetricsQuery.isSuccess && monthlyData.length === 0 ? (
              <p className="ops-state">Không có chi so theo thang.</p>
            ) : null}
            {monthlyData.length > 0 ? (
              <div className="ops-dashboard__metrics-grid">
                <DashboardTrendChart title="Biểu đồ chỉ số tháng" points={monthlyData} />
                <DashboardMetricsTable title="Bảng chỉ số tháng" rows={monthlyData} />
              </div>
            ) : null}
          </section>
        </div>

        <aside className="ops-dashboard__side">
          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Thong bao</h3>
            </header>
            <ul className="ops-notice-list">
              {notices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Ung dung nhanh</h3>
            </header>
            <div className="ops-quickapps">
              {quickApps.map((item) => (
                <Link key={item.title} to={item.to} className="ops-quickapps__link">
                  {item.title}
                </Link>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}


