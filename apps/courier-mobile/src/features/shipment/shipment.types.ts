export type ShipmentMetadata = Record<string, unknown>;

export interface ShipmentDto {
  id: string;
  code: string;
  currentStatus: string;
  metadata: ShipmentMetadata | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}
