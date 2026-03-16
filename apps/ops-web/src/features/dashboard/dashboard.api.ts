import { useQuery } from '@tanstack/react-query';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import type { DashboardKpiDto } from './dashboard.types';

export function useDashboardKpisQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () =>
      opsApiClient.request<DashboardKpiDto>(opsEndpoints.dashboard.kpis, {
        accessToken,
      }),
    enabled: Boolean(accessToken),
  });
}

