export type AppTabsParamList = {
  Tasks: undefined;
  Stats: undefined;
  Scan: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type AppNavigatorParamList = {
  Login: undefined;
  MainTabs: undefined;
  PickupScan: {
    taskId?: string;
    shipmentCode?: string;
  };
  HubScan: {
    mode: 'INBOUND' | 'OUTBOUND';
    taskId?: string;
    shipmentCode?: string;
  };
};
