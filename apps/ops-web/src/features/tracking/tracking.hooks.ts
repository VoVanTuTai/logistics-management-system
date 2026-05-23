import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { trackingClient } from './tracking.client';

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
