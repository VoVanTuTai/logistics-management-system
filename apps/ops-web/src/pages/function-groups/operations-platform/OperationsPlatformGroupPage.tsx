import React from 'react';
import { Navigate } from 'react-router-dom';

import { routePaths } from '../../../navigation/routes';

export function OperationsPlatformGroupPage(): React.JSX.Element {
  return <Navigate to={routePaths.shipments} replace />;
}
