import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderCard } from '../../../components/OrderCard';
import { colors, shadows, spacing } from '../../../theme';
import type { OrderModel } from '../../../types';

interface RecentOrdersSectionProps {
  recentOrders: OrderModel[];
  loading: boolean;
  onSeeAll: () => void;
  onPressOrder: (order: OrderModel) => void;
  onCreateFirstOrder: () => void;
}

export function RecentOrdersSection({
  recentOrders,
  loading,
  onSeeAll,
  onPressOrder,
  onCreateFirstOrder,
}: RecentOrdersSectionProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải đơn hàng mới nhất...</Text>
        </View>
      ) : recentOrders.length > 0 ? (
        <View style={styles.ordersList}>
          {recentOrders.slice(0, 1).map((ord) => (
            <OrderCard key={ord.id} order={ord} onPressDetail={onPressOrder} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng nào phát sinh</Text>
          <Text style={styles.emptySub}>Tạo đơn ngay để trải nghiệm dịch vụ giao hàng nhanh chóng</Text>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.8}
            onPress={onCreateFirstOrder}
          >
            <Ionicons name="add" size={16} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.createBtnText}>Tạo đơn hàng đầu tiên</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  ordersList: {
    gap: spacing.sm,
  },
  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  createBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
});
