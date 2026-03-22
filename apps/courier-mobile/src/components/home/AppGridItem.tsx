import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export type AppGridIconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppGridItemProps {
  label: string;
  iconName: AppGridIconName;
  iconColor: string;
  iconBgColor: string;
  onPress?: () => void;
}

export function AppGridItem({
  label,
  iconName,
  iconColor,
  iconBgColor,
  onPress,
}: AppGridItemProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <Text numberOfLines={2} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '23%',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1EAF4',
  },
  label: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
