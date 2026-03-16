import { z } from 'zod';

export const ndrActionModeSchema = z.enum(['RESCHEDULE', 'RETURN']);

export const rescheduleNdrSchema = z.object({
  nextDeliveryAt: z.string().trim().min(1, 'Next delivery time is required'),
  note: z.string().optional(),
});

export const returnDecisionSchema = z.object({
  returnToSender: z.boolean(),
  note: z.string().optional(),
});

export type NdrActionMode = z.infer<typeof ndrActionModeSchema>;
export type RescheduleNdrFormValues = z.infer<typeof rescheduleNdrSchema>;
export type ReturnDecisionFormValues = z.infer<typeof returnDecisionSchema>;
