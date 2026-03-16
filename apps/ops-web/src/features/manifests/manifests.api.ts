import { useMutation, useQuery } from '@tanstack/react-query';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import type {
  CreateManifestInput,
  ManifestItemDto,
  ReceiveHandoverInput,
  SealManifestInput,
} from './manifests.types';

export function useManifestsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.manifests,
    queryFn: () =>
      opsApiClient.request<ManifestItemDto[]>(opsEndpoints.manifests.list, {
        accessToken,
      }),
    enabled: Boolean(accessToken),
  });
}

export function useCreateManifestMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: CreateManifestInput) =>
      opsApiClient.request<ManifestItemDto>(opsEndpoints.manifests.create, {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

export function useSealManifestMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (params: { manifestId: string; payload: SealManifestInput }) =>
      opsApiClient.request<void>(opsEndpoints.manifests.seal(params.manifestId), {
        method: 'POST',
        accessToken,
        body: params.payload,
      }),
  });
}

export function useReceiveHandoverMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: ReceiveHandoverInput) =>
      opsApiClient.request<void>(opsEndpoints.manifests.receive, {
        method: 'POST',
        accessToken,
        body: payload,
      }),
  });
}

