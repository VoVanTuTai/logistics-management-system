import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, shadows, spacing } from '../theme';
import type { OrderModel } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { StatusBadge } from './StatusBadge';

import { printOrShareShippingLabel } from '../services/shippingLabelPrinter';

interface OrderCardProps {
  order: OrderModel;
  onPressDetail: (order: OrderModel) => void;
}

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

export function OrderCard({ order, onPressDetail }: OrderCardProps): React.JSX.Element {
  const senderAddressText =
    order.sender.composedAddress || order.sender.addressDetail || 'Chưa có địa chỉ gửi';
  const receiverAddressText =
    order.receiver.composedAddress || order.receiver.addressDetail || 'Chưa có địa chỉ nhận';

  const handlePrint = async () => {
    try {
      await printOrShareShippingLabel(order as any);
    } catch {
      // Ignore print cancel
    }
  };

  return (
    <View style={styles.card}>
      {/* CARD HEADER WITH COPY CODE BUTTON */}
      <View style={styles.cardHeader}>
        <View style={styles.codeWrapper}>
          <Ionicons name="cube" size={18} color={colors.primary} />
          <Text style={styles.codeText}>{order.code}</Text>

          {/* COPY ORDER CODE BUTTON */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.copyBtn}
            onPress={() => copyToClipboard(order.code, 'mã vận đơn')}
          >
            <Ionicons name="copy-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <StatusBadge status={order.status} />
      </View>

      <View style={styles.divider} />

      {/* CARD BODY WITH FULL SENDER & RECEIVER ADDRESSES */}
      <View style={styles.cardBody}>
        {/* SENDER BLOCK */}
        <View style={styles.locationBlock}>
          <View style={styles.locationHeaderRow}>
            <View style={[styles.dotCircle, { backgroundColor: colors.info }]} />
            <Text style={styles.locationRoleLabel}>GỬI TỪ:</Text>
            <Text style={styles.personNameText} numberOfLines={1}>
              {order.sender.name} ({order.sender.phone || 'SĐT N/A'})
            </Text>
          </View>
          <Text style={styles.fullAddressText} numberOfLines={2}>
            {senderAddressText}
          </Text>
        </View>

        <View style={styles.routeLineDot} />

        {/* RECEIVER BLOCK */}
        <View style={styles.locationBlock}>
          <View style={styles.locationHeaderRow}>
            <View style={[styles.dotCircle, { backgroundColor: colors.primary }]} />
            <Text style={styles.locationRoleLabel}>GIAO ĐẾN:</Text>
            <Text style={styles.personNameText} numberOfLines={1}>
              {order.receiver.name} ({order.receiver.phone || 'SĐT N/A'})
            </Text>
          </View>
          <Text style={styles.fullAddressText} numberOfLines={2}>
            {receiverAddressText}
          </Text>
        </View>

        {/* FEES GRID */}
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

      {/* CARD FOOTER */}
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
        </Text>

        <View style={styles.footerActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePrint}
            style={styles.printChipBtn}
          >
            <Ionicons name="print-outline" size={15} color={colors.primary} />
            <Text style={styles.printChipText}>In vận đơn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onPressDetail(order)}
            style={styles.detailBtn}
          >
            <Text style={styles.detailBtnText}>Chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
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
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  copyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  cardBody: {
    gap: spacing.xs,
  },
  locationBlock: {
    marginVertical: 2,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dotCircle: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  locationRoleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginRight: 4,
  },
  personNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  fullAddressText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginLeft: 13,
    lineHeight: 18,
  },
  routeLineDot: {
    width: 1,
    height: 6,
    backgroundColor: colors.border,
    marginLeft: 3,
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
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  printChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
