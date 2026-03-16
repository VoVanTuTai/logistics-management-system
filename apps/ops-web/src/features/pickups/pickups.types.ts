export interface PickupRequestItemDto {
  id: string;
  requestCode: string;
  shipmentCode: string | null;
  status: string;
  requestedAt: string;
}

export interface PickupReviewInput {
  note?: string | null;
}

