import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function OperationsMetricsGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="OPERATIONS_METRICS"
      title="Chi so van hanh"
      summary="Cum theo doi KPI, bao cao va chi so van hanh."
    />
  );
}