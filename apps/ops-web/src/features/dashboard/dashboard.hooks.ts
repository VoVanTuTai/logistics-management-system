import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { dashboardClient } from './dashboard.client';
import type { DashboardFilters } from './dashboard.types';

function filterKey(filters: DashboardFilters): string {
  return JSON.stringify({
    date: filters.date ?? '',
    hubCode: filters.hubCode ?? '',
    zoneCode: filters.zoneCode ?? '',
    courierId: filters.courierId ?? '',
  });
}

export function useDashboardKpisQuery(accessToken: string | null, filters: DashboardFilters) {
  return useQuery({
    queryKey: [...queryKeys.dashboard, 'kpis', filterKey(filters)],
    queryFn: () => dashboardClient.kpis(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useDashboardDailyMetricsQuery(
  accessToken: string | null,
  filters: DashboardFilters,
) {
  return useQuery({
    queryKey: [...queryKeys.dashboard, 'daily-metrics', filterKey(filters)],
    queryFn: () => dashboardClient.dailyMetrics(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useDashboardMonthlyMetricsQuery(
  accessToken: string | null,
  filters: DashboardFilters,
) {
  return useQuery({
    queryKey: [...queryKeys.dashboard, 'monthly-metrics', filterKey(filters)],
    queryFn: () => dashboardClient.monthlyMetrics(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}
