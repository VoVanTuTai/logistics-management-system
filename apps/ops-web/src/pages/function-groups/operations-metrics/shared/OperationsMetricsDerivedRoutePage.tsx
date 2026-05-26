import React from 'react';

import {
  OpsMetricsDerivedDashboardPage,
  type OpsMetricsDashboardKind,
} from './OpsMetricsDerivedDashboardPage';

interface OperationsMetricsDerivedRoutePageProps {
  groupCode: string;
  title: string;
  summary: string;
}

export function OperationsMetricsDerivedRoutePage({
  groupCode,
  title,
  summary,
}: OperationsMetricsDerivedRoutePageProps): React.JSX.Element {
  const dashboardKinds: Record<string, OpsMetricsDashboardKind> = {
    OPS_METRICS_ABNORMAL_OVERVIEW: 'abnormal-overview',
    OPS_METRICS_ABNORMAL_HANDLING: 'abnormal-handling',
    OPS_METRICS_DEADLINE_PICKUP_RATIO: 'pickup-ratio',
    OPS_METRICS_DEADLINE_DELIVERY_SLA: 'delivery-sla',
    OPS_METRICS_DEADLINE_SIGN_T1: 'sign-t1',
    OPS_METRICS_DEADLINE_SEND_RATIO: 'send-ratio',
    OPS_METRICS_DEADLINE_DELIVERY_LEADTIME: 'delivery-leadtime',
    OPS_METRICS_DEADLINE_INBOUND_LEADTIME: 'inbound-leadtime',
    OPS_METRICS_DEADLINE_OVERDUE_ALERTS: 'overdue-alerts',
    OPS_METRICS_PLANNING_NETWORK_KPI: 'network-kpi',
    OPS_METRICS_ACTION_EXECUTION_BOARD: 'action-board',
  };

  return (
    <OpsMetricsDerivedDashboardPage
      kind={dashboardKinds[groupCode] ?? 'action-board'}
      groupCode={groupCode}
      title={title}
      summary={summary}
    />
  );
}
