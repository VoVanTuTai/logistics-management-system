import React from 'react';

import { FunctionGroupLandingPage } from '../../shared/FunctionGroupLandingPage';

interface BranchBusinessFeaturePlaceholderPageProps {
  groupCode: string;
  title: string;
  summary: string;
}

export function BranchBusinessFeaturePlaceholderPage({
  groupCode,
  title,
  summary,
}: BranchBusinessFeaturePlaceholderPageProps): React.JSX.Element {
  return <FunctionGroupLandingPage groupCode={groupCode} title={title} summary={summary} />;
}
