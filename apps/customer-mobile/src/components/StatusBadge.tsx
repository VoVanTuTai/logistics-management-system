import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { ShipmentStatus } from '../types';

interface StatusBadgeProps {
  status: ShipmentStatus | string;
}

export function formatStatusLabel(status: string): string {
  if (!status) return 'Chờ xử lý';
  const s = String(status).trim().toUpperCase();

  switch (s) {
    case 'CREATED':
    case 'PENDING':
    case 'REQUESTED':
      return 'Chờ lấy hàng';

    case 'PICKUP_ASSIGNED':
      return 'Đã phân công lấy';

    case 'PICKUP_COMPLETED':
    case 'PICKED_UP':
    case 'SCAN_PICKUP':
      return 'Đã lấy hàng';

    case 'IN_TRANSIT':
    case 'MANIFEST_DISPATCHED':
    case 'OUTBOUND':
      return 'Đang vận chuyển';

    case 'ARRIVED_HUB':
    case 'SCAN_INBOUND':
    case 'HUB_ARRIVED':
    case 'MANIFEST_RECEIVED':
      return 'Đã đến Hub';

    case 'READY_FOR_DELIVERY':
    case 'DELIVERY_ASSIGNED':
    case 'DELIVERY_DISPATCHED':
    case 'DELIVERING':
      return 'Đang giao hàng';

    case 'DELIVERED':
    case 'DELIVERY_SUCCESS':
      return 'Giao thành công';

    case 'DELIVERY_FAILED':
    case 'NDR_CREATED':
      return 'Giao thất bại';

    case 'RETURNED':
    case 'RETURN_COMPLETED':
    case 'RETURN_STARTED':
      return 'Chuyển hoàn';

    case 'CANCELLED':
      return 'Đã hủy';

    default:
      return status;
  }
}

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const getStyle = () => {
    const s = String(status || '').trim().toUpperCase();
    switch (s) {
      case 'DELIVERED':
      case 'DELIVERY_SUCCESS':
        return { bg: colors.successLight, text: colors.success, dot: colors.success };

      case 'READY_FOR_DELIVERY':
      case 'DELIVERY_ASSIGNED':
      case 'DELIVERY_DISPATCHED':
      case 'DELIVERING':
      case 'IN_TRANSIT':
      case 'MANIFEST_DISPATCHED':
      case 'OUTBOUND':
        return { bg: colors.infoLight, text: colors.info, dot: colors.info };

      case 'CREATED':
      case 'PENDING':
      case 'PICKUP_ASSIGNED':
      case 'PICKUP_COMPLETED':
      case 'PICKED_UP':
      case 'SCAN_PICKUP':
      case 'ARRIVED_HUB':
      case 'SCAN_INBOUND':
      case 'HUB_ARRIVED':
        return { bg: colors.warningLight, text: colors.warning, dot: colors.warning };

      case 'DELIVERY_FAILED':
      case 'NDR_CREATED':
      case 'RETURNED':
      case 'RETURN_COMPLETED':
      case 'RETURN_STARTED':
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
