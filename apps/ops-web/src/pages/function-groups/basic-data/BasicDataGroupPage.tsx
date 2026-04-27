import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function BasicDataGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="BASIC_DATA"
      title="Dữ liệu cơ bản"
      summary="Cụm danh mục dữ liệu gốc, cấu hình chung và thông tin nền."
    />
  );
}
