export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TaskDetail: { taskId: string };
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

export type MainTabParamList = {
  Tasks: undefined;
  Profile: undefined;
};
