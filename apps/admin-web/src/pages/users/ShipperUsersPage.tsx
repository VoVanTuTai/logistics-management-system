import React from 'react';

import { UserManagementPage } from './UserManagementPage';

export function ShipperUsersPage(): React.JSX.Element {
  return <UserManagementPage roleGroup="SHIPPER" />;
}
