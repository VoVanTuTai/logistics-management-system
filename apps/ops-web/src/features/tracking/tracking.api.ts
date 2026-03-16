import { useMutation } from '@tanstack/react-query';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type { TrackingLookupResultDto } from './tracking.types';

export function useTrackingLookupMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (shipmentCode: string) =>
      opsApiClient.request<TrackingLookupResultDto>(
        `${opsEndpoints.tracking.lookup}?shipmentCode=${encodeURIComponent(shipmentCode)}`,
        { accessToken },
      ),
  });
}

