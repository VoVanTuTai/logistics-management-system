import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  AddBagShipmentsPayload,
  BagManifestDto,
  RemoveBagShipmentsPayload,
} from './manifest.types';

export const manifestApi = {
  list: (accessToken: string): Promise<BagManifestDto[]> =>
    courierApiClient.request<BagManifestDto[]>(courierEndpoints.manifest.list, {
      accessToken,
    }),
  detailByCode: (
    accessToken: string,
    manifestCode: string,
  ): Promise<BagManifestDto> =>
    courierApiClient.request<BagManifestDto>(
      courierEndpoints.manifest.detailByCode(manifestCode),
      {
        accessToken,
      },
    ),
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
    payload: RemoveBagShipmentsPayload,
  ): Promise<BagManifestDto> =>
    courierApiClient.request<BagManifestDto>(
      courierEndpoints.manifest.removeShipments(manifestId),
      {
        method: 'POST',
        accessToken,
        body: {
          shipmentCodes: payload.shipmentCodes,
          note: payload.note ?? null,
          unsealedBy: payload.unsealedBy ?? null,
          unsealedByName: payload.unsealedByName ?? null,
          processingHubCode: payload.processingHubCode ?? null,
        },
      },
    ),
  seal: (
    accessToken: string,
    manifestId: string,
    payload: {
      sealedBy?: string | null;
      sealedByName?: string | null;
      processingHubCode?: string | null;
      note?: string | null;
    },
  ): Promise<BagManifestDto> =>
    courierApiClient.request<BagManifestDto>(
      courierEndpoints.manifest.seal(manifestId),
      {
        method: 'POST',
        accessToken,
        body: {
          sealedBy: payload.sealedBy ?? null,
          sealedByName: payload.sealedByName ?? null,
          processingHubCode: payload.processingHubCode ?? null,
          note: payload.note ?? null,
        },
      },
    ),
  receive: (
    accessToken: string,
    manifestId: string,
    payload: {
      receivedBy?: string | null;
      receivedByName?: string | null;
      processingHubCode?: string | null;
      note?: string | null;
    },
  ): Promise<BagManifestDto> =>
    courierApiClient.request<BagManifestDto>(
      courierEndpoints.manifest.receive(manifestId),
      {
        method: 'POST',
        accessToken,
        body: {
          receivedBy: payload.receivedBy ?? null,
          receivedByName: payload.receivedByName ?? null,
          processingHubCode: payload.processingHubCode ?? null,
          note: payload.note ?? null,
        },
      },
    ),
};
