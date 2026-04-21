import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function CustomerPlatformGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="CUSTOMER_PLATFORM"
      title="Nen tang khach hang"
      summary="Cum chuc nang lien quan den kenh va trai nghiem khach hang."
    />
  );
}