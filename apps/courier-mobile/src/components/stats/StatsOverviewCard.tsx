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
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  accentColor?: string;
  accentBgColor?: string;
}

function getTrendMeta(trendType: TrendType): {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bgColor: string;
} {
  if (trendType === 'up') {
    return {
      iconName: 'trending-up-outline',
      color: '#059669',
      bgColor: '#ECFDF5',
    };
  }

  if (trendType === 'down') {
    return {
      iconName: 'trending-down-outline',
      color: '#DC2626',
      bgColor: '#FEF2F2',
    };
  }

  return {
    iconName: 'remove-outline',
    color: '#475569',
    bgColor: '#F1F5F9',
  };
}

export function StatsOverviewCard({
  label,
  value,
  trendText,
  trendType = 'neutral',
  iconName,
  accentColor = theme.colors.primary,
  accentBgColor = '#EFF6FF',
}: StatsOverviewCardProps): React.JSX.Element {
  const trendMeta = getTrendMeta(trendType);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
        {iconName ? (
          <View style={[styles.iconWrap, { backgroundColor: accentBgColor }]}>
            <Ionicons name={iconName} size={15} color={accentColor} />
          </View>
        ) : null}
      </View>

      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>

      <View style={[styles.trendWrap, { backgroundColor: trendMeta.bgColor }]}>
        <Ionicons name={trendMeta.iconName} size={12} color={trendMeta.color} />
        <Text
          style={[styles.trendText, { color: trendMeta.color }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {trendText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    minHeight: 114,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    ...theme.shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: theme.colors.textPrimary,
    marginVertical: 4,
  },
  trendWrap: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
  },
});

