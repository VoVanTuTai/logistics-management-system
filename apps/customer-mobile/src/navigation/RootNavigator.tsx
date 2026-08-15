import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { CreateOrderScreen } from '../screens/create-order/CreateOrderScreen';
import { CreateOrderSuccessScreen } from '../screens/create-order/CreateOrderSuccessScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { PriceCalculatorScreen } from '../screens/price-calculator/PriceCalculatorScreen';
import { AccountDetailScreen } from '../screens/profile/AccountDetailScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
      <Stack.Screen name="CreateOrderSuccess" component={CreateOrderSuccessScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="PriceCalculator" component={PriceCalculatorScreen} />
      <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
    </Stack.Navigator>
  );
}
