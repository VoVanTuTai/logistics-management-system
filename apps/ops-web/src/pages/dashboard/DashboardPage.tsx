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
      title: 'Shipment list',
      description: 'Track and review shipment flow.',
      to: routePaths.shipments,
      icon: 'S',
    },
    {
      title: 'Pickup approvals',
      description: 'Approve or reject pickup requests.',
      to: routePaths.pickups,
      icon: 'P',
    },
    {
      title: 'Task assignment',
      description: 'Assign and reassign courier tasks.',
      to: routePaths.tasks,
      icon: 'T',
    },
    {
      title: 'Manifest center',
      description: 'Create and operate manifests.',
      to: routePaths.manifests,
      icon: 'M',
    },
    {
      title: 'Hub scan',
      description: 'Submit inbound and outbound scans.',
      to: routePaths.scans,
      icon: 'H',
    },
    {
      title: 'NDR handling',
      description: 'Process NDR follow-up actions.',
      to: routePaths.ndr,
      icon: 'N',
    },
    {
      title: 'Tracking lookup',
      description: 'Quick shipment status lookup.',
      to: routePaths.tracking,
      icon: 'L',
    },
  ] as const;
  const notices = [
    'KPI cards are rendered from reporting-service payload only.',
    'Apply date, hub, zone, courier filters to refresh reports.',
    'No client-side KPI calculation is applied on dashboard.',
  ] as const;
  const quickApps = [
    { title: 'Dashboard', to: routePaths.dashboard },
    { title: 'Shipments', to: routePaths.shipments },
    { title: 'Pickups', to: routePaths.pickups },
  ] as const;

  return (
    <div className="ops-dashboard">
      <section className="ops-dashboard__hero">
        <div>
          <p className="ops-dashboard__hero-kicker">Ops Command Center</p>
          <h2 className="ops-dashboard__hero-title">JMS Operations Dashboard</h2>
          <p className="ops-dashboard__hero-subtitle">
            Reporting view from gateway-bff with lightweight filters and operational entry points.
          </p>
        </div>
        <div className="ops-dashboard__hero-badge">
          <small>Shift status</small>
          <strong>Live Monitoring</strong>
        </div>
      </section>

      <section className="ops-dashboard__content">
        <div className="ops-dashboard__main">
          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Main menu</h3>
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
              <h3>Reporting filters</h3>
            </header>
            <p className="ops-dashboard__subtitle">
              Dashboard displays reporting-service data via gateway-bff without local KPI
              calculations.
            </p>
            <DashboardFiltersForm
              filters={filters}
              onApply={onApplyFilters}
              onReset={onResetFilters}
            />
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>KPI cards</h3>
            </header>
            {kpiQuery.isLoading ? <p className="ops-state">Loading KPI...</p> : null}
            {kpiQuery.isError ? (
              <p className="ops-state ops-state--error">{getErrorMessage(kpiQuery.error)}</p>
            ) : null}
            {kpiQuery.isSuccess && kpiEntries.length === 0 ? (
              <p className="ops-state">No KPI data.</p>
            ) : null}
            {kpiEntries.length > 0 ? <KpiCards kpis={kpiData ?? {}} /> : null}
          </article>

          <section className="ops-dashboard__metric-block">
            <header className="ops-card__header">
              <h3>Daily metrics</h3>
            </header>
            {dailyMetricsQuery.isLoading ? <p className="ops-state">Loading daily metrics...</p> : null}
            {dailyMetricsQuery.isError ? (
              <p className="ops-state ops-state--error">
                {getErrorMessage(dailyMetricsQuery.error)}
              </p>
            ) : null}
            {dailyMetricsQuery.isSuccess && dailyData.length === 0 ? (
              <p className="ops-state">No daily metrics.</p>
            ) : null}
            {dailyData.length > 0 ? (
              <div className="ops-dashboard__metrics-grid">
                <DashboardBarChart title="Daily metrics chart" points={dailyData} />
                <DashboardMetricsTable title="Daily metrics table" rows={dailyData} />
              </div>
            ) : null}
          </section>

          <section className="ops-dashboard__metric-block">
            <header className="ops-card__header">
              <h3>Monthly metrics</h3>
            </header>
            {monthlyMetricsQuery.isLoading ? <p className="ops-state">Loading monthly metrics...</p> : null}
            {monthlyMetricsQuery.isError ? (
              <p className="ops-state ops-state--error">
                {getErrorMessage(monthlyMetricsQuery.error)}
              </p>
            ) : null}
            {monthlyMetricsQuery.isSuccess && monthlyData.length === 0 ? (
              <p className="ops-state">No monthly metrics.</p>
            ) : null}
            {monthlyData.length > 0 ? (
              <div className="ops-dashboard__metrics-grid">
                <DashboardTrendChart title="Monthly metrics chart" points={monthlyData} />
                <DashboardMetricsTable title="Monthly metrics table" rows={monthlyData} />
              </div>
            ) : null}
          </section>
        </div>

        <aside className="ops-dashboard__side">
          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Notifications</h3>
            </header>
            <ul className="ops-notice-list">
              {notices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Quick apps</h3>
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
