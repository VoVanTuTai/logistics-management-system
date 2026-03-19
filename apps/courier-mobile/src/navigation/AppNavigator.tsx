import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AppNavigatorParamList } from './types';
import { AppTabs } from './AppTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
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
        <Stack.Screen
          name="MainTabs"
          component={AppTabs}
          options={{ headerShown: false }}
        />
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
