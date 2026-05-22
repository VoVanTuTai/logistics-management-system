import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { trackingClient } from './tracking.client';
import type { OperationTimelineFiltersDto } from './tracking.types';

export function useTrackingSearchQuery(
  accessToken: string | null,
  shipmentCode: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...queryKeys.tracking, 'search', shipmentCode],
    queryFn: () => trackingClient.search(accessToken, shipmentCode),
    enabled: Boolean(accessToken) && enabled && Boolean(shipmentCode),
  });
}

export function useTrackingDetailQuery(
  accessToken: string | null,
  shipmentCode: string,
) {
  return useQuery({
    queryKey: [...queryKeys.tracking, 'detail', shipmentCode],
    queryFn: () => trackingClient.detail(accessToken, shipmentCode),
    enabled: Boolean(accessToken) && Boolean(shipmentCode),
  });
}

export function useOperationTimelineQuery(
  accessToken: string | null,
  filters: OperationTimelineFiltersDto,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...queryKeys.tracking, 'operation-timeline', filters],
    queryFn: () => trackingClient.operationTimeline(accessToken, filters),
    enabled: Boolean(accessToken) && enabled,
  });
}
