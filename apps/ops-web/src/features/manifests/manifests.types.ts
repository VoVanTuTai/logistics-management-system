export interface ManifestItemDto {
  id: string;
  manifestCode: string;
  status: string;
  originHubCode: string | null;
  destinationHubCode: string | null;
  sealedAt: string | null;
}

export interface CreateManifestInput {
  originHubCode: string;
  destinationHubCode: string;
  shipmentCodes: string[];
}

export interface SealManifestInput {
  sealCode: string;
}

export interface ReceiveHandoverInput {
  manifestCode: string;
  receiverName: string;
}

