import React from 'react';

import { UserManagementPage } from './UserManagementPage';

export function OpsUsersPage(): React.JSX.Element {
  return <UserManagementPage roleGroup="OPS" />;
}
