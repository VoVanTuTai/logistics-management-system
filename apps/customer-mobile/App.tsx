import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
