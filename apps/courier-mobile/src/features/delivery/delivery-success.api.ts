import { ApiClientError, courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  DeliverySuccessPayload,
  DeliverySuccessResultDto,
} from './delivery.types';
import type { DeliverySuccessMutationResult } from './delivery-success.types';

export async function submitDeliverySuccessAction(
  accessToken: string,
  payload: DeliverySuccessPayload,
): Promise<DeliverySuccessMutationResult> {
  try {
    const result = await courierApiClient.request<DeliverySuccessResultDto>(
      courierEndpoints.delivery.success,
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
): DeliverySuccessResultDto | null {
  if (isDeliverySuccessResultDto(details)) {
    return details;
  }

  if (
    isObject(details) &&
    'result' in details &&
    isDeliverySuccessResultDto(details.result)
  ) {
    return details.result;
  }

  if (
    isObject(details) &&
    'data' in details &&
    isDeliverySuccessResultDto(details.data)
  ) {
    return details.data;
  }

  return null;
}

function isDeliverySuccessResultDto(
  value: unknown,
): value is DeliverySuccessResultDto {
  if (!isObject(value)) {
    return false;
  }

  if (value.kind !== 'success') {
    return false;
  }

  return 'deliveryAttempt' in value && isObject(value.deliveryAttempt);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
