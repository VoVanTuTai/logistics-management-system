import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  CompleteReturnCaseInput,
  ReturnCaseDto,
  ReturnCaseFilters,
} from './return.types';

function buildReturnListPath(filters: ReturnCaseFilters = {}): string {
  const searchParams = new URLSearchParams();

  appendQueryParam(searchParams, 'shipmentCode', filters.shipmentCode);
  appendQueryParam(searchParams, 'ndrCaseId', filters.ndrCaseId);
  appendQueryParam(searchParams, 'status', filters.status);

  const queryString = searchParams.toString();

  return queryString
    ? `${opsEndpoints.returns.list}?${queryString}`
    : opsEndpoints.returns.list;
}

function appendQueryParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | null | undefined,
): void {
  const normalized = value?.trim();

  if (!normalized || normalized.toUpperCase() === 'ALL') {
    return;
  }

  searchParams.set(key, normalized);
}

export const returnClient = {
  list: (
    accessToken: string | null,
    filters: ReturnCaseFilters = {},
  ): Promise<ReturnCaseDto[]> =>
    opsApiClient.request<ReturnCaseDto[]>(buildReturnListPath(filters), {
      accessToken,
    }),

  detail: (accessToken: string | null, returnId: string): Promise<ReturnCaseDto> =>
    opsApiClient.request<ReturnCaseDto>(opsEndpoints.returns.detail(returnId), {
      accessToken,
    }),

  complete: (
    accessToken: string | null,
    returnId: string,
    payload: CompleteReturnCaseInput,
  ): Promise<ReturnCaseDto> =>
    opsApiClient.request<ReturnCaseDto>(opsEndpoints.returns.complete(returnId), {
      method: 'POST',
      accessToken,
      body: payload,
    }),
};
