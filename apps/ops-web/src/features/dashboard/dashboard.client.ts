import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  DashboardFilters,
  DashboardKpiDto,
  DashboardMetricPointDto,
} from './dashboard.types';

interface DashboardOpsViewResponse {
  metricDate: string;
  sourceType: string;
  totals: Record<string, unknown> | null;
}

interface DashboardDailyResponse {
  courierCode?: string;
  hubCode?: string;
  zoneCode?: string;
  shipmentsCreated?: number;
}

interface DashboardMonthlyResponse {
  monthKey?: string;
  shipmentsCreated?: number;
}

function buildDashboardPath(
  basePath: string,
  filters: DashboardFilters,
  includeMonthParam = false,
): string {
  const params = new URLSearchParams();

  if (filters.date?.trim()) {
    const date = filters.date.trim();
    if (includeMonthParam) {
      params.set('month', date.slice(0, 7));
    } else {
      params.set('date', date);
    }
  }

  if (filters.hubCode?.trim()) {
    params.set('hubCode', filters.hubCode.trim());
  }

  if (filters.zoneCode?.trim()) {
    params.set('zoneCode', filters.zoneCode.trim());
  }

  if (filters.courierId?.trim()) {
    params.set('courierCode', filters.courierId.trim());
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function mapKpis(payload: DashboardOpsViewResponse): DashboardKpiDto {
  return {
    metricDate: payload.metricDate,
    sourceType: payload.sourceType,
    ...(payload.totals ?? {}),
  };
}

function mapDailyMetrics(items: DashboardDailyResponse[]): DashboardMetricPointDto[] {
  return items.map((item) => ({
    label:
      item.courierCode ??
      item.hubCode ??
      item.zoneCode ??
      'ALL',
    value: typeof item.shipmentsCreated === 'number' ? item.shipmentsCreated : 0,
  }));
}

function mapMonthlyMetrics(items: DashboardMonthlyResponse[]): DashboardMetricPointDto[] {
  return items.map((item) => ({
    label: item.monthKey ?? 'N/A',
    value: typeof item.shipmentsCreated === 'number' ? item.shipmentsCreated : 0,
  }));
}

export const dashboardClient = {
  kpis: (accessToken: string | null, filters: DashboardFilters): Promise<DashboardKpiDto> =>
    opsApiClient
      .request<DashboardOpsViewResponse>(
      buildDashboardPath(opsEndpoints.dashboard.kpis, filters),
      { accessToken },
    )
      .then(mapKpis),
  dailyMetrics: (
    accessToken: string | null,
    filters: DashboardFilters,
  ): Promise<DashboardMetricPointDto[]> =>
    opsApiClient
      .request<DashboardDailyResponse[]>(
      buildDashboardPath(opsEndpoints.dashboard.dailyMetrics, filters),
      { accessToken },
    )
      .then(mapDailyMetrics),
  monthlyMetrics: (
    accessToken: string | null,
    filters: DashboardFilters,
  ): Promise<DashboardMetricPointDto[]> =>
    opsApiClient
      .request<DashboardMonthlyResponse[]>(
      buildDashboardPath(opsEndpoints.dashboard.monthlyMetrics, filters, true),
      { accessToken },
    )
      .then(mapMonthlyMetrics),
};
