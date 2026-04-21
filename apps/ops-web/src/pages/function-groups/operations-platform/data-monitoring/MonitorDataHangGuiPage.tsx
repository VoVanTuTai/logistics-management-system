import React from 'react';

import { FunctionGroupLandingPage } from '../../shared/FunctionGroupLandingPage';

export function MonitorDataHangGuiPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="MONITOR_DATA_HANG_GUI"
      title="Giam sat hang gui"
      summary="Chuc nang con thuoc Giam sat du lieu trong cum Nen tang dieu hanh."
    />
  );
}