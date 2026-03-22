import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/common/EmptyState';
import { theme } from '../../theme';

export function ChatPlaceholderScreen(): React.JSX.Element {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>Kênh trao đổi nội bộ cho courier</Text>
        </View>

        <EmptyState
          iconName="chatbubble-ellipses-outline"
          title="Chat vận hành"
          description="Tính năng chat đang được hoàn thiện. Bạn có thể xem placeholder để sắp xếp giao diện trước khi kết nối backend."
          primaryLabel="Xem hội thoại"
          secondaryLabel="Sắp ra mắt"
          onPressPrimary={() => {
            Alert.alert('Chat', 'Placeholder hội thoại.');
          }}
          onPressSecondary={() => {
            Alert.alert('Chat', 'Tính năng sắp ra mắt.');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerBlock: {
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title.md,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
