import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  CodDailySettlementSummaryDto,
  CodRecordDto,
  CodSettlementBatchDto,
  CodSummaryDto,
  CollectCodPayload,
  CompanyBankInfoDto,
  RemitCodPayload,
} from './cod.types';

export async function fetchCodSummary(
  courierId: string,
  accessToken: string | null,
): Promise<CodSummaryDto> {
  return courierApiClient.request<CodSummaryDto>(
    courierEndpoints.cod.summary(courierId),
    {
      method: 'GET',
      accessToken,
    },
  );
}

export async function fetchCodRecords(
  courierId: string,
  accessToken: string | null,
  status?: string,
): Promise<CodRecordDto[]> {
  let path = courierEndpoints.cod.records(courierId);
  if (status) {
    path += `?status=${encodeURIComponent(status)}`;
  }

  return courierApiClient.request<CodRecordDto[]>(path, {
    method: 'GET',
    accessToken,
  });
}

export async function collectCod(
  payload: CollectCodPayload,
  accessToken: string | null,
): Promise<CodRecordDto> {
  return courierApiClient.request<CodRecordDto>(
    courierEndpoints.cod.collect,
    {
      method: 'POST',
      accessToken,
      body: payload,
    },
  );
}

export async function remitCod(
  payload: RemitCodPayload,
  accessToken: string | null,
): Promise<CodRecordDto> {
  return courierApiClient.request<CodRecordDto>(
    courierEndpoints.cod.remit,
    {
      method: 'POST',
      accessToken,
      body: payload,
    },
  );
}

export async function fetchCompanyBankInfo(
  accessToken: string | null,
): Promise<CompanyBankInfoDto> {
  return courierApiClient.request<CompanyBankInfoDto>(
    courierEndpoints.cod.bankInfo,
    {
      method: 'GET',
      accessToken,
    },
  );
}

export async function fetchCodQrUrl(
  amount: number,
  memo: string,
  accessToken: string | null,
): Promise<{ url: string }> {
  return courierApiClient.request<{ url: string }>(
    courierEndpoints.cod.qr(amount, memo),
    {
      method: 'GET',
      accessToken,
    },
  );
}

export async function fetchDailySettlement(
  courierId: string,
  date: string,
  accessToken: string | null,
): Promise<CodDailySettlementSummaryDto> {
  return courierApiClient.request<CodDailySettlementSummaryDto>(
    courierEndpoints.cod.dailySettlement(courierId, date),
    {
      method: 'GET',
      accessToken,
    },
  );
}

export async function createSettlement(
  payload: {
    reportDate: string;
    hubCode: string;
    courierId: string;
    shipmentCodes: string[];
    createdBy: string;
  },
  accessToken: string | null,
): Promise<CodSettlementBatchDto> {
  return courierApiClient.request<CodSettlementBatchDto>(
    courierEndpoints.cod.createSettlement,
    {
      method: 'POST',
      accessToken,
      body: payload,
    },
  );
}
