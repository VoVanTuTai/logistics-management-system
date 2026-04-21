import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function ServiceQualityGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="SERVICE_QUALITY"
      title="Chat luong dich vu"
      summary="Cum chuc nang giam sat chat luong va xu ly van de dich vu."
    />
  );
}