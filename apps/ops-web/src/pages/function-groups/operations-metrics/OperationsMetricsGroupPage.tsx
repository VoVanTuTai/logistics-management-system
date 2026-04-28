import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function OperationsMetricsGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="OPERATIONS_METRICS"
      title="Chỉ số vận hành"
      summary="Cụm theo dõi KPI, báo cáo và chỉ số vận hành."
    />
  );
}
