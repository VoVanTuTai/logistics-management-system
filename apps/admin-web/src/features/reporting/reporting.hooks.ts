import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { reportingClient } from './reporting.client';
import type { DashboardReportFilters } from './reporting.types';

export function useOpsDashboardQuery(
  accessToken: string | null,
  filters: DashboardReportFilters = {},
) {
  return useQuery({
    queryKey: [
      ...queryKeys.dashboard,
      filters.date ?? '',
      filters.hubCode ?? '',
      filters.courierCode ?? '',
      filters.zoneCode ?? '',
    ],
    queryFn: () => reportingClient.getOpsDashboard(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useAdminShipmentsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.shipments,
    queryFn: () => reportingClient.listShipments(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useAdminNdrCasesQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.ndr,
    queryFn: () => reportingClient.listNdrCases(accessToken),
    enabled: Boolean(accessToken),
  });
}
