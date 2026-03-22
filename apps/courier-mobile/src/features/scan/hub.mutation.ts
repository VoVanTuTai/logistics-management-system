import { useMutation } from '@tanstack/react-query';

import { submitHubScanAction } from './hub.api';
import type { HubScanCommand } from './hub.types';

export function useHubScanMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (command: HubScanCommand) => {
      if (!accessToken) {
        throw new Error('Missing access token for hub scan.');
      }

      return submitHubScanAction(accessToken, command);
    },
  });
}
