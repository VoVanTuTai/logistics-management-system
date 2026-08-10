import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '../../components/EmptyState';
import { FilterBottomSheet, type FilterOptionItem } from '../../components/FilterBottomSheet';
import { OrderCard } from '../../components/OrderCard';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { shipmentApi, type ShipmentResponse } from '../../services/api/shipment.api';
import { authStore } from '../../store/authStore';
import { colors, spacing } from '../../theme';
import type { OrderCategory, OrderModel, OrderType, ShipmentStatus, TimeFilterOption } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'OrdersTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TIME_FILTER_OPTIONS: FilterOptionItem<TimeFilterOption>[] = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Hôm qua', value: 'yesterday' },
  { label: '7 ngày trước', value: '7days' },
  { label: '14 ngày trước', value: '14days' },
  { label: '30 ngày trước', value: '30days' },
  { label: 'Tháng này', value: 'this_month' },
  { label: 'Tháng trước', value: 'last_month' },
  { label: 'Tùy chọn', value: 'custom' },
];

const STATUS_FILTER_OPTIONS: FilterOptionItem<string>[] = [
  { label: 'Tất cả trạng thái', value: 'ALL' },
  { label: 'Chờ lấy hàng', value: 'CREATED' },
  { label: 'Đã lấy hàng', value: 'PICKUP_COMPLETED' },
  { label: 'Đang vận chuyển', value: 'IN_TRANSIT' },
  { label: 'Đã đến Hub', value: 'ARRIVED_HUB' },
  { label: 'Đang giao', value: 'READY_FOR_DELIVERY' },
  { label: 'Giao thành công', value: 'DELIVERED' },
  { label: 'Giao thất bại', value: 'DELIVERY_FAILED' },
  { label: 'Chuyển hoàn', value: 'RETURNED' },
];

function mapShipmentToOrderModel(s: ShipmentResponse): OrderModel {
  const meta = (s.metadata as Record<string, any>) || {};
  const sender = meta.sender || {};
  const receiver = meta.receiver || {};
  const pkg = meta.package || {};

  return {
    id: s.id,
    code: s.code,
    category: 'SENT',
    orderType: 'REGULAR',
    sender: {
      name: sender.name || 'Người gửi',
      phone: sender.phone || '',
      addressDetail: sender.addressDetail || sender.province || '',
    },
    receiver: {
      name: receiver.name || 'Người nhận',
      phone: receiver.phone || '',
      addressDetail: receiver.addressDetail || receiver.province || '',
    },
    itemName: pkg.itemName || 'Hàng hóa bưu gửi',
    weightKg: Number(pkg.weightKg) || 0.5,
    declaredValueVnd: Number(pkg.declaredValue) || 0,
    codAmountVnd: Number(meta.codAmount || pkg.codAmount) || 0,
    shippingFeeVnd: Number(meta.shippingFee || meta.service?.fee) || 22000,
    status: (s.currentStatus as ShipmentStatus) || 'CREATED',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    timeline: [],
  };
}

