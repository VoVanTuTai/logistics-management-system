import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { ndrClient } from './ndr.client';
import type { NdrCaseListFilters, RescheduleInput, ReturnDecisionInput } from './ndr.types';

interface NdrQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useNdrCasesQuery(
  accessToken: string | null,
  filtersOrOptions:
    | NdrCaseListFilters
    | NdrQueryOptions = {},
  options?: NdrQueryOptions,
) {
  const isOptionsOnly =
    'refetchInterval' in filtersOrOptions || 'enabled' in filtersOrOptions;
  const filters: NdrCaseListFilters = isOptionsOnly
    ? {}
    : filtersOrOptions as NdrCaseListFilters;
  const queryOptions: NdrQueryOptions | undefined = isOptionsOnly
    ? filtersOrOptions as NdrQueryOptions
    : options;

  return useQuery({
    queryKey: [
      ...queryKeys.ndr,
      filters.shipmentCode ?? '',
      filters.status ?? '',
    ],
    queryFn: () => ndrClient.list(accessToken, filters),
    enabled: queryOptions?.enabled ?? Boolean(accessToken),
    refetchInterval: queryOptions?.refetchInterval,
  });
}

export function useNdrCaseDetailQuery(accessToken: string | null, ndrId: string) {
  return useQuery({
    queryKey: [...queryKeys.ndr, 'detail', ndrId],
    queryFn: () => ndrClient.detail(accessToken, ndrId),
    enabled: Boolean(accessToken) && Boolean(ndrId),
  });
}

export function useRescheduleMutation(accessToken: string | null, ndrId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RescheduleInput) =>
      ndrClient.reschedule(accessToken, ndrId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ndr });
    },
  });
}

export function useReturnDecisionMutation(accessToken: string | null, ndrId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReturnDecisionInput) =>
      ndrClient.returnDecision(accessToken, ndrId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ndr });
    },
  });
}
