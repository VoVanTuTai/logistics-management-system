import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function CustomerPlatformGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="CUSTOMER_PLATFORM"
      title="Nền tảng khách hàng"
      summary="Cụm chức năng liên quan đến kênh và trải nghiệm khách hàng."
    />
  );
}
