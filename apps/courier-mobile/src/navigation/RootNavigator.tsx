import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type {
  MainTabParamList,
  RootStackParamList,
} from './navigation.types';
import { useAppStore } from '../store/appStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TaskListScreen } from '../screens/tasks/TaskListScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { PickupScanScreen } from '../screens/scan/PickupScanScreen';
import { HubScanScreen } from '../screens/scan/HubScanScreen';
import { DeliverySuccessScreen } from '../screens/delivery/DeliverySuccessScreen';
import { DeliveryFailScreen } from '../screens/delivery/DeliveryFailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): React.JSX.Element {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f172a',
      }}
    >
      <MainTab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color }}>Tasks</Text>,
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color }}>Profile</Text>,
        }}
      />
    </MainTab.Navigator>
  );
}

export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAppStore(
    (state) => state.authStatus === 'authenticated',
  );

  return (
    <RootStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      {isAuthenticated ? (
        <>
          <RootStack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
            options={{ title: 'Task detail' }}
          />
          <RootStack.Screen
            name="PickupScan"
            component={PickupScanScreen}
            options={{ title: 'Pickup scan' }}
          />
          <RootStack.Screen
            name="HubScan"
            component={HubScanScreen}
            options={{ title: 'Hub scan' }}
          />
          <RootStack.Screen
            name="DeliverySuccess"
            component={DeliverySuccessScreen}
            options={{ title: 'Delivery success' }}
          />
          <RootStack.Screen
            name="DeliveryFail"
            component={DeliveryFailScreen}
            options={{ title: 'Delivery fail / NDR' }}
          />
        </>
      ) : (
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Courier login' }}
        />
      )}
    </RootStack.Navigator>
  );
}
