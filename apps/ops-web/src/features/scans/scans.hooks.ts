import { useMutation } from '@tanstack/react-query';

import { scansClient } from './scans.client';
import type { HubScanInput } from './scans.types';

export function usePickupScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: HubScanInput) =>
      scansClient.pickup(accessToken, payload),
  });
}

export function useInboundScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: HubScanInput) =>
      scansClient.inbound(accessToken, payload),
  });
}

export function useOutboundScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: HubScanInput) =>
      scansClient.outbound(accessToken, payload),
  });
}
