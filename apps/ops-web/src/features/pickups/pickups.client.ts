import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  PickupActionResultDto,
  PickupRequestDetailDto,
  PickupRequestListFilters,
  PickupRequestListItemDto,
  PickupReviewInput,
} from './pickups.types';

interface PickupItemApiResponse {
  shipmentCode: string;
}

interface PickupApiResponse {
  id: string;
  pickupCode: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PickupItemApiResponse[];
}

function buildPickupRequestListPath(filters: PickupRequestListFilters): string {
  const params = new URLSearchParams();

  if (filters.status?.trim()) {
    params.set('status', filters.status.trim());
  }

  const queryString = params.toString();
  return queryString ? `${opsEndpoints.pickups.list}?${queryString}` : opsEndpoints.pickups.list;
}

function mapPickupToListItem(payload: PickupApiResponse): PickupRequestListItemDto {
  return {
    id: payload.id,
    requestCode: payload.pickupCode,
    shipmentCode: payload.items?.[0]?.shipmentCode ?? null,
    status: payload.status,
    requestedAt: payload.createdAt,
  };
}

function mapPickupToDetail(payload: PickupApiResponse): PickupRequestDetailDto {
  return {
    id: payload.id,
    requestCode: payload.pickupCode,
    shipmentCode: payload.items?.[0]?.shipmentCode ?? null,
    status: payload.status,
    requestedAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    note: payload.note,
  };
}

export const pickupsClient = {
  list: (
    accessToken: string | null,
    filters: PickupRequestListFilters,
  ): Promise<PickupRequestListItemDto[]> =>
    opsApiClient
      .request<PickupApiResponse[]>(buildPickupRequestListPath(filters), {
        accessToken,
      })
      .then((items) => items.map(mapPickupToListItem)),
  detail: (
    accessToken: string | null,
    pickupId: string,
  ): Promise<PickupRequestDetailDto> =>
    opsApiClient
      .request<PickupApiResponse>(opsEndpoints.pickups.detail(pickupId), {
        accessToken,
      })
      .then(mapPickupToDetail),
  approve: (
    accessToken: string | null,
    pickupId: string,
    payload: PickupReviewInput,
  ): Promise<PickupActionResultDto> =>
    opsApiClient.request<PickupActionResultDto>(opsEndpoints.pickups.approve(pickupId), {
      method: 'POST',
      accessToken,
    }),
  reject: (
    accessToken: string | null,
    pickupId: string,
    payload: PickupReviewInput,
  ): Promise<PickupActionResultDto> =>
    opsApiClient.request<PickupActionResultDto>(opsEndpoints.pickups.reject(pickupId), {
      method: 'POST',
      accessToken,
      body: {
        reason: payload.note ?? null,
      },
    }),
};
