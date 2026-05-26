import React from 'react';
import { Navigate } from 'react-router-dom';

import { routePaths } from '../../../navigation/routes';

export function BranchBusinessGroupPage(): React.JSX.Element {
  return <Navigate to={routePaths.branchBusinessLocalOverview} replace />;
}
