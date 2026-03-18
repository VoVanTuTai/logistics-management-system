export interface ShipmentListItemDto {
  id: string;
  shipmentCode: string;
  currentStatus: string;
  currentLocation: string | null;
  receiverRegion: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  platform: string | null;
  serviceType: string | null;
  codAmount: number | null;
  deliveryNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentDetailDto {
  id: string;
  shipmentCode: string;
  currentStatus: string;
  currentLocation: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  receiverRegion: string | null;
  platform: string | null;
  serviceType: string | null;
  codAmount: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentInput {
  code?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateShipmentInput {
  note?: string | null;
  // TODO(contract): add editable fields when ops contract is finalized
}

export interface ShipmentListFilters {
  q?: string;
  status?: string;
}

export interface ReviewShipmentInput {
  note?: string | null;
}

export interface ApproveShipmentInput {
  note?: string | null;
}

export interface ShipmentActionResultDto {
  shipment: ShipmentDetailDto;
  // TODO(contract): add additional action metadata when API is finalized.
}
