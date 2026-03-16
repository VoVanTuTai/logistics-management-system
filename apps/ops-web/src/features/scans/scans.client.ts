import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type { HubScanInput, HubScanResultDto } from './scans.types';

export const scansClient = {
  inbound: (
    accessToken: string | null,
    payload: HubScanInput,
  ): Promise<HubScanResultDto> =>
    opsApiClient.request<HubScanResultDto>(opsEndpoints.scans.inbound, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  outbound: (
    accessToken: string | null,
    payload: HubScanInput,
  ): Promise<HubScanResultDto> =>
    opsApiClient.request<HubScanResultDto>(opsEndpoints.scans.outbound, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
};
