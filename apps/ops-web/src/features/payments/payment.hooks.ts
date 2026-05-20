import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { paymentClient } from './payment.client';
import type {
  CodDailySettlementFilters,
  ConfirmCodSettlementMutationInput,
  CreateCodSettlementInput,
} from './payment.types';

export function useCodDailySettlementQuery(
  accessToken: string | null,
  filters: CodDailySettlementFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  },
) {
  return useQuery({
    queryKey: buildCodDailySettlementQueryKey(filters),
    queryFn: () => paymentClient.getCodDailySettlement(accessToken, filters),
    enabled: options?.enabled ?? Boolean(accessToken),
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateCodSettlementMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCodSettlementInput) =>
      paymentClient.createCodSettlement(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

export function useConfirmCodSettlementMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ settlementId, payload }: ConfirmCodSettlementMutationInput) =>
      paymentClient.confirmCodSettlement(accessToken, settlementId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

function buildCodDailySettlementQueryKey(filters: CodDailySettlementFilters) {
  return [
    ...queryKeys.payments,
    'cod-settlement-daily',
    filters.date ?? '',
    filters.hubCode ?? '',
    filters.courierId ?? '',
    filters.status ?? '',
  ];
}
