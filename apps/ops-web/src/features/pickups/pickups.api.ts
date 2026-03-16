import { useMutation, useQuery } from '@tanstack/react-query';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import type { PickupRequestItemDto, PickupReviewInput } from './pickups.types';

export function usePickupRequestsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.pickups,
    queryFn: () =>
      opsApiClient.request<PickupRequestItemDto[]>(opsEndpoints.pickups.list, {
        accessToken,
      }),
    enabled: Boolean(accessToken),
  });
}

export function useApprovePickupMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (params: { pickupId: string; payload: PickupReviewInput }) =>
      opsApiClient.request<void>(opsEndpoints.pickups.approve(params.pickupId), {
        method: 'POST',
        accessToken,
        body: params.payload,
      }),
  });
}

export function useRejectPickupMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (params: { pickupId: string; payload: PickupReviewInput }) =>
      opsApiClient.request<void>(opsEndpoints.pickups.reject(params.pickupId), {
        method: 'POST',
        accessToken,
        body: params.payload,
      }),
  });
}

