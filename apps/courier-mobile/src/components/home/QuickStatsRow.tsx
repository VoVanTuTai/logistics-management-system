import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

interface QuickStatsRowProps {
  waitingPickup: number;
  waitingDelivery: number;
  activeStat?: 'PICKUP' | 'DELIVERY' | null;
  onPressWaitingPickup?: () => void;
  onPressWaitingDelivery?: () => void;
}

interface StatCardProps {
  label: string;
  value: number;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconBgColor: string;
  iconColor: string;
  active?: boolean;
  onPress?: () => void;
}

function StatCard({
  label,
  value,
  iconName,
  iconBgColor,
  iconColor,
  active = false,
  onPress,
}: StatCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        active && styles.cardActive,
        pressed && onPress && styles.cardPressed,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export function QuickStatsRow({
  waitingPickup,
  waitingDelivery,
  activeStat = null,
  onPressWaitingPickup,
  onPressWaitingDelivery,
}: QuickStatsRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <StatCard
        label="Đợi lấy"
        value={waitingPickup}
        iconName="cube-outline"
        iconBgColor="#E4F0FF"
        iconColor="#1D4ED8"
        active={activeStat === 'PICKUP'}
        onPress={onPressWaitingPickup}
      />
      <StatCard
        label="Đợi phát"
        value={waitingDelivery}
        iconName="paper-plane-outline"
        iconBgColor="#EFF6FF"
        iconColor="#1D4ED8"
        active={activeStat === 'DELIVERY'}
        onPress={onPressWaitingDelivery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  cardActive: {
    borderColor: theme.colors.primary,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...theme.typography.title.sm,
    color: theme.colors.primary,
  },
  label: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
});

