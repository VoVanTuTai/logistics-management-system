import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  PolicyDto,
  PolicyFilters,
  PolicyWriteInput,
} from './policies.types';

function buildQueryString(filters: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(filters)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }
    params.set(key, String(rawValue).trim());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const policiesClient = {
  listPolicies: (
    accessToken: string | null,
    filters: PolicyFilters,
  ): Promise<{ items: PolicyDto[]; total: number }> =>
    opsApiClient.request<{ items: PolicyDto[]; total: number }>(
      `${opsEndpoints.masterdata.policies}${buildQueryString({
        category: filters.category,
        status: filters.status,
        q: filters.q,
        page: filters.page,
        limit: filters.limit,
      })}`,
      { accessToken },
    ),

  getPolicyDetail: (
    accessToken: string | null,
    policyId: string,
  ): Promise<PolicyDto> =>
    opsApiClient.request<PolicyDto>(
      opsEndpoints.masterdata.policyDetail(policyId),
      { accessToken },
    ),

  createPolicy: (
    accessToken: string | null,
    payload: PolicyWriteInput,
  ): Promise<PolicyDto> =>
    opsApiClient.request<PolicyDto>(opsEndpoints.masterdata.policies, {
      method: 'POST',
      accessToken,
      body: payload,
    }),

  updatePolicy: (
    accessToken: string | null,
    policyId: string,
    payload: Partial<PolicyWriteInput>,
  ): Promise<PolicyDto> =>
    opsApiClient.request<PolicyDto>(
      opsEndpoints.masterdata.policyDetail(policyId),
      {
        method: 'PATCH',
        accessToken,
        body: payload,
      },
    ),

  publishPolicy: (
    accessToken: string | null,
    policyId: string,
  ): Promise<PolicyDto> =>
    opsApiClient.request<PolicyDto>(
      opsEndpoints.masterdata.policyPublish(policyId),
      {
        method: 'PATCH',
        accessToken,
      },
    ),

  archivePolicy: (
    accessToken: string | null,
    policyId: string,
  ): Promise<PolicyDto> =>
    opsApiClient.request<PolicyDto>(
      opsEndpoints.masterdata.policyArchive(policyId),
      {
        method: 'PATCH',
        accessToken,
      },
    ),

  restorePolicy: (
    accessToken: string | null,
    policyId: string,
  ): Promise<PolicyDto> =>
    opsApiClient.request<PolicyDto>(
      opsEndpoints.masterdata.policyRestore(policyId),
      {
        method: 'PATCH',
        accessToken,
      },
    ),

  deletePolicy: (
    accessToken: string | null,
    policyId: string,
  ): Promise<{ deleted: boolean; policyId: string | null }> =>
    opsApiClient.request<{ deleted: boolean; policyId: string | null }>(
      opsEndpoints.masterdata.policyDetail(policyId),
      {
        method: 'DELETE',
        accessToken,
      },
    ),
};
