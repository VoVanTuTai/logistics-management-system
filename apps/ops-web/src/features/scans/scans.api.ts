import { useMutation } from '@tanstack/react-query';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type { HubScanInput, HubScanResultDto } from './scans.types';

export function useInboundScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: HubScanInput) =>
      opsApiClient.request<HubScanResultDto>(opsEndpoints.scans.inbound, {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

export function useOutboundScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: HubScanInput) =>
      opsApiClient.request<HubScanResultDto>(opsEndpoints.scans.outbound, {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

