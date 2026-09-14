import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

interface OverdueCardProps {
  /** Số đơn đã quá hạn SLA */
  overdueCount: number;
  /** Số đơn sắp quá hạn SLA (≤ 2 giờ) */
  nearOverdueCount: number;
  /** Chạm vào thẻ để mở OverdueAlertScreen */
  onPress?: () => void;
}

export function OverdueCard({
  overdueCount,
  nearOverdueCount,
  onPress,
}: OverdueCardProps): React.JSX.Element {
  const hasOverdue = overdueCount > 0;
  const hasAlerts = overdueCount > 0 || nearOverdueCount > 0;

  // Chọn giao diện theo trạng thái
  const containerStyle = hasOverdue
    ? styles.containerDanger
    : hasAlerts
      ? styles.containerWarning
      : styles.containerSafe;

  const iconBgStyle = hasOverdue
    ? styles.iconBgDanger
    : hasAlerts
      ? styles.iconBgWarning
      : styles.iconBgSafe;

  const iconName = hasOverdue
    ? 'alert-circle'
    : hasAlerts
      ? 'time'
      : 'checkmark-circle';

  const iconColor = hasOverdue ? '#DC2626' : hasAlerts ? '#D97706' : '#15803D';
  const titleColor = hasOverdue ? '#991B1B' : hasAlerts ? '#92400E' : '#166534';
  const subtitleColor = hasOverdue ? '#B91C1C' : hasAlerts ? '#A16207' : '#15803D';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, containerStyle, pressed && styles.pressed]}
    >
      <View style={styles.leftBlock}>
        <View style={[styles.iconWrap, iconBgStyle]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        <View style={styles.textWrap}>
          {hasAlerts ? (
            <>
              <Text style={[styles.title, { color: titleColor }]}>
                {hasOverdue
                  ? `🚨 ${overdueCount} đơn ĐÃ QUÁ HẠN`
                  : `⏰ ${nearOverdueCount} đơn sắp quá hạn`}
              </Text>
              <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
                {hasOverdue && nearOverdueCount > 0
                  ? `& ${nearOverdueCount} đơn sắp đến giờ hẹn lấy. Chạm để xem chi tiết.`
                  : 'Chạm để xem chi tiết và xử lý nhanh.'}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: titleColor }]}>
                🟢 Đơn thu gom trong hạn SLA
              </Text>
              <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
                100% đơn pickup đang đúng cam kết thời gian.
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.rightBlock}>
        {hasAlerts ? (
          <View style={styles.countBadge}>
            <Text style={[styles.countText, { color: iconColor }]}>
              {overdueCount + nearOverdueCount}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={iconColor} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  containerDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  containerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  containerSafe: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pressed: {
    opacity: 0.88,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgDanger: {
    backgroundColor: '#FEE2E2',
  },
  iconBgWarning: {
    backgroundColor: '#FEF3C7',
  },
  iconBgSafe: {
    backgroundColor: '#DCFCE7',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...theme.typography.subtitle.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.caption.md,
    marginTop: 2,
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countBadge: {
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    ...theme.typography.title.sm,
    fontWeight: '800',
  },
});
