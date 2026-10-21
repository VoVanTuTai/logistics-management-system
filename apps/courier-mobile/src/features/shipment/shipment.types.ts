export type ShipmentMetadata = Record<string, unknown>;

export interface ShipmentDto {
  id: string;
  code: string;
  currentStatus: string;
  createdByType?: string | null;
  metadata: ShipmentMetadata | null;
  codAmount: number | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}
