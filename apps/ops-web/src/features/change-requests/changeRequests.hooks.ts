import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { changeRequestsClient } from './changeRequests.client';
import type { ApproveChangeRequestInput } from './changeRequests.types';

export function useChangeRequestsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.changeRequests,
    queryFn: () => changeRequestsClient.list(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useApproveChangeRequestMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      requestId: string;
      payload: ApproveChangeRequestInput;
    }) =>
      changeRequestsClient.approve(
        accessToken,
        params.requestId,
        params.payload,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.changeRequests });
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
    },
  });
}
