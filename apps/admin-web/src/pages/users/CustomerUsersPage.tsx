import React from 'react';

import { UserManagementPage } from './UserManagementPage';

export function CustomerUsersPage(): React.JSX.Element {
  return <UserManagementPage roleGroup="CUSTOMER" />;
}
