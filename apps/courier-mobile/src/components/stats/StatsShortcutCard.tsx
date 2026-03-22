import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface StatsShortcutCardProps {
  title: string;
  subtitle: string;
  value: string;
  iconName: IconName;
  iconColor: string;
  iconBgColor: string;
  onPress?: () => void;
}

export function StatsShortcutCard({
  title,
  subtitle,
  value,
  iconName,
  iconColor,
  iconBgColor,
  onPress,
}: StatsShortcutCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color="#64748B" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    minHeight: 138,
    ...theme.shadow.card,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  valueRow: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    ...theme.typography.subtitle.md,
    color: theme.colors.primary,
  },
});
