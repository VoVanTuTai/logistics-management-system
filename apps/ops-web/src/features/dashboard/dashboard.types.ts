export interface DashboardKpiDto {
  pendingShipments: number;
  awaitingPickupApproval: number;
  unsealedManifests: number;
  openNdrCases: number;
  todayInboundScans: number;
  todayOutboundScans: number;
}

