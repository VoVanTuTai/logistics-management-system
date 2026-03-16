export interface PickupRequestListItemDto {
  id: string;
  requestCode: string;
  shipmentCode: string | null;
  status: string;
  requestedAt: string | null;
}

export interface PickupRequestDetailDto {
  id: string;
  requestCode: string;
  shipmentCode: string | null;
  status: string;
  requestedAt: string | null;
  updatedAt?: string | null;
  note?: string | null;
}

export interface PickupRequestListFilters {
  status?: string;
}

export interface PickupReviewInput {
  note?: string | null;
}

export type PickupActionResultDto = Record<string, unknown>;
