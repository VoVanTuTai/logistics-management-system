import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { ndrClient } from './ndr.client';
import type { RescheduleInput, ReturnDecisionInput } from './ndr.types';

export function useNdrCasesQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.ndr,
    queryFn: () => ndrClient.list(accessToken),
    enabled: Boolean(accessToken),
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
