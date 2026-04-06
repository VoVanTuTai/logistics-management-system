import { useQuery } from '@tanstack/react-query';

import { trackingApi } from './tracking.api';

export function useTrackingLookupQuery(params: {
  accessToken: string | null;
  shipmentCode: string | null;
}) {
  return useQuery({
    queryKey: ['tracking', 'lookup', params.shipmentCode],
    queryFn: () =>
      trackingApi.lookup(
        params.accessToken as string,
        params.shipmentCode as string,
      ),
    enabled: Boolean(params.accessToken) && Boolean(params.shipmentCode),
  });
}