export function OrdersScreen({ route, navigation }: Props): React.JSX.Element {
  const [category, setCategory] = useState<OrderCategory>(
    route.params?.initialCategory ?? 'SENT',
  );
  const [subTab, setSubTab] = useState<OrderType>('REGULAR');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('30days');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);

  const [liveOrders, setLiveOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveShipments = async () => {
    const accessToken = authStore.getAccessToken();
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await shipmentApi.getShipments(accessToken, {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        limit: 50,
      });

      const rawItems: ShipmentResponse[] = Array.isArray(response)
        ? response
        : response.items || [];

      setLiveOrders(rawItems.map(mapShipmentToOrderModel));
    } catch {
      setLiveOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveShipments();
  }, [statusFilter, timeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLiveShipments();
  };

  const filteredOrders = useMemo(() => {
    return liveOrders.filter((ord) => {
      if (category === 'SENT' && ord.category !== 'SENT') return false;
      if (statusFilter !== 'ALL' && ord.status !== statusFilter) return false;
      return true;
    });
  }, [liveOrders, category, statusFilter]);

  const getTimeLabel = () => {
    const found = TIME_FILTER_OPTIONS.find((t) => t.value === timeFilter);
    return found ? found.label : 'Thời gian';
  };

  const getStatusLabel = () => {
    const found = STATUS_FILTER_OPTIONS.find((s) => s.value === statusFilter);
    return found ? found.label : 'Trạng thái';
  };

  const handleOrderPress = (order: OrderModel) => {
    navigation.navigate('OrderDetail', { order });
  };

  return (
    <View style={styles.flex}>
      {/* 1. HEADER CATEGORY TABS (Đơn gửi / Đơn nhận) */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <View style={styles.topTabsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.topTabBtn, category === 'SENT' && styles.topTabActive]}
            onPress={() => setCategory('SENT')}
          >
            <Text style={[styles.topTabText, category === 'SENT' && styles.topTabActiveText]}>
              Đơn gửi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.topTabBtn, category === 'RECEIVED' && styles.topTabActive]}
            onPress={() => setCategory('RECEIVED')}
          >
            <Text style={[styles.topTabText, category === 'RECEIVED' && styles.topTabActiveText]}>
              Đơn nhận
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. SUB TABS (Đơn thường, Đơn TMĐT, Đơn nhanh) */}
      <View style={styles.subTabsContainer}>
        {(['REGULAR', 'ECOMMERCE', 'EXPRESS'] as OrderType[]).map((t) => {
          const isSelected = subTab === t;
          const label = t === 'REGULAR' ? 'Đơn thường' : t === 'ECOMMERCE' ? 'Đơn TMĐT' : 'Đơn giao nhanh';
          return (
            <TouchableOpacity
              key={t}
              activeOpacity={0.7}
              style={[styles.subTabBtn, isSelected && styles.subTabActive]}
              onPress={() => setSubTab(t)}
            >
              <Text style={[styles.subTabText, isSelected && styles.subTabActiveText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. FILTER BAR CHIPS */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.chipBtn}
          onPress={() => setShowTimeSheet(true)}
        >
          <Ionicons name="calendar-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.chipText}>{getTimeLabel()}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.chipBtn}
          onPress={() => setShowStatusSheet(true)}
        >
          <Ionicons name="filter-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.chipText} numberOfLines={1}>{getStatusLabel()}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 4. ORDERS LIST OR EMPTY STATE */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách vận đơn...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onPressDetail={handleOrderPress} />
          )}
          ListEmptyComponent={
            <EmptyState
              title={category === 'SENT' ? 'Quý khách chưa có đơn hàng gửi.' : 'Quý khách chưa có đơn hàng nhận.'}
              subtitle="Vui lòng tạo thêm đơn để quản lý!"
              buttonTitle="Tạo đơn hàng"
              onButtonPress={() => navigation.navigate('CreateOrder')}
            />
          }
        />
      )}

      {/* FILTER BOTTOM SHEETS */}
      <FilterBottomSheet
        visible={showTimeSheet}
        title="Bộ lọc thời gian"
        options={TIME_FILTER_OPTIONS}
        selectedValue={timeFilter}
        onSelect={(val) => setTimeFilter(val)}
        onClose={() => setShowTimeSheet(false)}
      />

      <FilterBottomSheet
        visible={showStatusSheet}
        title="Bộ lọc trạng thái"
        options={STATUS_FILTER_OPTIONS}
        selectedValue={statusFilter}
        onSelect={(val) => setStatusFilter(val)}
        onClose={() => setShowStatusSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerArea: {
    backgroundColor: colors.surface,
    paddingTop: spacing.xl + 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  topTabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 3,
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  topTabActive: {
    backgroundColor: colors.primary,
  },
  topTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  topTabActiveText: {
    color: colors.surface,
    fontWeight: '700',
  },
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 8,
  },
  subTabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  subTabActive: {
    backgroundColor: colors.primaryLight,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subTabActiveText: {
    color: colors.primary,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
