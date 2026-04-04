export type AppTabsParamList = {
  Tasks: {
    initialTaskType?: 'PICKUP' | 'DELIVERY' | 'RETURN' | 'ALL';
    initialStatus?: 'ALL' | 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  } | undefined;
  Stats: undefined;
  Scan: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type AppNavigatorParamList = {
  Login: undefined;
  MainTabs: {
    screen?: keyof AppTabsParamList;
    params?: AppTabsParamList[keyof AppTabsParamList];
  } | undefined;
  TaskList:
    | {
        initialTaskType?: 'PICKUP' | 'DELIVERY' | 'RETURN' | 'ALL';
        initialStatus?: 'ALL' | 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
      }
    | undefined;
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
  BagSeal: undefined;
  DeliverySuccess: {
    taskId?: string;
    shipmentCode?: string;
  };
  DeliveryFail: {
    taskId?: string;
    shipmentCode?: string;
  };
  DeliveryProof: {
    taskId?: string;
    taskCode?: string;
    shipmentCode?: string;
  };
  TaskIssue: {
    taskId?: string;
    taskCode?: string;
    shipmentCode?: string;
  };
};
