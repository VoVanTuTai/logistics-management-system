import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function DatabaseGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="DATABASE"
      title="Cơ sở dữ liệu"
      summary="Cụm quản trị dữ liệu, đồng bộ và quản lý nguồn dữ liệu."
    />
  );
}
