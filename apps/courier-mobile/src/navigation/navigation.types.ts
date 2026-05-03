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
  BagSeal: undefined;
  InventoryCheck: undefined;
  VehicleOutbound: undefined;
  VehicleInbound: undefined;
  DeliverySuccess: {
    taskId?: string;
    shipmentCode?: string;
  };
  DeliveryFail: {
    taskId?: string;
    shipmentCode?: string;
  };
  CodStats: undefined;
  CodCollect: {
    shipmentCode?: string;
    codAmount?: number;
  };
};

export type MainTabParamList = {
  Tasks: undefined;
  Stats: undefined;
  Scan: undefined;
  Chat: undefined;
  Profile: undefined;
};
