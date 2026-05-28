import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  ApproveShipmentInput,
  ConfirmLabelReprintInput,
  CreateShipmentInput,
  ReviewShipmentInput,
  ShipmentActionResultDto,
  ShipmentDetailDto,
  ShipmentListFilters,
  ShipmentListItemDto,
  ShipmentListPageDto,
  UpdateShipmentInput,
} from './shipments.types';

interface ShipmentApiResponse {
  id: string;
  code: string;
  currentStatus: string;
  metadata: Record<string, unknown> | null;
  isLocked?: boolean;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ShipmentListPageApiResponse {
  items: ShipmentApiResponse[];
  pageInfo?: {
    hasNextPage?: boolean;
    total?: number;
  };
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

function resolveRequiresLabelReprint(metadata: Record<string, unknown> | null): boolean {
  const deliveryInfoChange = asRecord(metadata?.deliveryInfoChange);

  return (
    deliveryInfoChange?.requiresLabelReprint === true ||
    deliveryInfoChange?.blocksOpsUntilLabelReprint === true
  );
}

function resolveLabelReprintReason(metadata: Record<string, unknown> | null): string | null {
  const deliveryInfoChange = asRecord(metadata?.deliveryInfoChange);
  const changeRequestId = asString(deliveryInfoChange?.changeRequestId);

  return changeRequestId
    ? `Đã duyệt đổi thông tin giao hàng từ yêu cầu ${changeRequestId}.`
    : asString(deliveryInfoChange?.reason);
}

function resolveOperationLockReason(
  metadata: Record<string, unknown> | null,
  isLocked?: boolean,
): string | null {
  const returnWorkflow = asRecord(metadata?.returnWorkflow);

  if (returnWorkflow?.blocksOps === true) {
    return 'Đang chuyển hoàn, chỉ xử lý theo luồng đăng ký/in tem chuyển hoàn.';
  }

  return isLocked === true ? 'Vận đơn đang bị khóa bởi luồng xử lý ngoại lệ.' : null;
}

function resolveReceiverRegion(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const receiver = asRecord(metadata.receiver);
  const region =
    asString(receiver?.region) ??
    asString(receiver?.province) ??
    asString(metadata.receiverRegion);

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

function resolveSenderWard(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const sender = asRecord(metadata.sender);
  return asString(sender?.ward) ?? asString(metadata.senderWard);
}

function resolveSenderDistrict(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const sender = asRecord(metadata.sender);
  return asString(sender?.district) ?? asString(metadata.senderDistrict);
}

function resolveSenderProvince(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const sender = asRecord(metadata.sender);
  return asString(sender?.province) ?? asString(metadata.senderProvince);
}

function resolveSenderHubCode(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const sender = asRecord(metadata.sender);
  const routing = asRecord(metadata.routing);

  return (
    asString(sender?.hubCode) ??
    asString(metadata.senderHubCode) ??
    asString(routing?.originHubCode) ??
    asString(metadata.originHubCode)
  );
}

function resolveReceiverHubCode(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const receiver = asRecord(metadata.receiver);
  const routing = asRecord(metadata.routing);

  return (
    asString(receiver?.hubCode) ??
    asString(metadata.receiverHubCode) ??
    asString(routing?.destinationHubCode) ??
    asString(metadata.destinationHubCode)
  );
}

function resolveOriginHubCode(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const routing = asRecord(metadata.routing);
  return asString(routing?.originHubCode) ?? asString(metadata.originHubCode);
}

function resolveDestinationHubCode(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const routing = asRecord(metadata.routing);
  return asString(routing?.destinationHubCode) ?? asString(metadata.destinationHubCode);
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

function resolveParcelType(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const parcel = asRecord(metadata.parcel);
  const item = asRecord(metadata.item);

  return (
    asString(parcel?.type) ??
    asString(item?.type) ??
    asString(metadata.parcelType) ??
    asString(metadata.itemType) ??
    asString(metadata.goodsType) ??
    asString(metadata.productType)
  );
}

function resolveCodAmount(metadata: Record<string, unknown> | null): number | null {
  if (!metadata) {
    return null;
  }

  return asNumber(metadata.codAmount);
}

function resolveShippingFee(metadata: Record<string, unknown> | null): number | null {
  if (!metadata) {
    return null;
  }

  const pricing = asRecord(metadata.pricing);

  return (
    asNumber(metadata.shippingFee) ??
    asNumber(metadata.deliveryFee) ??
    asNumber(metadata.estimatedFee) ??
    asNumber(metadata.fee) ??
    asNumber(pricing?.shippingFee) ??
    asNumber(pricing?.deliveryFee) ??
    asNumber(pricing?.estimatedFee) ??
    asNumber(pricing?.totalFee) ??
    asNumber(pricing?.fee)
  );
}

function resolveDeliveryNote(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  return asString(metadata.deliveryNote) ?? asString(metadata.note);
}

function resolveCurrentLocation(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) {
    return null;
  }

  const location = asRecord(metadata.location);
  const hub = asRecord(metadata.hub);

  return (
    asString(metadata.currentLocation) ??
    asString(metadata.currentHubCode) ??
    asString(location?.current) ??
    asString(location?.hubCode) ??
    asString(hub?.code) ??
    asString(hub?.currentCode)
  );
}

function buildShipmentListPath(filters: ShipmentListFilters): string {
  const params = new URLSearchParams();

  if (filters.q?.trim()) {
    params.set('q', filters.q.trim());
  }

  if (filters.shipmentCode?.trim()) {
    params.set('shipmentCode', filters.shipmentCode.trim());
  }

  if (filters.shipmentCodes?.length) {
    params.set('shipmentCodes', filters.shipmentCodes.join(','));
  }

  if (filters.status?.trim()) {
    params.set('status', filters.status.trim());
  }

  if (filters.createdFrom?.trim()) {
    params.set('createdFrom', filters.createdFrom.trim());
  }

  if (filters.createdTo?.trim()) {
    params.set('createdTo', filters.createdTo.trim());
  }

  if (filters.hubCodes?.length) {
    params.set('hubCodes', filters.hubCodes.join(','));
  }

  if (typeof filters.limit === 'number') {
    params.set('limit', String(filters.limit));
  }

  if (typeof filters.offset === 'number') {
    params.set('offset', String(filters.offset));
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
    currentLocation: resolveCurrentLocation(metadata),
    parcelType: resolveParcelType(metadata),
    shippingFee: resolveShippingFee(metadata),
    receiverRegion: resolveReceiverRegion(metadata),
    senderWard: resolveSenderWard(metadata),
    senderDistrict: resolveSenderDistrict(metadata),
    senderProvince: resolveSenderProvince(metadata),
    senderHubCode: resolveSenderHubCode(metadata),
    receiverHubCode: resolveReceiverHubCode(metadata),
    originHubCode: resolveOriginHubCode(metadata),
    destinationHubCode: resolveDestinationHubCode(metadata),
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
    requiresLabelReprint: resolveRequiresLabelReprint(metadata),
    labelReprintReason: resolveLabelReprintReason(metadata),
    isOperationLocked: Boolean(resolveOperationLockReason(metadata, payload.isLocked)),
    operationLockReason: resolveOperationLockReason(metadata, payload.isLocked),
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
    currentLocation: resolveCurrentLocation(metadata),
    parcelType: resolveParcelType(metadata),
    shippingFee: resolveShippingFee(metadata),
    senderName: resolveSenderName(metadata),
    senderPhone: resolveSenderPhone(metadata),
    senderAddress: resolveSenderAddress(metadata),
    receiverName: resolveReceiverName(metadata),
    receiverPhone: resolveReceiverPhone(metadata),
    receiverAddress: resolveReceiverAddress(metadata),
    receiverRegion: resolveReceiverRegion(metadata),
    senderWard: resolveSenderWard(metadata),
    senderDistrict: resolveSenderDistrict(metadata),
    senderProvince: resolveSenderProvince(metadata),
    senderHubCode: resolveSenderHubCode(metadata),
    receiverHubCode: resolveReceiverHubCode(metadata),
    originHubCode: resolveOriginHubCode(metadata),
    destinationHubCode: resolveDestinationHubCode(metadata),
    platform: resolvePlatform(metadata),
    serviceType: resolveServiceType(metadata),
    codAmount: resolveCodAmount(metadata),
    note: resolveDeliveryNote(metadata),
    requiresLabelReprint: resolveRequiresLabelReprint(metadata),
    labelReprintReason: resolveLabelReprintReason(metadata),
    isOperationLocked: Boolean(resolveOperationLockReason(metadata, payload.isLocked)),
    operationLockReason: resolveOperationLockReason(metadata, payload.isLocked),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

function normalizeShipmentListPage(
  payload: ShipmentApiResponse[] | ShipmentListPageApiResponse,
): ShipmentListPageDto {
  if (Array.isArray(payload)) {
    return {
      items: payload.map(mapShipmentToListItem),
      pageInfo: {
        hasNextPage: false,
        total: payload.length,
      },
    };
  }

  const items = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: items.map(mapShipmentToListItem),
    pageInfo: {
      hasNextPage: Boolean(payload.pageInfo?.hasNextPage),
      total: payload.pageInfo?.total,
    },
  };
}

export const shipmentsClient = {
  list: (
    accessToken: string | null,
    filters: ShipmentListFilters,
  ): Promise<ShipmentListItemDto[]> =>
    shipmentsClient.listPage(accessToken, filters).then((page) => page.items),
  listPage: (
    accessToken: string | null,
    filters: ShipmentListFilters,
  ): Promise<ShipmentListPageDto> =>
    opsApiClient
      .request<ShipmentApiResponse[] | ShipmentListPageApiResponse>(buildShipmentListPath(filters), {
        accessToken,
      })
      .then(normalizeShipmentListPage),
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
  confirmLabelReprint: (
    accessToken: string | null,
    shipmentCode: string,
    payload: ConfirmLabelReprintInput,
  ): Promise<ShipmentDetailDto> =>
    opsApiClient
      .request<ShipmentApiResponse>(
        `${opsEndpoints.shipments.detail(shipmentCode)}/label-reprint/confirm`,
        {
          method: 'POST',
          accessToken,
          body: payload,
        },
      )
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
