import React from 'react';

import { FunctionGroupLandingPage } from '../../shared/FunctionGroupLandingPage';

export function ServiceQualityMonitorReceivedPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="SERVICE_QUALITY_MONITOR_RECEIVED"
      title="Giám sát đơn nhận"
      summary="Chức năng con thuộc Giám sát chủ động trong cụm Chất lượng dịch vụ."
    />
  );
}
