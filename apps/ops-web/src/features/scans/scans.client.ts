import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type { HubScanInput, HubScanResultDto } from './scans.types';

function buildPayload(input: HubScanInput) {
  return {
    shipmentCode: input.shipmentCode,
    locationCode: input.locationCode,
    note: input.note ?? null,
    idempotencyKey: input.idempotencyKey,
  };
}

export const scansClient = {
  pickup: (
    accessToken: string | null,
    payload: HubScanInput,
  ): Promise<HubScanResultDto> =>
    opsApiClient.request<HubScanResultDto>(opsEndpoints.scans.pickup, {
      method: 'POST',
      accessToken,
      body: buildPayload(payload),
    }),
  inbound: (
    accessToken: string | null,
    payload: HubScanInput,
  ): Promise<HubScanResultDto> =>
    opsApiClient.request<HubScanResultDto>(opsEndpoints.scans.inbound, {
      method: 'POST',
      accessToken,
      body: buildPayload(payload),
    }),
  outbound: (
    accessToken: string | null,
    payload: HubScanInput,
  ): Promise<HubScanResultDto> =>
    opsApiClient.request<HubScanResultDto>(opsEndpoints.scans.outbound, {
      method: 'POST',
      accessToken,
      body: buildPayload(payload),
    }),
};
