import React from 'react';

import { FunctionGroupLandingPage } from '../shared/FunctionGroupLandingPage';

export function DatabaseGroupPage(): React.JSX.Element {
  return (
    <FunctionGroupLandingPage
      groupCode="DATABASE"
      title="Co so du lieu"
      summary="Cum quan tri du lieu, dong bo va quan ly nguon du lieu."
    />
  );
}