import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { pickupsClient } from './pickups.client';
import type { PickupRequestListFilters, PickupReviewInput } from './pickups.types';

export function usePickupRequestsQuery(
  accessToken: string | null,
  filters: PickupRequestListFilters,
) {
  return useQuery({
    queryKey: [...queryKeys.pickups, filters.status ?? ''],
    queryFn: () => pickupsClient.list(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function usePickupRequestDetailQuery(
  accessToken: string | null,
  pickupId: string,
) {
  return useQuery({
    queryKey: [...queryKeys.pickups, 'detail', pickupId],
    queryFn: () => pickupsClient.detail(accessToken, pickupId),
    enabled: Boolean(accessToken) && Boolean(pickupId),
  });
}

export function useApprovePickupMutation(
  accessToken: string | null,
  pickupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PickupReviewInput) =>
      pickupsClient.approve(accessToken, pickupId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pickups });
    },
  });
}

export function useRejectPickupMutation(
  accessToken: string | null,
  pickupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PickupReviewInput) =>
      pickupsClient.reject(accessToken, pickupId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pickups });
    },
  });
}

export function useCompletePickupMutation(
  accessToken: string | null,
  pickupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pickupsClient.complete(accessToken, pickupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pickups });
    },
  });
}

