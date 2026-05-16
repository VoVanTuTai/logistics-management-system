import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type { NdrCaseDto, ShipmentExceptionPayload } from './delivery.types';

export async function reportShipmentException(
  accessToken: string,
  payload: ShipmentExceptionPayload,
): Promise<NdrCaseDto> {
  return courierApiClient.request<NdrCaseDto>(courierEndpoints.delivery.exception, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}
