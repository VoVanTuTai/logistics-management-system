import { submitDeliveryFailAction } from '../features/delivery/delivery-fail.api';
import { submitDeliverySuccessAction } from '../features/delivery/delivery-success.api';
import type { DeliveryFailPayload, DeliverySuccessPayload } from '../features/delivery/delivery.types';
import { submitHubScanAction } from '../features/scan/hub.api';
import type { HubScanCommand } from '../features/scan/hub.types';
import { submitPickupScanAction } from '../features/scan/pickup.api';
import type { PickupScanCommand } from '../features/scan/pickup.types';
import type { OfflineQueueItem } from './queue.types';

export async function executeOfflineQueueItem(
  accessToken: string,
  item: OfflineQueueItem,
): Promise<void> {
  switch (item.actionType) {
    case 'SCAN_PICKUP':
      await submitPickupScanAction(accessToken, item.payload as PickupScanCommand);
      return;
    case 'SCAN_INBOUND':
      await submitHubScanAction(accessToken, {
        ...(item.payload as HubScanCommand),
        mode: 'INBOUND',
      });
      return;
    case 'SCAN_OUTBOUND':
      await submitHubScanAction(accessToken, {
        ...(item.payload as HubScanCommand),
        mode: 'OUTBOUND',
      });
      return;
    case 'DELIVERY_SUCCESS':
      await submitDeliverySuccessAction(
        accessToken,
        item.payload as DeliverySuccessPayload,
      );
      return;
    case 'DELIVERY_FAIL':
      await submitDeliveryFailAction(
        accessToken,
        item.payload as DeliveryFailPayload,
      );
      return;
    default:
      throw new Error(`Unsupported offline queue action: ${item.actionType}`);
  }
}
