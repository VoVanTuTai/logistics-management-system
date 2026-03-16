import { useMutation, useQuery } from '@tanstack/react-query';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import type { NdrCaseDto, RescheduleInput, ReturnDecisionInput } from './ndr.types';

export function useNdrCasesQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.ndr,
    queryFn: () =>
      opsApiClient.request<NdrCaseDto[]>(opsEndpoints.ndr.list, { accessToken }),
    enabled: Boolean(accessToken),
  });
}

export function useRescheduleMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: RescheduleInput) =>
      opsApiClient.request<void>(opsEndpoints.ndr.reschedule(payload.ndrId), {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

export function useReturnDecisionMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: ReturnDecisionInput) =>
      opsApiClient.request<void>(opsEndpoints.ndr.returnDecision(payload.ndrId), {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

