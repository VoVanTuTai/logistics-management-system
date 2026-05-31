import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  collectCod,
  createSettlement,
  fetchCodRecordByShipmentCode,
  fetchCodRecords,
  fetchCodSummary,
  fetchCompanyBankInfo,
  fetchDailySettlement,
  remitCod,
} from './cod.api';
import type { CollectCodPayload, RemitCodPayload } from './cod.types';

export function useCodSummaryQuery(params: {
  courierId: string | null;
  accessToken: string | null;
}) {
  return useQuery({
    queryKey: ['cod', 'summary', params.courierId],
    queryFn: () => fetchCodSummary(params.courierId!, params.accessToken),
    enabled: !!params.courierId,
  });
}

export function useCodRecordsQuery(params: {
  courierId: string | null;
  accessToken: string | null;
  status?: string;
}) {
  return useQuery({
    queryKey: ['cod', 'records', params.courierId, params.status],
    queryFn: () =>
      fetchCodRecords(params.courierId!, params.accessToken, params.status),
    enabled: !!params.courierId,
  });
}

export function useCompanyBankInfoQuery(params: {
  accessToken: string | null;
}) {
  return useQuery({
    queryKey: ['cod', 'bank-info'],
    queryFn: () => fetchCompanyBankInfo(params.accessToken),
  });
}

export function useCollectCodMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CollectCodPayload) =>
      collectCod(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cod'] });
    },
  });
}

export function useRemitCodMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RemitCodPayload) => remitCod(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cod'] });
    },
  });
}

export function useDailySettlementQuery(params: {
  courierId: string | null;
  date: string | null;
  accessToken: string | null;
}) {
  return useQuery({
    queryKey: ['cod', 'settlements', 'daily', params.courierId, params.date],
    queryFn: () =>
      fetchDailySettlement(
        params.courierId!,
        params.date!,
        params.accessToken,
      ),
    enabled: !!params.courierId && !!params.date,
  });
}

export function useCreateSettlementMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      reportDate: string;
      hubCode: string;
      courierId: string;
      shipmentCodes: string[];
      createdBy: string;
    }) => createSettlement(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cod'] });
    },
  });
}

export function useCodRecordByShipmentQuery(params: {
  shipmentCode: string | null;
  accessToken: string | null;
  refetchInterval?: number | false;
}) {
  return useQuery({
    queryKey: ['cod', 'shipment', params.shipmentCode],
    queryFn: () =>
      fetchCodRecordByShipmentCode(params.shipmentCode!, params.accessToken),
    enabled: !!params.shipmentCode,
    refetchInterval: params.refetchInterval,
  });
}

