import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function BranchBusinessGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="BRANCH_BUSINESS"
      title="Kinh doanh buu cuc"
      summary="Cum chuc nang ho tro van hanh va kinh doanh tai buu cuc."
    />
  );
}