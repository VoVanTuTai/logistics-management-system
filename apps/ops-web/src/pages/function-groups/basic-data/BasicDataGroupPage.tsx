import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function BasicDataGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="BASIC_DATA"
      title="Du lieu co ban"
      summary="Cum danh muc du lieu goc, cau hinh chung va thong tin nen."
    />
  );
}