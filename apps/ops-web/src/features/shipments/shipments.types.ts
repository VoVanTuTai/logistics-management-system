export interface ShipmentListItemDto {
  id: string;
  shipmentCode: string;
  currentStatus: string;
  currentLocation: string | null;
  updatedAt: string;
}

export interface ShipmentDetailDto {
  id: string;
  shipmentCode: string;
  currentStatus: string;
  currentLocation: string | null;
  senderName: string | null;
  receiverName: string | null;
  note: string | null;
  updatedAt: string;
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
