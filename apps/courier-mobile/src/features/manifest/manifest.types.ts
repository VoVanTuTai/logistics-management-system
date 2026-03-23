export interface BagManifestItemDto {
  shipmentCode: string;
}

export interface BagManifestDto {
  id: string;
  manifestCode: string;
  status: string;
  originHubCode: string | null;
  destinationHubCode: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: BagManifestItemDto[];
}

export interface AddBagShipmentsPayload {
  shipmentCodes: string[];
  note?: string | null;
}

