import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
}: ScreenProps): React.JSX.Element {
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
});
