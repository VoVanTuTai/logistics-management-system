import { ApiClientError, courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type { RecordScanResultDto } from './scan.types';
import type { PickupScanCommand, PickupScanMutationResult } from './pickup.types';

export async function submitPickupScanAction(
  accessToken: string,
  payload: PickupScanCommand,
): Promise<PickupScanMutationResult> {
  try {
    const result = await courierApiClient.request<RecordScanResultDto>(
      courierEndpoints.scan.pickup,
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
): RecordScanResultDto | null {
  if (isRecordScanResultDto(details)) {
    return details;
  }

  if (isObject(details) && 'result' in details && isRecordScanResultDto(details.result)) {
    return details.result;
  }

  if (isObject(details) && 'data' in details && isRecordScanResultDto(details.data)) {
    return details.data;
  }

  return null;
}

function isRecordScanResultDto(value: unknown): value is RecordScanResultDto {
  if (!isObject(value)) {
    return false;
  }

  if (!('scanEvent' in value) || !isObject(value.scanEvent)) {
    return false;
  }

  if (!('currentLocation' in value) || !isObject(value.currentLocation)) {
    return false;
  }

  const scanEvent = value.scanEvent;
  const currentLocation = value.currentLocation;

  return (
    'shipmentCode' in scanEvent &&
    typeof scanEvent.shipmentCode === 'string' &&
    'idempotencyKey' in scanEvent &&
    typeof scanEvent.idempotencyKey === 'string' &&
    'shipmentCode' in currentLocation &&
    typeof currentLocation.shipmentCode === 'string'
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
