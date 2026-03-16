export interface DashboardFilters {
  date?: string;
  hubCode?: string;
  zoneCode?: string;
  courierId?: string;
}

export type DashboardKpiDto = Record<string, string | number | null>;

export interface DashboardMetricPointDto {
  label: string;
  value: number;
}
