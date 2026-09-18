import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../../store/authStore';
import { policiesClient } from './policies.client';
import type {
  PolicyFilters,
  PolicyWriteInput,
} from './policies.types';

export const policyQueryKeys = {
  all: ['admin-policies'] as const,
  list: (filters: PolicyFilters) => ['admin-policies', 'list', filters] as const,
  detail: (id: string) => ['admin-policies', 'detail', id] as const,
};

export function usePoliciesQuery(filters: PolicyFilters) {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useQuery({
    queryKey: policyQueryKeys.list(filters),
    queryFn: () => policiesClient.listPolicies(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function usePolicyDetailQuery(id: string | null) {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useQuery({
    queryKey: policyQueryKeys.detail(id ?? ''),
    queryFn: () => policiesClient.getPolicyDetail(accessToken, id!),
    enabled: Boolean(accessToken && id),
  });
}

export function useCreatePolicyMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useMutation({
    mutationFn: (payload: PolicyWriteInput) =>
      policiesClient.createPolicy(accessToken, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.all });
    },
  });
}

export function useUpdatePolicyMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PolicyWriteInput> }) =>
      policiesClient.updatePolicy(accessToken, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.all });
    },
  });
}

export function usePublishPolicyMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useMutation({
    mutationFn: (id: string) => policiesClient.publishPolicy(accessToken, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.all });
    },
  });
}

export function useArchivePolicyMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useMutation({
    mutationFn: (id: string) => policiesClient.archivePolicy(accessToken, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.all });
    },
  });
}

export function useRestorePolicyMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useMutation({
    mutationFn: (id: string) => policiesClient.restorePolicy(accessToken, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.all });
    },
  });
}

export function useDeletePolicyMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  return useMutation({
    mutationFn: (id: string) => policiesClient.deletePolicy(accessToken, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyQueryKeys.all });
    },
  });
}
