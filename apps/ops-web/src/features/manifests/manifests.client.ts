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

export const manifestsClient = {
  list: (accessToken: string | null): Promise<ManifestListItemDto[]> =>
    opsApiClient.request<ManifestListItemDto[]>(opsEndpoints.manifests.list, {
      accessToken,
    }),
  detail: (
    accessToken: string | null,
    manifestId: string,
  ): Promise<ManifestDetailDto> =>
    opsApiClient.request<ManifestDetailDto>(opsEndpoints.manifests.detail(manifestId), {
      accessToken,
    }),
  create: (
    accessToken: string | null,
    payload: CreateManifestInput,
  ): Promise<ManifestActionResultDto> =>
    opsApiClient.request<ManifestActionResultDto>(opsEndpoints.manifests.create, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  addShipment: (
    accessToken: string | null,
    manifestId: string,
    payload: AddShipmentInput,
  ): Promise<ManifestActionResultDto> =>
    // TODO(contract): confirm add-shipment endpoint.
    opsApiClient.request<ManifestActionResultDto>(
      opsEndpoints.manifests.addShipment(manifestId),
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),
  removeShipment: (
    accessToken: string | null,
    manifestId: string,
    payload: RemoveShipmentInput,
  ): Promise<ManifestActionResultDto> =>
    // TODO(contract): confirm remove-shipment endpoint.
    opsApiClient.request<ManifestActionResultDto>(
      opsEndpoints.manifests.removeShipment(manifestId),
      {
        method: 'POST',
        accessToken,
        body: payload,
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
      body: payload,
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
