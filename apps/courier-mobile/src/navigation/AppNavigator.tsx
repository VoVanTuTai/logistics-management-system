import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AppNavigatorParamList } from './types';
import { AppTabs } from './AppTabs';
import { useAuthStore } from '../features/auth/auth.store';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TaskListScreen } from '../screens/tasks/TaskListScreen';
import { DeliveryFailScreen } from '../screens/delivery/DeliveryFailScreen';
import { DeliveryProofScreen } from '../screens/delivery/DeliveryProofScreen';
import { DeliverySuccessScreen } from '../screens/delivery/DeliverySuccessScreen';
import { TaskIssueScreen } from '../screens/delivery/TaskIssueScreen';
import { HubScanScreen } from '../screens/scan/HubScanScreen';
import { PickupScanScreen } from '../screens/scan/PickupScanScreen';
import { BagSealScreen } from '../screens/scan/BagSealScreen';
import { BagUnsealScreen } from '../screens/scan/BagUnsealScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { TrackingLookupScreen } from '../screens/tasks/TrackingLookupScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator<AppNavigatorParamList>();

export function AppNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(
    (state) => state.status === 'authenticated',
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.textInverse,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={AppTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
            options={{ title: 'Chi tiết nhiệm vụ' }}
          />
          <Stack.Screen
            name="TaskList"
            component={TaskListScreen}
            options={{ title: 'Danh sách nhiệm vụ' }}
          />
          <Stack.Screen
            name="PickupScan"
            component={PickupScanScreen}
            options={{ title: 'Quét nhận' }}
          />
          <Stack.Screen
            name="HubScan"
            component={HubScanScreen}
            options={{ title: 'Quet hub' }}
          />
          <Stack.Screen
            name="BagSeal"
            component={BagSealScreen}
            options={{ title: 'Đóng bao' }}
          />
          <Stack.Screen
            name="BagUnseal"
            component={BagUnsealScreen}
            options={{ title: 'Go bao' }}
          />
          <Stack.Screen
            name="DeliverySuccess"
            component={DeliverySuccessScreen}
            options={{ title: 'Giao thành công' }}
          />
          <Stack.Screen
            name="DeliveryFail"
            component={DeliveryFailScreen}
            options={{ title: 'Giao thất bại / NDR' }}
          />
          <Stack.Screen
            name="DeliveryProof"
            component={DeliveryProofScreen}
            options={{ title: 'Ký nhận giao hàng' }}
          />
          <Stack.Screen
            name="TaskIssue"
            component={TaskIssueScreen}
         
          />
          <Stack.Screen
            name="TrackingLookup"
            component={TrackingLookupScreen}
            options={{ title: 'Theo doi don hang' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );

}

