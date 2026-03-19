import { z } from 'zod';

import type { DeliverySuccessResultDto } from './delivery.types';

export const deliverySuccessFormSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string().optional().default(''),
  otpCode: z.string().optional().default(''),
  podImageUrl: z.string().optional().default(''),
  podNote: z.string().optional().default(''),
  note: z.string().optional().default(''),
  idempotencyKey: z.string().optional().default(''),
});

export type DeliverySuccessFormValues = z.infer<typeof deliverySuccessFormSchema>;

export interface DeliverySuccessMapperContext {
  taskId?: string;
  actor: string | null;
  idempotencyKey: string;
  occurredAt: string;
}

export interface DeliverySuccessMutationResult {
  result: DeliverySuccessResultDto;
  source: 'LIVE' | 'DUPLICATE_REPLAY';
}

export type DeliverySuccessSubmitState =
  | 'IDLE'
  | 'SUBMITTING'
  | 'SUCCESS'
  | 'FAILED';
