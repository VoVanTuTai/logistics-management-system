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

export const shipmentsClient = {
  list: (
    accessToken: string | null,
    filters: ShipmentListFilters,
  ): Promise<ShipmentListItemDto[]> =>
    opsApiClient.request<ShipmentListItemDto[]>(buildShipmentListPath(filters), {
      accessToken,
    }),
  detail: (
    accessToken: string | null,
    shipmentId: string,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient.request<ShipmentDetailDto>(opsEndpoints.shipments.detail(shipmentId), {
      accessToken,
    }),
  update: (
    accessToken: string | null,
    shipmentId: string,
    payload: UpdateShipmentInput,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient.request<ShipmentDetailDto>(opsEndpoints.shipments.detail(shipmentId), {
      method: 'PATCH',
      accessToken,
      body: payload,
    }),
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

