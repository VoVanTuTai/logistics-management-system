import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type { ShipmentDto } from './shipment.types';

interface ShipmentApiResponse {
  id: string;
  code: string;
  currentStatus: string;
  metadata: Record<string, unknown> | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

function resolveCodAmount(metadata: Record<string, unknown> | null): number | null {
  if (!metadata) {
    return null;
  }

  const raw = metadata.codAmount;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function mapToShipmentDto(response: ShipmentApiResponse): ShipmentDto {
  return {
    id: response.id,
    code: response.code,
    currentStatus: response.currentStatus,
    metadata: response.metadata,
    codAmount: resolveCodAmount(response.metadata),
    cancellationReason: response.cancellationReason,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

export const shipmentApi = {
  getShipmentDetail: (
    accessToken: string,
    shipmentCode: string,
  ): Promise<ShipmentDto> =>
    courierApiClient
      .request<ShipmentApiResponse>(courierEndpoints.shipment.detail(shipmentCode), {
        accessToken,
      })
      .then(mapToShipmentDto),
};

