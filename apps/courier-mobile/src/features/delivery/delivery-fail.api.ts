import { ApiClientError, courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type { DeliveryFailPayload, DeliveryFailResultDto } from './delivery.types';
import type { DeliveryFailMutationResult } from './delivery-fail.types';

export async function submitDeliveryFailAction(
  accessToken: string,
  payload: DeliveryFailPayload,
): Promise<DeliveryFailMutationResult> {
  try {
    const result = await courierApiClient.request<DeliveryFailResultDto>(
      courierEndpoints.delivery.fail,
      {
        method: 'POST',
        accessToken,
        body: payload,
        headers: { 'Idempotency-Key': payload.idempotencyKey },
      },
    );

    return {
      result,
      source: 'LIVE',
    };
  } catch (error) {
    if (error instanceof ApiClientError && isDuplicateStatus(error.status)) {
      const replayResult = extractDuplicateReplayResult(error.details);
      if (replayResult) {
        return {
          result: replayResult,
          source: 'DUPLICATE_REPLAY',
        };
      }
    }

    throw error;
  }
}

function isDuplicateStatus(status: number | null): boolean {
  return status === 409 || status === 422;
}

function extractDuplicateReplayResult(
  details: unknown,
): DeliveryFailResultDto | null {
  if (isDeliveryFailResultDto(details)) {
    return details;
  }

  if (isObject(details) && 'result' in details && isDeliveryFailResultDto(details.result)) {
    return details.result;
  }

  if (isObject(details) && 'data' in details && isDeliveryFailResultDto(details.data)) {
    return details.data;
  }

  return null;
}

function isDeliveryFailResultDto(value: unknown): value is DeliveryFailResultDto {
  if (!isObject(value)) {
    return false;
  }

  if (value.kind !== 'fail') {
    return false;
  }

  return 'deliveryAttempt' in value && isObject(value.deliveryAttempt);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
