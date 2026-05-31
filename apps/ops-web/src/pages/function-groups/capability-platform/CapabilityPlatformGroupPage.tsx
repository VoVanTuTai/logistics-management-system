import React from 'react';
import { Navigate } from 'react-router-dom';

import { routePaths } from '../../../navigation/routes';

export function CapabilityPlatformGroupPage(): React.JSX.Element {
  return <Navigate to={routePaths.linehaulTripManagement} replace />;
}
