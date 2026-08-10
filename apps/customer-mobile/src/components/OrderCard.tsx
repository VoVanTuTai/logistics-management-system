import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, shadows, spacing } from '../theme';
import type { OrderModel } from '../types';
import { StatusBadge } from './StatusBadge';

interface OrderCardProps {
  order: OrderModel;
  onPressDetail: (order: OrderModel) => void;
}

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

export function OrderCard({ order, onPressDetail }: OrderCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.codeWrapper}>
          <Ionicons name="cube-outline" size={18} color={colors.primary} />
          <Text style={styles.codeText}>{order.code}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Người nhận:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {order.receiver.name}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Địa chỉ:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {order.receiver.addressDetail}
          </Text>
        </View>

        <View style={styles.amountGrid}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Phí vận chuyển</Text>
            <Text style={styles.amountValue}>{formatVnd(order.shippingFeeVnd)}</Text>
          </View>

          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Thu hộ COD</Text>
            <Text style={styles.codValue}>{formatVnd(order.codAmountVnd)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPressDetail(order)}
          style={styles.detailBtn}
        >
          <Text style={styles.detailBtnText}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    width: 85,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  amountGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  codValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
});
