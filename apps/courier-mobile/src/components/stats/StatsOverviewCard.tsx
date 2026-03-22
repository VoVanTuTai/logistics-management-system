import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

type TrendType = 'up' | 'down' | 'neutral';

interface StatsOverviewCardProps {
  label: string;
  value: string;
  trendText: string;
  trendType?: TrendType;
}

function getTrendMeta(trendType: TrendType): {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bgColor: string;
} {
  if (trendType === 'up') {
    return {
      iconName: 'trending-up-outline',
      color: '#166534',
      bgColor: '#DCFCE7',
    };
  }

  if (trendType === 'down') {
    return {
      iconName: 'trending-down-outline',
      color: '#B42323',
      bgColor: '#FEE2E2',
    };
  }

  return {
    iconName: 'remove-outline',
    color: '#334155',
    bgColor: '#E2E8F0',
  };
}

export function StatsOverviewCard({
  label,
  value,
  trendText,
  trendType = 'neutral',
}: StatsOverviewCardProps): React.JSX.Element {
  const trendMeta = getTrendMeta(trendType);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>

      <View style={[styles.trendWrap, { backgroundColor: trendMeta.bgColor }]}>
        <Ionicons name={trendMeta.iconName} size={14} color={trendMeta.color} />
        <Text style={[styles.trendText, { color: trendMeta.color }]}>{trendText}</Text>
      </View>
    </View>
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
    ...theme.shadow.card,
  },
  label: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  value: {
    ...theme.typography.title.md,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  trendWrap: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    ...theme.typography.caption.sm,
    fontWeight: '700',
  },
});
