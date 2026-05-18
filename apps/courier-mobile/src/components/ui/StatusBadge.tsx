import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';

type StatusVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
}

const variantStyles: Record<StatusVariant, { backgroundColor: string; color: string }> = {
  neutral: {
    backgroundColor: '#EEF2F8',
    color: theme.colors.textSecondary,
  },
  success: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  warning: {
    backgroundColor: '#FFEDD5',
    color: '#9A3412',
  },
  danger: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  info: {
    backgroundColor: '#EFF6FF',
    color: '#1E3A8A',
  },
};

export function StatusBadge({
  label,
  variant = 'neutral',
}: StatusBadgeProps): React.JSX.Element {
  const visual = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: visual.backgroundColor }]}>
      <Text style={[styles.text, { color: visual.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

