import { useMutation } from '@tanstack/react-query';

import { submitPickupScanAction } from './pickup.api';
import type { PickupScanCommand } from './pickup.types';

export function usePickupScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (command: PickupScanCommand) => {
      if (!accessToken) {
        throw new Error('Missing access token for pickup scan.');
      }

      return submitPickupScanAction(accessToken, command);
    },
  });
}
