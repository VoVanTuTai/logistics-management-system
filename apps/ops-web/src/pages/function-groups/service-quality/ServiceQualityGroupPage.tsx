import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function ServiceQualityGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="SERVICE_QUALITY"
      title="Chất lượng dịch vụ"
      summary="Cụm chức năng giám sát chất lượng và xử lý vấn đề dịch vụ. Chọn mục chức năng con ở sidebar bên trái để tiếp tục."
    />
  );
}
