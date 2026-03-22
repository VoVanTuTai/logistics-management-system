import { useMutation } from '@tanstack/react-query';

import { submitDeliverySuccessAction } from './delivery-success.api';
import type { DeliverySuccessPayload } from './delivery.types';

export function useDeliverySuccessActionMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: DeliverySuccessPayload) => {
      if (!accessToken) {
        throw new Error('Missing access token for delivery success.');
      }

      return submitDeliverySuccessAction(accessToken, payload);
    },
  });
}
