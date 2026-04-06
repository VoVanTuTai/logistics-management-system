import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  AddBagShipmentsPayload,
  BagManifestDto,
} from './manifest.types';

export const manifestApi = {
  list: (accessToken: string): Promise<BagManifestDto[]> =>
    courierApiClient.request<BagManifestDto[]>(courierEndpoints.manifest.list, {
      accessToken,
    }),
  addShipments: (
    accessToken: string,
    manifestId: string,
    payload: AddBagShipmentsPayload,
  ): Promise<BagManifestDto> =>
    courierApiClient.request<BagManifestDto>(
      courierEndpoints.manifest.addShipments(manifestId),
      {
        method: 'POST',
        accessToken,
        body: {
          shipmentCodes: payload.shipmentCodes,
          note: payload.note ?? null,
        },
      },
    ),
  removeShipments: (
    accessToken: string,
    manifestId: string,
    payload: AddBagShipmentsPayload,
  ): Promise<BagManifestDto> =>
    courierApiClient.request<BagManifestDto>(
      courierEndpoints.manifest.removeShipments(manifestId),
      {
        method: 'POST',
        accessToken,
        body: {
          shipmentCodes: payload.shipmentCodes,
          note: payload.note ?? null,
        },
      },
    ),
};

