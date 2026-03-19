import { useMutation } from '@tanstack/react-query';

import { submitDeliveryFailAction } from './delivery-fail.api';
import type { DeliveryFailPayload } from './delivery.types';

export function useDeliveryFailActionMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: DeliveryFailPayload) => {
      if (!accessToken) {
        throw new Error('Missing access token for delivery fail.');
      }

      return submitDeliveryFailAction(accessToken, payload);
    },
  });
}
