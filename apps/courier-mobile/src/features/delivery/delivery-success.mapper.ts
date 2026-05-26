import type { DeliverySuccessPayload } from './delivery.types';
import type {
  DeliverySuccessFormValues,
  DeliverySuccessMapperContext,
} from './delivery-success.types';

export function mapDeliverySuccessFormToPayload(
  formValues: DeliverySuccessFormValues,
  context: DeliverySuccessMapperContext,
): DeliverySuccessPayload {
  return {
    shipmentCode: formValues.shipmentCode,
    taskId: context.taskId ?? null,
    courierId: context.courierId ?? null,
    locationCode: formValues.locationCode || null,
    actor: context.actor,
    note: formValues.note || null,
    occurredAt: context.occurredAt,
    idempotencyKey: context.idempotencyKey,
    podImageUrl: formValues.podImageUrl || null,
    podNote: formValues.podNote || null,
    podCapturedBy: context.actor,
    otpCode: formValues.otpCode || null,
  };
}
