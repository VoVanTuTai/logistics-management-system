import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AdminNdrCaseDto,
  AdminShipmentDto,
  DashboardReportFilters,
  OpsDashboardViewDto,
} from './reporting.types';

function buildQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue?.trim();

    if (!value) {
      continue;
    }

    params.set(key, value);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const reportingClient = {
  getOpsDashboard: (
    accessToken: string | null,
    filters: DashboardReportFilters = {},
  ): Promise<OpsDashboardViewDto> =>
    opsApiClient.request<OpsDashboardViewDto>(
      `${opsEndpoints.dashboard.kpis}${buildQueryString({
        date: filters.date,
        hubCode: filters.hubCode,
        courierCode: filters.courierCode,
        zoneCode: filters.zoneCode,
      })}`,
      { accessToken },
    ),
  listShipments: (accessToken: string | null): Promise<AdminShipmentDto[]> =>
    opsApiClient.request<AdminShipmentDto[]>(opsEndpoints.shipments.list, {
      accessToken,
    }),
  listNdrCases: (accessToken: string | null): Promise<AdminNdrCaseDto[]> =>
    opsApiClient.request<AdminNdrCaseDto[]>(opsEndpoints.ndr.list, {
      accessToken,
    }),
};
