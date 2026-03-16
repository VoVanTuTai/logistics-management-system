import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { manifestsClient } from './manifests.client';
import type {
  AddShipmentInput,
  CreateManifestInput,
  ReceiveHandoverInput,
  RemoveShipmentInput,
  SealManifestInput,
} from './manifests.types';

export function useManifestsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.manifests,
    queryFn: () => manifestsClient.list(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useManifestDetailQuery(
  accessToken: string | null,
  manifestId: string,
) {
  return useQuery({
    queryKey: [...queryKeys.manifests, 'detail', manifestId],
    queryFn: () => manifestsClient.detail(accessToken, manifestId),
    enabled: Boolean(accessToken) && Boolean(manifestId),
  });
}

export function useCreateManifestMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateManifestInput) =>
      manifestsClient.create(accessToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.manifests });
    },
  });
}

export function useAddShipmentMutation(
  accessToken: string | null,
  manifestId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddShipmentInput) =>
      manifestsClient.addShipment(accessToken, manifestId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.manifests });
    },
  });
}

export function useRemoveShipmentMutation(
  accessToken: string | null,
  manifestId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RemoveShipmentInput) =>
      manifestsClient.removeShipment(accessToken, manifestId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.manifests });
    },
  });
}

export function useSealManifestMutation(
  accessToken: string | null,
  manifestId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SealManifestInput) =>
      manifestsClient.seal(accessToken, manifestId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.manifests });
    },
  });
}

export function useReceiveHandoverMutation(
  accessToken: string | null,
  manifestId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReceiveHandoverInput) =>
      manifestsClient.receiveHandover(accessToken, manifestId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.manifests });
    },
  });
}
