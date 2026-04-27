import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function FinanceSettlementGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="FINANCE_SETTLEMENT"
      title="Quyết toán tài chính"
      summary="Cụm đối soát, quyết toán và nghiệp vụ tài chính vận hành."
    />
  );
}
