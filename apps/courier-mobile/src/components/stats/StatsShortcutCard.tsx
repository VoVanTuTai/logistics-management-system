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
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>

      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
        {subtitle}
      </Text>

      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
        <View style={styles.arrowWrap}>
          <Ionicons name="chevron-forward" size={14} color="#64748B" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: theme.spacing.md,
    minHeight: 136,
    ...theme.shadow.card,
  },
  pressed: {
    opacity: 0.9,
    backgroundColor: '#F8FAFC',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  valueRow: {
    marginTop: 'auto',
    paddingTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  arrowWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

