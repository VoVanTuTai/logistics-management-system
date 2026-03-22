export interface TrackingIndex {
  id: string;
  shipmentCode: string;
  latestEventType: string | null;
  latestEventAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
