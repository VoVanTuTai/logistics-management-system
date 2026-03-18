import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  ApproveShipmentInput,
  CreateShipmentInput,
  ReviewShipmentInput,
  ShipmentActionResultDto,
  ShipmentDetailDto,
  ShipmentListFilters,
  ShipmentListItemDto,
  UpdateShipmentInput,
} from './shipments.types';

interface ShipmentApiResponse {
  id: string;
  code: string;
  currentStatus: string;
  metadata: Record<string, unknown> | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function resolveReceiverRegion(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const receiver = asRecord(metadata.receiver);
  const region = asString(receiver?.region) ?? asString(metadata.receiverRegion);

  if (region) {
    return region;
  }

  const receiverAddress = asString(receiver?.address) ?? asString(metadata.receiverAddress);
  if (!receiverAddress) {
    return null;
  }

  const parts = receiverAddress
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function resolveSenderName(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const sender = asRecord(metadata.sender);
  return asString(sender?.name) ?? asString(metadata.senderName);
}

function resolveSenderPhone(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const sender = asRecord(metadata.sender);
  return asString(sender?.phone) ?? asString(metadata.senderPhone);
}

function resolveSenderAddress(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const sender = asRecord(metadata.sender);
  return asString(sender?.address) ?? asString(metadata.senderAddress);
}

function resolveReceiverName(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const receiver = asRecord(metadata.receiver);
  return asString(receiver?.name) ?? asString(metadata.receiverName);
}

function resolveReceiverPhone(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const receiver = asRecord(metadata.receiver);
  return asString(receiver?.phone) ?? asString(metadata.receiverPhone);
}

function resolveReceiverAddress(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const receiver = asRecord(metadata.receiver);
  return asString(receiver?.address) ?? asString(metadata.receiverAddress);
}

function resolvePlatform(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const integration = asRecord(metadata.integration);

  return (
    asString(metadata.platform) ??
    asString(metadata.salesChannel) ??
    asString(metadata.channel) ??
    asString(metadata.sourcePlatform) ??
    asString(metadata.marketplace) ??
    asString(integration?.platform) ??
    asString(metadata.source)
  );
}

function resolveServiceType(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const service = asRecord(metadata.service);
  return asString(service?.type) ?? asString(metadata.serviceType);
}

function resolveCodAmount(metadata: Record<string, unknown> | null): number | null {
  if (!metadata) {
    return null;
  }

  return asNumber(metadata.codAmount);
}

function resolveDeliveryNote(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  return asString(metadata.deliveryNote) ?? asString(metadata.note);
}

function buildShipmentListPath(filters: ShipmentListFilters): string {
  const params = new URLSearchParams();

  if (filters.q?.trim()) {
    params.set('q', filters.q.trim());
  }

  if (filters.status?.trim()) {
    params.set('status', filters.status.trim());
  }

  const queryString = params.toString();
  return queryString ? `${opsEndpoints.shipments.list}?${queryString}` : opsEndpoints.shipments.list;
}

function mapShipmentToListItem(payload: ShipmentApiResponse): ShipmentListItemDto {
  const metadata = payload.metadata;

  return {
    id: payload.id,
    shipmentCode: payload.code,
    currentStatus: payload.currentStatus,
    currentLocation: null,
    receiverRegion: resolveReceiverRegion(metadata),
    senderName: resolveSenderName(metadata),
    senderPhone: resolveSenderPhone(metadata),
    senderAddress: resolveSenderAddress(metadata),
    receiverName: resolveReceiverName(metadata),
    receiverPhone: resolveReceiverPhone(metadata),
    receiverAddress: resolveReceiverAddress(metadata),
    platform: resolvePlatform(metadata),
    serviceType: resolveServiceType(metadata),
    codAmount: resolveCodAmount(metadata),
    deliveryNote: resolveDeliveryNote(metadata),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

function mapShipmentToDetail(payload: ShipmentApiResponse): ShipmentDetailDto {
  const metadata = payload.metadata;

  return {
    id: payload.id,
    shipmentCode: payload.code,
    currentStatus: payload.currentStatus,
    currentLocation: null,
    senderName: resolveSenderName(metadata),
    senderPhone: resolveSenderPhone(metadata),
    senderAddress: resolveSenderAddress(metadata),
    receiverName: resolveReceiverName(metadata),
    receiverPhone: resolveReceiverPhone(metadata),
    receiverAddress: resolveReceiverAddress(metadata),
    receiverRegion: resolveReceiverRegion(metadata),
    platform: resolvePlatform(metadata),
    serviceType: resolveServiceType(metadata),
    codAmount: resolveCodAmount(metadata),
    note: resolveDeliveryNote(metadata),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

export const shipmentsClient = {
  list: (
    accessToken: string | null,
    filters: ShipmentListFilters,
  ): Promise<ShipmentListItemDto[]> =>
    opsApiClient
      .request<ShipmentApiResponse[]>(buildShipmentListPath(filters), {
        accessToken,
      })
      .then((items) => items.map(mapShipmentToListItem)),
  detail: (
    accessToken: string | null,
    shipmentId: string,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient
      .request<ShipmentApiResponse>(opsEndpoints.shipments.detail(shipmentId), {
        accessToken,
      })
      .then(mapShipmentToDetail),
  create: (
    accessToken: string | null,
    payload: CreateShipmentInput,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient
      .request<ShipmentApiResponse>(opsEndpoints.shipments.list, {
        method: 'POST',
        accessToken,
        body: payload,
      })
      .then(mapShipmentToDetail),
  update: (
    accessToken: string | null,
    shipmentId: string,
    payload: UpdateShipmentInput,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient
      .request<ShipmentApiResponse>(opsEndpoints.shipments.detail(shipmentId), {
        method: 'PATCH',
        accessToken,
        body: payload,
      })
      .then(mapShipmentToDetail),
  review: (
    accessToken: string | null,
    shipmentId: string,
    payload: ReviewShipmentInput,
  ): Promise<ShipmentActionResultDto> =>
    opsApiClient.request<ShipmentActionResultDto>(
      `${opsEndpoints.shipments.detail(shipmentId)}/review`,
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),
  approve: (
    accessToken: string | null,
    shipmentId: string,
    payload: ApproveShipmentInput,
  ): Promise<ShipmentActionResultDto> =>
    opsApiClient.request<ShipmentActionResultDto>(
      `${opsEndpoints.shipments.detail(shipmentId)}/approve`,
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),
};
