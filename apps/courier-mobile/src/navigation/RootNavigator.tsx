import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { StatsScreen } from '../screens/stats/StatsScreen';
import { ScanHomeScreen } from '../screens/scan/ScanHomeScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { theme } from '../theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function resolveTabIcon(
  routeName: keyof MainTabParamList,
  focused: boolean,
  color: string,
  size: number,
): React.JSX.Element {
  if (routeName === 'Tasks') {
    return (
      <Ionicons
        name={focused ? 'list-circle' : 'list-circle-outline'}
        size={size}
        color={color}
      />
    );
  }

  if (routeName === 'Stats') {
    return (
      <Ionicons
        name={focused ? 'stats-chart' : 'stats-chart-outline'}
        size={size}
        color={color}
      />
    );
  }

  if (routeName === 'Scan') {
    return (
      <View style={styles.scanTabIconShell}>
        <Ionicons name="scan" size={24} color="#FFFFFF" />
      </View>
    );
  }

  if (routeName === 'Chat') {
    return (
      <Ionicons
        name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
        size={size}
        color={color}
      />
    );
  }

  return (
    <Ionicons
      name={focused ? 'person-circle' : 'person-circle-outline'}
      size={size}
      color={color}
    />
  );
}

function MainTabs(): React.JSX.Element {
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#8DA0B7',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, focused, size }) =>
          resolveTabIcon(route.name, focused, color, size),
      })}
    >
      <MainTab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{
          tabBarLabel: 'Nhiệm vụ',
        }}
      />
      <MainTab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Thống kê',
        }}
      />
      <MainTab.Screen
        name="Scan"
        component={ScanHomeScreen}
        options={{
          tabBarLabel: 'Quét mã',
        }}
      />
      <MainTab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarBadge: offlinePendingCount > 0 ? offlinePendingCount : undefined,
          tabBarBadgeStyle: styles.badge,
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
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
        },
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
            options={{ title: 'Chi tiet nhiem vu' }}
          />
          <RootStack.Screen
            name="PickupScan"
            component={PickupScanScreen}
            options={{ title: 'Quét pickup' }}
          />
          <RootStack.Screen
            name="HubScan"
            component={HubScanScreen}
            options={{ title: 'Quét hub' }}
          />
          <RootStack.Screen
            name="DeliverySuccess"
            component={DeliverySuccessScreen}
            options={{ title: 'Giao thanh cong' }}
          />
          <RootStack.Screen
            name="DeliveryFail"
            component={DeliveryFailScreen}
            options={{ title: 'Giao that bai / NDR' }}
          />
        </>
      ) : (
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    height: 74,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  scanTabIconShell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginTop: -6,
  },
  badge: {
    backgroundColor: theme.colors.warning,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});


