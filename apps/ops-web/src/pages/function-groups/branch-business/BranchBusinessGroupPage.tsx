import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function BranchBusinessGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="BRANCH_BUSINESS"
      title="Kinh doanh bưu cục"
      summary="Cụm chức năng hỗ trợ vận hành và kinh doanh tại bưu cục."
    />
  );
}
