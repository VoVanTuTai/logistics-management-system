import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AddShipmentInput,
  CreateManifestInput,
  ManifestActionResultDto,
  ManifestDetailDto,
  ManifestListItemDto,
  ReceiveHandoverInput,
  RemoveShipmentInput,
  SealManifestInput,
} from './manifests.types';

interface ManifestItemApiResponse {
  shipmentCode: string;
}

interface ManifestApiResponse {
  id: string;
  manifestCode: string;
  status: string;
  originHubCode: string | null;
  destinationHubCode: string | null;
  sealedAt: string | null;
  updatedAt?: string | null;
  note?: string | null;
  items?: ManifestItemApiResponse[];
}

function mapManifestListItem(payload: ManifestApiResponse): ManifestListItemDto {
  return {
    id: payload.id,
    manifestCode: payload.manifestCode,
    status: payload.status,
    originHubCode: payload.originHubCode,
    destinationHubCode: payload.destinationHubCode,
    sealedAt: payload.sealedAt,
  };
}

function mapManifestDetail(payload: ManifestApiResponse): ManifestDetailDto {
  return {
    id: payload.id,
    manifestCode: payload.manifestCode,
    status: payload.status,
    originHubCode: payload.originHubCode,
    destinationHubCode: payload.destinationHubCode,
    sealedAt: payload.sealedAt,
    updatedAt: payload.updatedAt ?? null,
    note: payload.note ?? null,
    shipmentCodes:
      payload.items?.map((item) => item.shipmentCode).filter(Boolean) ?? [],
  };
}

export const manifestsClient = {
  list: (accessToken: string | null): Promise<ManifestListItemDto[]> =>
    opsApiClient
      .request<ManifestApiResponse[]>(opsEndpoints.manifests.list, {
        accessToken,
      })
      .then((items) => items.map(mapManifestListItem)),
  detail: (
    accessToken: string | null,
    manifestId: string,
  ): Promise<ManifestDetailDto> =>
    opsApiClient
      .request<ManifestApiResponse>(opsEndpoints.manifests.detail(manifestId), {
        accessToken,
      })
      .then(mapManifestDetail),
  create: (
    accessToken: string | null,
    payload: CreateManifestInput,
  ): Promise<ManifestActionResultDto> =>
    opsApiClient.request<ManifestActionResultDto>(opsEndpoints.manifests.create, {
      method: 'POST',
      accessToken,
      body: {
        manifestCode: payload.manifestCode,
        originHubCode: payload.originHubCode || null,
        destinationHubCode: payload.destinationHubCode || null,
        shipmentCodes: payload.shipmentCodes,
      },
    }),
  addShipment: (
    accessToken: string | null,
    manifestId: string,
    payload: AddShipmentInput,
  ): Promise<ManifestActionResultDto> =>
    opsApiClient.request<ManifestActionResultDto>(
      opsEndpoints.manifests.detail(manifestId),
      {
        method: 'PATCH',
        accessToken,
        body: {
          addShipmentCodes: [payload.shipmentCode],
          note: payload.note ?? null,
        },
      },
    ),
  removeShipment: (
    accessToken: string | null,
    manifestId: string,
    payload: RemoveShipmentInput,
  ): Promise<ManifestActionResultDto> =>
    opsApiClient.request<ManifestActionResultDto>(
      opsEndpoints.manifests.detail(manifestId),
      {
        method: 'PATCH',
        accessToken,
        body: {
          removeShipmentCodes: [payload.shipmentCode],
          note: payload.note ?? null,
        },
      },
    ),
  seal: (
    accessToken: string | null,
    manifestId: string,
    payload: SealManifestInput,
  ): Promise<ManifestActionResultDto> =>
    opsApiClient.request<ManifestActionResultDto>(opsEndpoints.manifests.seal(manifestId), {
      method: 'POST',
      accessToken,
      body: {
        sealedBy: payload.sealCode || null,
        note: payload.note ?? null,
      },
    }),
  receiveHandover: (
    accessToken: string | null,
    manifestId: string,
    payload: ReceiveHandoverInput,
  ): Promise<ManifestActionResultDto> =>
    opsApiClient.request<ManifestActionResultDto>(opsEndpoints.manifests.receive(manifestId), {
      method: 'POST',
      accessToken,
      body: {
        receivedBy: payload.receiverName,
        note: payload.note ?? null,
      },
    }),
};
