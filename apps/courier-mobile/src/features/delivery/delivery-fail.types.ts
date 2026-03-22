import { z } from 'zod';

import type { DeliveryFailResultDto } from './delivery.types';

export type DeliveryFailNextAction = 'NONE' | 'CREATE_NDR' | 'START_RETURN';

export const deliveryFailFormSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string(),
  reasonCode: z.string().min(1, 'Reason code is required.'),
  nextAction: z.enum(['NONE', 'CREATE_NDR', 'START_RETURN']),
  note: z.string(),
  idempotencyKey: z.string(),
});

export type DeliveryFailFormValues = z.infer<typeof deliveryFailFormSchema>;

export interface DeliveryFailMutationResult {
  result: DeliveryFailResultDto;
  source: 'LIVE' | 'DUPLICATE_REPLAY';
}

export type DeliveryFailSubmitState =
  | 'IDLE'
  | 'SUBMITTING'
  | 'SUCCESS'
  | 'FAILED';
