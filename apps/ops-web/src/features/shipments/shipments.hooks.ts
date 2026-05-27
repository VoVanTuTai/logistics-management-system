import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { shipmentsClient } from './shipments.client';
import type {
  ApproveShipmentInput,
  CreateShipmentInput,
  ReviewShipmentInput,
  ShipmentListFilters,
  UpdateShipmentInput,
} from './shipments.types';

export function useShipmentsQuery(
  accessToken: string | null,
  filters: ShipmentListFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  },
) {
  return useQuery({
    queryKey: buildShipmentListQueryKey(filters),
    queryFn: () => shipmentsClient.list(accessToken, filters),
    enabled: options?.enabled ?? Boolean(accessToken),
    refetchInterval: options?.refetchInterval,
  });
}

export function useShipmentPageQuery(
  accessToken: string | null,
  filters: ShipmentListFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  },
) {
  return useQuery({
    queryKey: [...buildShipmentListQueryKey(filters), 'page'],
    queryFn: () => shipmentsClient.listPage(accessToken, filters),
    enabled: options?.enabled ?? Boolean(accessToken),
    refetchInterval: options?.refetchInterval,
  });
}

export function useShipmentDetailQuery(
  accessToken: string | null,
  shipmentId: string,
) {
  return useQuery({
    queryKey: [...queryKeys.shipments, 'detail', shipmentId],
    queryFn: () => shipmentsClient.detail(accessToken, shipmentId),
    enabled: Boolean(accessToken) && Boolean(shipmentId),
  });
}

export function useCreateShipmentMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShipmentInput) =>
      shipmentsClient.create(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
    },
  });
}

export function useUpdateShipmentMutation(
  accessToken: string | null,
  shipmentId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateShipmentInput) =>
      shipmentsClient.update(accessToken, shipmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
    },
  });
}

export function useReviewShipmentMutation(
  accessToken: string | null,
  shipmentId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReviewShipmentInput) =>
      shipmentsClient.review(accessToken, shipmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
    },
  });
}

export function useApproveShipmentMutation(
  accessToken: string | null,
  shipmentId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApproveShipmentInput) =>
      shipmentsClient.approve(accessToken, shipmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
    },
  });
}

function buildShipmentListQueryKey(filters: ShipmentListFilters) {
  return [
    ...queryKeys.shipments,
    filters.q ?? '',
    filters.shipmentCode ?? '',
    filters.shipmentCodes?.join(',') ?? '',
    filters.status ?? '',
    filters.createdFrom ?? '',
    filters.createdTo ?? '',
    filters.limit ?? '',
    filters.offset ?? '',
    filters.hubCodes?.join(',') ?? '',
  ];
}
