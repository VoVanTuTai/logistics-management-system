import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { AppTabsParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CourierMapScreen } from '../screens/map/CourierMapScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<AppTabsParamList>();

function renderTabIcon(
  routeName: keyof AppTabsParamList,
  focused: boolean,
  color: string,
  size: number,
): React.JSX.Element {
  if (routeName === 'Tasks') {
    return (
      <Ionicons
        name={focused ? 'grid' : 'grid-outline'}
        size={size}
        color={color}
      />
    );
  }

  if (routeName === 'Map') {
    return (
      <Ionicons
        name={focused ? 'map' : 'map-outline'}
        size={size}
        color={color}
      />
    );
  }

  if (routeName === 'Scan') {
    return (
      <View style={styles.scanIconShell}>
        <Ionicons name="scan" size={26} color={theme.colors.textInverse} />
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

export function AppTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      initialRouteName="Tasks"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, focused, size }) =>
          renderTabIcon(route.name, focused, color, size),
      })}
    >
      <Tab.Screen
        name="Tasks"
        component={HomeScreen}
        options={{ tabBarLabel: 'Nhiệm vụ' }}
      />
      <Tab.Screen
        name="Map"
        component={CourierMapScreen}
        options={{ tabBarLabel: 'Bản đồ' }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Quét mã',
          tabBarAccessibilityLabel: 'Tab Quét mã',
          tabBarButtonTestID: 'tab-scan',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    ...theme.components.bottomTab,
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabItem: {
    paddingTop: theme.spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    ...theme.typography.tabLabel,
    fontSize: 11,
    marginTop: 2,
  },
  scanIconShell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginTop: -12,
    ...theme.shadow.md,
  },
});
