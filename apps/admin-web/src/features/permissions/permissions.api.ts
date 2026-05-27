import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CourierPermissionMatrix,
  UserPermissionMap,
} from './courierPermissionMatrix';
import { permissionsClient } from './permissions.client';

const permissionQueryKeys = {
  courierMatrix: ['permissions', 'courier-mobile', 'matrix'] as const,
  userEffective: (userId: string | null) =>
    ['permissions', 'courier-mobile', 'users', userId ?? '', 'effective'] as const,
};

export function useCourierPermissionMatrixQuery(accessToken: string | null) {
  return useQuery({
    queryKey: permissionQueryKeys.courierMatrix,
    queryFn: () => permissionsClient.getCourierPermissionMatrix(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useUpdateCourierPermissionMatrixMutation(
  accessToken: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matrix: CourierPermissionMatrix) =>
      permissionsClient.updateCourierPermissionMatrix(accessToken, matrix),
    onSuccess: async (matrix) => {
      queryClient.setQueryData(permissionQueryKeys.courierMatrix, matrix);
      await queryClient.invalidateQueries({
        queryKey: ['permissions', 'courier-mobile'],
      });
    },
  });
}

export function useUserEffectivePermissionsQuery(
  accessToken: string | null,
  userId: string | null,
) {
  return useQuery({
    queryKey: permissionQueryKeys.userEffective(userId),
    queryFn: () =>
      permissionsClient.getUserEffectivePermissions(accessToken, userId ?? ''),
    enabled: Boolean(accessToken && userId),
  });
}

export function useUpdateUserPermissionOverrideMutation(
  accessToken: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; permissions: UserPermissionMap }) =>
      permissionsClient.updateUserPermissionOverride(
        accessToken,
        params.userId,
        params.permissions,
      ),
    onSuccess: async (_result, params) => {
      await queryClient.invalidateQueries({
        queryKey: permissionQueryKeys.userEffective(params.userId),
      });
    },
  });
}
