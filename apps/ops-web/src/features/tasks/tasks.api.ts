import { useMutation, useQuery } from '@tanstack/react-query';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import type { AssignTaskInput, ReassignTaskInput, TaskItemDto } from './tasks.types';

export function useTasksQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () =>
      opsApiClient.request<TaskItemDto[]>(opsEndpoints.tasks.list, { accessToken }),
    enabled: Boolean(accessToken),
  });
}

export function useAssignTaskMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: AssignTaskInput) =>
      opsApiClient.request<void>(opsEndpoints.tasks.assign, {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

export function useReassignTaskMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: ReassignTaskInput) =>
      opsApiClient.request<void>(opsEndpoints.tasks.reassign, {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

