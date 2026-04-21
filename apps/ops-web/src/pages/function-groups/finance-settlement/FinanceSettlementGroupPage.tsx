import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function FinanceSettlementGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="FINANCE_SETTLEMENT"
      title="Quyet toan tai chinh"
      summary="Cum doi soat, quyet toan va nghiep vu tai chinh van hanh."
    />
  );
}