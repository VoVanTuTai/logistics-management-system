import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  NdrActionResultDto,
  NdrCaseDetailDto,
  NdrCaseListItemDto,
  RescheduleInput,
  ReturnDecisionInput,
} from './ndr.types';

export const ndrClient = {
  list: (accessToken: string | null): Promise<NdrCaseListItemDto[]> =>
    opsApiClient.request<NdrCaseListItemDto[]>(opsEndpoints.ndr.list, {
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
