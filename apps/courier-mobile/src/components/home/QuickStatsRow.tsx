import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

interface QuickStatsRowProps {
  waitingPickup: number;
  waitingDelivery: number;
}

interface StatCardProps {
  label: string;
  value: number;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconBgColor: string;
  iconColor: string;
}

function StatCard({
  label,
  value,
  iconName,
  iconBgColor,
  iconColor,
}: StatCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function QuickStatsRow({
  waitingPickup,
  waitingDelivery,
}: QuickStatsRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <StatCard
        label="Đợi lấy"
        value={waitingPickup}
        iconName="cube-outline"
        iconBgColor="#E4F0FF"
        iconColor="#24539E"
      />
      <StatCard
        label="Đợi phát"
        value={waitingDelivery}
        iconName="paper-plane-outline"
        iconBgColor="#E1F8FA"
        iconColor="#0A6E89"
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
