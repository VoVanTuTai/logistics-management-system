export interface ManifestListItemDto {
  id: string;
  manifestCode: string;
  status: string;
  originHubCode: string | null;
  destinationHubCode: string | null;
  sealedAt: string | null;
  createdAt?: string | null;
}

export interface ManifestDetailDto {
  id: string;
  manifestCode: string;
  status: string;
  originHubCode: string | null;
  destinationHubCode: string | null;
  sealedAt: string | null;
  updatedAt?: string | null;
  shipmentCodes?: string[] | null;
  note?: string | null;
}

export interface CreateManifestInput {
  manifestCode: string;
  originHubCode: string;
  destinationHubCode: string;
  shipmentCodes: string[];
}

export interface GenerateBagCodesInput {
  originHubCode?: string | null;
  destinationHubCode: string;
  quantity: number;
  note?: string | null;
}

export interface AddShipmentInput {
  shipmentCode: string;
  note?: string | null;
}

export interface RemoveShipmentInput {
  shipmentCode: string;
  note?: string | null;
}

export interface SealManifestInput {
  sealCode: string;
  note?: string | null;
}

export interface ReceiveHandoverInput {
  manifestCode: string;
  receiverName: string;
  note?: string | null;
}

export type ManifestActionResultDto = Record<string, unknown>;
