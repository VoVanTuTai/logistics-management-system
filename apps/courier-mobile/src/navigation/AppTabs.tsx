import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { AppTabsParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { StatsScreen } from '../screens/stats/StatsScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { ChatPlaceholderScreen } from '../screens/chat/ChatPlaceholderScreen';
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
      <View style={styles.scanIconShell}>
        <Ionicons name="scan" size={24} color={theme.colors.textInverse} />
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#8EA1BA',
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
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: 'Thống kê' }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ tabBarLabel: 'Quét mã' }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatPlaceholderScreen}
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
  },
  tabItem: {
    paddingTop: theme.spacing.xxs,
  },
  tabLabel: {
    ...theme.typography.tabLabel,
  },
  scanIconShell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginTop: -8,
    ...theme.shadow.md,
  },
});
