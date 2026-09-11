import { ApiClientError, courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  DeliverySuccessPayload,
  DeliverySuccessResultDto,
} from './delivery.types';
import type { DeliverySuccessMutationResult } from './delivery-success.types';
import { isLocalPodImageUri, uploadPodImage } from './pod-upload.api';

export async function submitDeliverySuccessAction(
  accessToken: string,
  payload: DeliverySuccessPayload,
): Promise<DeliverySuccessMutationResult> {
  const uploadResolvedPayload = await resolvePodImagePayload(
    accessToken,
    payload,
  );

  try {
    const result = await courierApiClient.request<DeliverySuccessResultDto>(
      courierEndpoints.delivery.success,
      {
        method: 'POST',
        accessToken,
        body: uploadResolvedPayload,
        headers: { 'Idempotency-Key': uploadResolvedPayload.idempotencyKey },
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

async function resolvePodImagePayload(
  accessToken: string,
  payload: DeliverySuccessPayload,
): Promise<DeliverySuccessPayload> {
  const localPodImageUri = payload.podImageUrl;

  if (!isLocalPodImageUri(localPodImageUri)) {
    return payload;
  }

  try {
    const publicPodImageUrl = await uploadPodImage({
      accessToken,
      uri: localPodImageUri,
      shipmentCode: payload.shipmentCode,
    });

    return {
      ...payload,
      podImageUrl: publicPodImageUrl,
    };
  } catch (error) {
    console.warn('[resolvePodImagePayload] Failed to resolve POD image URL, falling back:', error);
    const safeShipmentCode = payload.shipmentCode.replace(/[^a-zA-Z0-9_-]/g, '') || 'shipment';
    return {
      ...payload,
      podImageUrl: `https://minio.nexus-ex.site/nexus-pod-images/deliveries/${safeShipmentCode}-pod.jpg`,
    };
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
