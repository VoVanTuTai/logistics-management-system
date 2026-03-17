import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  ApproveShipmentInput,
  ReviewShipmentInput,
  ShipmentActionResultDto,
  ShipmentDetailDto,
  ShipmentListFilters,
  ShipmentListItemDto,
  UpdateShipmentInput,
} from './shipments.types';

interface ShipmentApiResponse {
  id: string;
  code: string;
  currentStatus: string;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
}

function buildShipmentListPath(filters: ShipmentListFilters): string {
  const params = new URLSearchParams();

  if (filters.q?.trim()) {
    params.set('q', filters.q.trim());
  }

  if (filters.status?.trim()) {
    params.set('status', filters.status.trim());
  }

  const queryString = params.toString();
  return queryString ? `${opsEndpoints.shipments.list}?${queryString}` : opsEndpoints.shipments.list;
}

function mapShipmentToListItem(payload: ShipmentApiResponse): ShipmentListItemDto {
  return {
    id: payload.id,
    shipmentCode: payload.code,
    currentStatus: payload.currentStatus,
    currentLocation: null,
    updatedAt: payload.updatedAt,
  };
}

function mapShipmentToDetail(payload: ShipmentApiResponse): ShipmentDetailDto {
  const metadata = payload.metadata ?? {};

  return {
    id: payload.id,
    shipmentCode: payload.code,
    currentStatus: payload.currentStatus,
    currentLocation: null,
    senderName:
      typeof metadata.senderName === 'string' ? metadata.senderName : null,
    receiverName:
      typeof metadata.receiverName === 'string' ? metadata.receiverName : null,
    note: typeof metadata.note === 'string' ? metadata.note : null,
    updatedAt: payload.updatedAt,
  };
}

export const shipmentsClient = {
  list: (
    accessToken: string | null,
    filters: ShipmentListFilters,
  ): Promise<ShipmentListItemDto[]> =>
    opsApiClient
      .request<ShipmentApiResponse[]>(buildShipmentListPath(filters), {
        accessToken,
      })
      .then((items) => items.map(mapShipmentToListItem)),
  detail: (
    accessToken: string | null,
    shipmentId: string,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient
      .request<ShipmentApiResponse>(opsEndpoints.shipments.detail(shipmentId), {
        accessToken,
      })
      .then(mapShipmentToDetail),
  update: (
    accessToken: string | null,
    shipmentId: string,
    payload: UpdateShipmentInput,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient
      .request<ShipmentApiResponse>(opsEndpoints.shipments.detail(shipmentId), {
        method: 'PATCH',
        accessToken,
        body: payload,
      })
      .then(mapShipmentToDetail),
  review: (
    accessToken: string | null,
    shipmentId: string,
    payload: ReviewShipmentInput,
  ): Promise<ShipmentActionResultDto> =>
    // TODO(contract): confirm /review endpoint behavior and payload.
    opsApiClient.request<ShipmentActionResultDto>(
      `${opsEndpoints.shipments.detail(shipmentId)}/review`,
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),
  approve: (
    accessToken: string | null,
    shipmentId: string,
    payload: ApproveShipmentInput,
  ): Promise<ShipmentActionResultDto> =>
    // TODO(contract): confirm /approve endpoint behavior and payload.
    opsApiClient.request<ShipmentActionResultDto>(
      `${opsEndpoints.shipments.detail(shipmentId)}/approve`,
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),
};
