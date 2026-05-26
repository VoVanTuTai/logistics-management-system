import { useMutation } from '@tanstack/react-query';

import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  CreateReturnCasePayload,
  DeliveryFailPayload,
  DeliveryFailResultDto,
  DeliverySuccessPayload,
  DeliverySuccessResultDto,
  NdrCaseDto,
  ReturnCaseDto,
} from './delivery.types';

export const deliveryApi = {
  markSuccess: (
    accessToken: string,
    payload: DeliverySuccessPayload,
  ): Promise<DeliverySuccessResultDto> =>
    courierApiClient.request(courierEndpoints.delivery.success, {
      method: 'POST',
      accessToken,
      body: payload,
      headers: { 'Idempotency-Key': payload.idempotencyKey },
    }),
  markFail: (
    accessToken: string,
    payload: DeliveryFailPayload,
  ): Promise<DeliveryFailResultDto> =>
    courierApiClient.request(courierEndpoints.delivery.fail, {
      method: 'POST',
      accessToken,
      body: payload,
      headers: { 'Idempotency-Key': payload.idempotencyKey },
    }),
  createReturnCase: (
    accessToken: string,
    payload: CreateReturnCasePayload,
  ): Promise<ReturnCaseDto> =>
    courierApiClient.request<ReturnCaseDto>(courierEndpoints.delivery.returns, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  listNdrCases: (
    accessToken: string,
    shipmentCode: string,
  ): Promise<NdrCaseDto[]> =>
    courierApiClient.request<NdrCaseDto[]>(
      courierEndpoints.delivery.ndrByShipment(shipmentCode),
      {
        method: 'GET',
        accessToken,
      },
    ),
};

export function useDeliverySuccessMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: DeliverySuccessPayload) =>
      deliveryApi.markSuccess(accessToken as string, payload),
  });
}

export function useDeliveryFailMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: DeliveryFailPayload) =>
      deliveryApi.markFail(accessToken as string, payload),
  });
}
