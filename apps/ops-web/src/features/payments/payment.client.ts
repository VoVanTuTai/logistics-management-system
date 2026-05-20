import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  CodDailySettlementFilters,
  CodDailySettlementSummaryDto,
  CodSettlementBatchDto,
  ConfirmCodSettlementInput,
  CreateCodSettlementInput,
} from './payment.types';

function buildDailySettlementPath(filters: CodDailySettlementFilters): string {
  const searchParams = new URLSearchParams();

  appendQueryParam(searchParams, 'date', filters.date);
  appendQueryParam(searchParams, 'hubCode', filters.hubCode);
  appendQueryParam(searchParams, 'courierId', filters.courierId);
  appendQueryParam(searchParams, 'status', filters.status);

  const queryString = searchParams.toString();

  return queryString
    ? `${opsEndpoints.payment.codDailySettlement}?${queryString}`
    : opsEndpoints.payment.codDailySettlement;
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

export const paymentClient = {
  getCodDailySettlement: (
    accessToken: string | null,
    filters: CodDailySettlementFilters,
  ): Promise<CodDailySettlementSummaryDto> =>
    opsApiClient.request<CodDailySettlementSummaryDto>(
      buildDailySettlementPath(filters),
      { accessToken },
    ),

  createCodSettlement: (
    accessToken: string | null,
    payload: CreateCodSettlementInput,
  ): Promise<CodSettlementBatchDto> =>
    opsApiClient.request<CodSettlementBatchDto>(
      opsEndpoints.payment.createCodSettlement,
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),

  confirmCodSettlement: (
    accessToken: string | null,
    settlementId: string,
    payload: ConfirmCodSettlementInput,
  ): Promise<CodSettlementBatchDto> =>
    opsApiClient.request<CodSettlementBatchDto>(
      opsEndpoints.payment.confirmCodSettlement(settlementId),
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),
};
