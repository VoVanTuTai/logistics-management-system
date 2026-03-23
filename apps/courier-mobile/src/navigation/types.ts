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
  TaskDetail: {
    taskId: string;
  };
  PickupScan: {
    taskId?: string;
    shipmentCode?: string;
  };
  HubScan: {
    mode: 'INBOUND' | 'OUTBOUND';
    taskId?: string;
    shipmentCode?: string;
  };
  DeliverySuccess: {
    taskId?: string;
    shipmentCode?: string;
  };
  DeliveryFail: {
    taskId?: string;
    shipmentCode?: string;
  };
};
