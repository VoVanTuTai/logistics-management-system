export type ManifestStatus = 'CREATED' | 'SEALED' | 'RECEIVED';

export interface Manifest {
  id: string;
  manifestCode: string;
  status: ManifestStatus;
  originHubCode: string | null;
  destinationHubCode: string | null;
  note: string | null;
  sealedAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: ManifestItem[];
  sealRecord: SealRecord | null;
  receiveRecord: ReceiveRecord | null;
}

export interface ManifestItem {
  id: string;
  manifestId: string;
  shipmentCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SealRecord {
  id: string;
  manifestId: string;
  sealedBy: string | null;
  note: string | null;
  sealedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiveRecord {
  id: string;
  manifestId: string;
  receivedBy: string | null;
  note: string | null;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateManifestInput {
  manifestCode: string;
  originHubCode?: string | null;
  destinationHubCode?: string | null;
  note?: string | null;
  shipmentCodes?: string[];
}

export interface UpdateManifestInput {
  originHubCode?: string | null;
  destinationHubCode?: string | null;
  note?: string | null;
  addShipmentCodes?: string[];
  removeShipmentCodes?: string[];
}

export interface AddShipmentsInput {
  shipmentCodes: string[];
  note?: string | null;
}

export interface RemoveShipmentsInput {
  shipmentCodes: string[];
  note?: string | null;
}

export interface SealManifestInput {
  sealedBy?: string | null;
  note?: string | null;
}

export interface ReceiveManifestInput {
  receivedBy?: string | null;
  note?: string | null;
}
