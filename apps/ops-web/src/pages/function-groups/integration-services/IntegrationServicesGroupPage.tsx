import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function IntegrationServicesGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="INTEGRATION_SERVICES"
      title="Dịch vụ tích hợp"
      summary="Cụm kết nối dịch vụ, đồng bộ dữ liệu và tích hợp hệ thống."
    />
  );
}
