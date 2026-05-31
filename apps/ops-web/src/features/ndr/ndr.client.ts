import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  NdrActionResultDto,
  NdrCaseDetailDto,
  NdrCaseListFilters,
  NdrCaseListItemDto,
  RescheduleInput,
  ReturnDecisionInput,
} from './ndr.types';

function buildNdrListPath(filters?: NdrCaseListFilters): string {
  const params = new URLSearchParams();

  if (filters?.shipmentCode?.trim()) {
    params.set('shipmentCode', filters.shipmentCode.trim());
  }

  if (filters?.status?.trim()) {
    params.set('status', filters.status.trim());
  }

  const queryString = params.toString();
  return queryString ? `${opsEndpoints.ndr.list}?${queryString}` : opsEndpoints.ndr.list;
}

export const ndrClient = {
  list: (
    accessToken: string | null,
    filters?: NdrCaseListFilters,
  ): Promise<NdrCaseListItemDto[]> =>
    opsApiClient.request<NdrCaseListItemDto[]>(buildNdrListPath(filters), {
      accessToken,
    }),
  detail: (accessToken: string | null, ndrId: string): Promise<NdrCaseDetailDto> =>
    opsApiClient.request<NdrCaseDetailDto>(opsEndpoints.ndr.detail(ndrId), {
      accessToken,
    }),
  reschedule: (
    accessToken: string | null,
    ndrId: string,
    payload: RescheduleInput,
  ): Promise<NdrActionResultDto> =>
    opsApiClient.request<NdrActionResultDto>(opsEndpoints.ndr.reschedule(ndrId), {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  returnDecision: (
    accessToken: string | null,
    ndrId: string,
    payload: ReturnDecisionInput,
  ): Promise<NdrActionResultDto> =>
    opsApiClient.request<NdrActionResultDto>(opsEndpoints.ndr.returnDecision(ndrId), {
      method: 'POST',
      accessToken,
      body: payload,
    }),
};
