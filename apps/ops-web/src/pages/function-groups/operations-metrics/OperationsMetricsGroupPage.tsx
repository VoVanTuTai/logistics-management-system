import React from 'react';
import { Navigate } from 'react-router-dom';

import { routePaths } from '../../../navigation/routes';

export function OperationsMetricsGroupPage(): React.JSX.Element {
  return <Navigate to={routePaths.opsMetricsReport} replace />;
}
