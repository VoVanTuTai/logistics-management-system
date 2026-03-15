import { useMutation } from '@tanstack/react-query';

import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type { RecordScanPayload, RecordScanResultDto } from './scan.types';

export const scanApi = {
  recordPickup: (
    accessToken: string,
    payload: RecordScanPayload,
  ): Promise<RecordScanResultDto> =>
    courierApiClient.request(courierEndpoints.scan.pickup, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  recordInbound: (
    accessToken: string,
    payload: RecordScanPayload,
  ): Promise<RecordScanResultDto> =>
    courierApiClient.request(courierEndpoints.scan.inbound, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  recordOutbound: (
    accessToken: string,
    payload: RecordScanPayload,
  ): Promise<RecordScanResultDto> =>
    courierApiClient.request(courierEndpoints.scan.outbound, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
};

export function useRecordPickupScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: RecordScanPayload) =>
      scanApi.recordPickup(accessToken as string, payload),
  });
}

export function useRecordHubScanMutation(
  mode: 'INBOUND' | 'OUTBOUND',
  accessToken: string | null,
) {
  return useMutation({
    mutationFn: (payload: RecordScanPayload) =>
      mode === 'INBOUND'
        ? scanApi.recordInbound(accessToken as string, payload)
        : scanApi.recordOutbound(accessToken as string, payload),
  });
}
