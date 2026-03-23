import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AppNavigatorParamList } from './types';
import { AppTabs } from './AppTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { PickupScanScreen } from '../screens/scan/PickupScanScreen';
import { HubScanScreen } from '../screens/scan/HubScanScreen';
import { DeliverySuccessScreen } from '../screens/delivery/DeliverySuccessScreen';
import { DeliveryFailScreen } from '../screens/delivery/DeliveryFailScreen';
import { useAuthStore } from '../features/auth/auth.store';
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
            options={{ title: 'Chi tiet nhiem vu' }}
          />
          <Stack.Screen
            name="PickupScan"
            component={PickupScanScreen}
            options={{ title: 'Quét pickup' }}
          />
          <Stack.Screen
            name="HubScan"
            component={HubScanScreen}
            options={{ title: 'Quét hub' }}
          />
          <Stack.Screen
            name="DeliverySuccess"
            component={DeliverySuccessScreen}
            options={{ title: 'Giao thanh cong' }}
          />
          <Stack.Screen
            name="DeliveryFail"
            component={DeliveryFailScreen}
            options={{ title: 'Giao that bai / NDR' }}
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
