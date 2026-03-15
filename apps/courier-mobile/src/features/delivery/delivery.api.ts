import { useMutation } from '@tanstack/react-query';

import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  DeliveryFailPayload,
  DeliveryFailResultDto,
  DeliverySuccessPayload,
  DeliverySuccessResultDto,
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
    }),
  markFail: (
    accessToken: string,
    payload: DeliveryFailPayload,
  ): Promise<DeliveryFailResultDto> =>
    courierApiClient.request(courierEndpoints.delivery.fail, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
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
