import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  useDashboardDailyMetricsQuery,
  useDashboardKpisQuery,
  useDashboardMonthlyMetricsQuery,
} from '../../features/dashboard/dashboard.api';
import type { DashboardFilters } from '../../features/dashboard/dashboard.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { DashboardFiltersForm } from './DashboardFiltersForm';
import { DashboardMetricsTable } from './DashboardMetricsTable';
import { KpiCards } from './KpiCards';
import { DashboardBarChart } from './charts/DashboardBarChart';
import { DashboardTrendChart } from './charts/DashboardTrendChart';
import './DashboardPage.css';

export function DashboardPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const filters: DashboardFilters = {
    date: searchParams.get('date') ?? undefined,
    hubCode: searchParams.get('hubCode') ?? undefined,
    zoneCode: searchParams.get('zoneCode') ?? undefined,
    courierId: searchParams.get('courierId') ?? undefined,
  };
  const kpiQuery = useDashboardKpisQuery(accessToken, filters);
  const dailyMetricsQuery = useDashboardDailyMetricsQuery(accessToken, filters);
  const monthlyMetricsQuery = useDashboardMonthlyMetricsQuery(accessToken, filters);

  const onApplyFilters = (nextFilters: DashboardFilters) => {
    const next = new URLSearchParams();

    if (nextFilters.date) {
      next.set('date', nextFilters.date);
    }

    if (nextFilters.hubCode) {
      next.set('hubCode', nextFilters.hubCode);
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
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const kpiData = kpiQuery.data ?? null;
  const kpiEntries = kpiData ? Object.entries(kpiData) : [];
  const dailyData = dailyMetricsQuery.data ?? [];
  const monthlyData = monthlyMetricsQuery.data ?? [];
  const quickMenu = [
    {
      title: 'Danh sách vận đơn',
      description: 'Theo dõi và rà soát luồng vận đơn.',
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
      title: 'Trung tâm manifest',
      description: 'Tạo và xử lý manifest.',
      to: routePaths.manifests,
      icon: 'M',
    },
    {
      title: 'Quét hub',
      description: 'Gửi quét inbound và outbound.',
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
    'Thẻ KPI chỉ hiển thị đúng payload từ reporting-service.',
    'Áp dụng bộ lọc ngày, hub, zone, courier để làm mới báo cáo.',
    'Trang tổng quan không tự tính KPI ở phía client.',
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
          <p className="ops-dashboard__hero-kicker">Trung tâm điều hành Ops</p>
          <h2 className="ops-dashboard__hero-title">Trang tổng quan vận hành JMS</h2>
          <p className="ops-dashboard__hero-subtitle">
            Màn hình báo cáo qua gateway-bff với bộ lọc gọn nhẹ và các điểm vào tác vụ vận hành.
          </p>
        </div>
        <div className="ops-dashboard__hero-badge">
          <small>Trạng thái ca</small>
          <strong>Giám sát thời gian thực</strong>
        </div>
      </section>

      <section className="ops-dashboard__content">
        <div className="ops-dashboard__main">
          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Menu chính</h3>
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
              <h3>Bộ lọc báo cáo</h3>
            </header>
            <p className="ops-dashboard__subtitle">
              Trang tổng quan hiển thị dữ liệu từ reporting-service qua gateway-bff, không tự
              tính KPI cục bộ.
            </p>
            <DashboardFiltersForm
              filters={filters}
              onApply={onApplyFilters}
              onReset={onResetFilters}
            />
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Thẻ KPI</h3>
            </header>
            {kpiQuery.isLoading ? <p className="ops-state">Đang tải KPI...</p> : null}
            {kpiQuery.isError ? (
              <p className="ops-state ops-state--error">{getErrorMessage(kpiQuery.error)}</p>
            ) : null}
            {kpiQuery.isSuccess && kpiEntries.length === 0 ? (
              <p className="ops-state">Không có dữ liệu KPI.</p>
            ) : null}
            {kpiEntries.length > 0 ? <KpiCards kpis={kpiData ?? {}} /> : null}
          </article>

          <section className="ops-dashboard__metric-block">
            <header className="ops-card__header">
              <h3>Chỉ số theo ngày</h3>
            </header>
            {dailyMetricsQuery.isLoading ? (
              <p className="ops-state">Đang tải chỉ số ngày...</p>
            ) : null}
            {dailyMetricsQuery.isError ? (
              <p className="ops-state ops-state--error">
                {getErrorMessage(dailyMetricsQuery.error)}
              </p>
            ) : null}
            {dailyMetricsQuery.isSuccess && dailyData.length === 0 ? (
              <p className="ops-state">Không có chỉ số theo ngày.</p>
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
              <h3>Chỉ số theo tháng</h3>
            </header>
            {monthlyMetricsQuery.isLoading ? (
              <p className="ops-state">Đang tải chỉ số tháng...</p>
            ) : null}
            {monthlyMetricsQuery.isError ? (
              <p className="ops-state ops-state--error">
                {getErrorMessage(monthlyMetricsQuery.error)}
              </p>
            ) : null}
            {monthlyMetricsQuery.isSuccess && monthlyData.length === 0 ? (
              <p className="ops-state">Không có chỉ số theo tháng.</p>
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
              <h3>Thông báo</h3>
            </header>
            <ul className="ops-notice-list">
              {notices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Ứng dụng nhanh</h3>
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
