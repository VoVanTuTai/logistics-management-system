import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function SmartDevicesGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="SMART_DEVICES"
      title="Thiet bi thong minh"
      summary="Cum chuc nang ket noi, quan ly va van hanh thiet bi."
    />
  );
}