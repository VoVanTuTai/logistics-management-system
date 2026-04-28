import React from 'react';

import { FunctionGroupLandingPage } from '../../shared/FunctionGroupLandingPage';

interface OperationsMetricsFeaturePlaceholderPageProps {
  groupCode: string;
  title: string;
  summary: string;
}

export function OperationsMetricsFeaturePlaceholderPage({
  groupCode,
  title,
  summary,
}: OperationsMetricsFeaturePlaceholderPageProps): React.JSX.Element {
  return <FunctionGroupLandingPage groupCode={groupCode} title={title} summary={summary} />;
}
