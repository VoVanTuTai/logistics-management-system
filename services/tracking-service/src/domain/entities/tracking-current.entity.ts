export interface TrackingCurrent {
  id: string;
  shipmentCode: string;
  currentStatus: string | null;
  currentLocationCode: string | null;
  lastEventId: string | null;
  lastEventType: string | null;
  lastEventAt: Date | null;
  viewPayload: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
