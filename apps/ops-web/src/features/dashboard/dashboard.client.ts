import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  DashboardFilters,
  DashboardKpiDto,
  DashboardMetricPointDto,
} from './dashboard.types';

interface DashboardOpsViewResponse {
  metricDate?: string;
  sourceType?: string;
  totals?: Record<string, unknown> | null;
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

const KPI_FIELD_ALIASES: Record<string, string[]> = {
  shipmentsCreated: ['shipmentsCreated', 'shipments', 'shipmentCount', 'totalShipments', 'createdCount'],
  pickupsCompleted: ['pickupsCompleted', 'pickupCount', 'pickupCompletedCount'],
  deliveriesDelivered: ['deliveriesDelivered', 'deliveredCount', 'completedCount'],
  deliveriesFailed: ['deliveriesFailed', 'deliveryFailedCount', 'failedCount'],
  ndrCreated: ['ndrCreated', 'ndrCount'],
  scansInbound: ['scansInbound', 'inboundCount'],
  scansOutbound: ['scansOutbound', 'outboundCount'],
  deliveryAttempts: ['deliveryAttempts'],
  successRate: ['successRate'],
  failureRate: ['failureRate'],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function pickMetricValue(payload: Record<string, unknown>, aliases: string[]): number {
  for (const alias of aliases) {
    if (!(alias in payload)) {
      continue;
    }

    const value = toNumber(payload[alias]);
    if (value !== 0 || payload[alias] === 0 || payload[alias] === '0') {
      return value;
    }
  }

  return 0;
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
  const payloadRecord = asRecord(payload);
  const totalsRecord =
    asRecord(payloadRecord?.totals) ??
    asRecord(payloadRecord?.data) ??
    payloadRecord ??
    {};

  return Object.entries(KPI_FIELD_ALIASES).reduce<DashboardKpiDto>((acc, [key, aliases]) => {
    acc[key] = pickMetricValue(totalsRecord, aliases);
    return acc;
  }, {});
}

function mapDailyMetrics(items: DashboardDailyResponse[]): DashboardMetricPointDto[] {
  return items.map((item) => ({
    label:
      item.courierCode ??
      item.hubCode ??
      item.zoneCode ??
      'Tất cả',
    value: typeof item.shipmentsCreated === 'number' ? item.shipmentsCreated : 0,
  }));
}

function mapMonthlyMetrics(items: DashboardMonthlyResponse[]): DashboardMetricPointDto[] {
  return items.map((item) => ({
    label: item.monthKey ?? 'Không có',
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
