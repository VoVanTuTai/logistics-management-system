import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function SmartDevicesGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="SMART_DEVICES"
      title="Thiết bị thông minh"
      summary="Cụm chức năng kết nối, quản lý và vận hành thiết bị."
    />
  );
}
