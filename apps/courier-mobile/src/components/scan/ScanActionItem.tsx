import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export type ScanActionIconName = React.ComponentProps<typeof Ionicons>['name'];

export interface ScanActionItemData {
  id: string;
  label: string;
  iconName: ScanActionIconName;
  iconColor: string;
  iconBgColor: string;
}

interface ScanActionItemProps {
  action: ScanActionItemData;
  onPress?: (action: ScanActionItemData) => void;
}

export function ScanActionItem({
  action,
  onPress,
}: ScanActionItemProps): React.JSX.Element {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          onPress(action);
        }
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: action.iconBgColor }]}>
        <Ionicons name={action.iconName} size={22} color={action.iconColor} />
      </View>

      <Text numberOfLines={2} style={styles.label}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 108,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
