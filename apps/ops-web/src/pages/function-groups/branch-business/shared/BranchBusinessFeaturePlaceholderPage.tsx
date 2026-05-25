import React from 'react';
import { Navigate } from 'react-router-dom';

import { routePaths } from '../../../../navigation/routes';

interface BranchBusinessFeaturePlaceholderPageProps {
  groupCode: string;
  title: string;
  summary: string;
}

export function BranchBusinessFeaturePlaceholderPage(
  _props: BranchBusinessFeaturePlaceholderPageProps,
): React.JSX.Element {
  return <Navigate to={routePaths.branchBusinessLocalOverview} replace />;
}
