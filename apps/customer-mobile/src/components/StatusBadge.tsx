import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { ShipmentStatus } from '../types';

interface StatusBadgeProps {
  status: ShipmentStatus;
}

export function formatStatusLabel(status: ShipmentStatus): string {
  switch (status) {
    case 'CREATED':
      return 'Chờ lấy hàng';
    case 'PICKUP_COMPLETED':
      return 'Đã lấy hàng';
    case 'IN_TRANSIT':
      return 'Đang vận chuyển';
    case 'ARRIVED_HUB':
      return 'Đã đến Hub';
    case 'READY_FOR_DELIVERY':
      return 'Đang giao';
    case 'DELIVERED':
      return 'Giao thành công';
    case 'DELIVERY_FAILED':
      return 'Giao thất bại';
    case 'RETURNED':
      return 'Chuyển hoàn';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
}

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const getStyle = () => {
    switch (status) {
      case 'DELIVERED':
        return { bg: colors.successLight, text: colors.success, dot: colors.success };
      case 'READY_FOR_DELIVERY':
      case 'IN_TRANSIT':
        return { bg: colors.infoLight, text: colors.info, dot: colors.info };
      case 'CREATED':
      case 'PICKUP_COMPLETED':
      case 'ARRIVED_HUB':
        return { bg: colors.warningLight, text: colors.warning, dot: colors.warning };
      case 'DELIVERY_FAILED':
      case 'RETURNED':
      case 'CANCELLED':
        return { bg: colors.dangerLight, text: colors.danger, dot: colors.danger };
      default:
        return { bg: colors.background, text: colors.textSecondary, dot: colors.textMuted };
    }
  };

  const style = getStyle();

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <View style={[styles.dot, { backgroundColor: style.dot }]} />
      <Text style={[styles.label, { color: style.text }]}>
        {formatStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
