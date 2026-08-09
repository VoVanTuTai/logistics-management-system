export interface ShipmentStatusSummaryItemDto {
  status: string;
  count: number;
}

export interface KpiDailyDto {
  id?: string;
  date: string;
  dimensionType?: string;
  dimensionValue?: string;
  hubCode?: string | null;
  courierCode?: string | null;
  zoneCode?: string | null;
  shipmentsCreated: number;
  pickupsCompleted: number;
  deliveriesDelivered: number;
  deliveriesFailed: number;
  ndrCreated: number;
  scansInbound: number;
  scansOutbound: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OpsDashboardViewDto {
  metricDate: string;
  totals: {
    shipmentsCreated?: number;
    pickupsCompleted?: number;
    deliveriesDelivered?: number;
    deliveriesFailed?: number;
    ndrCreated?: number;
    scansInbound?: number;
    scansOutbound?: number;
    successRate?: number;
    failureRate?: number;
    deliveryAttempts?: number;
    [key: string]: number | string | null | undefined;
  };
  shipmentStatusSummary: ShipmentStatusSummaryItemDto[];
  courierAggregates: KpiDailyDto[];
  hubAggregates: KpiDailyDto[];
  zoneAggregates: KpiDailyDto[];
  sourceType: string;
}

export interface AdminShipmentDto {
  id: string;
  shipmentCode: string;
  currentStatus: string;
  codAmount?: number | string | null;
  shippingFee?: number | string | null;
  originHubCode?: string | null;
  destinationHubCode?: string | null;
  receiverHubCode?: string | null;
  senderHubCode?: string | null;
  currentLocation?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNdrCaseDto {
  id: string;
  shipmentCode: string;
  reasonCode?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardReportFilters {
  date?: string;
  hubCode?: string;
  courierCode?: string;
  zoneCode?: string;
}
