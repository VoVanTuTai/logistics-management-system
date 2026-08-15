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
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
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

  const senderAddressComposed =
    sender.address ||
    [sender.addressDetail, sender.ward, sender.province].filter(Boolean).join(', ') ||
    'Chưa có địa chỉ';

  const receiverAddressComposed =
    receiver.address ||
    [receiver.addressDetail, receiver.ward, receiver.province].filter(Boolean).join(', ') ||
    'Chưa có địa chỉ';

  return {
    id: s.id,
    code: s.code,
    category: 'SENT',
    orderType: 'REGULAR',
    sender: {
      name: sender.name || 'Người gửi',
      phone: sender.phone || '',
      addressDetail: senderAddressComposed,
      composedAddress: senderAddressComposed,
      ward: sender.ward,
      district: sender.district,
      province: sender.province,
      hubCode: sender.hubCode,
    },
    receiver: {
      name: receiver.name || 'Người nhận',
      phone: receiver.phone || '',
      addressDetail: receiverAddressComposed,
      composedAddress: receiverAddressComposed,
      ward: receiver.ward,
      district: receiver.district,
      province: receiver.province,
      hubCode: receiver.hubCode,
    },
    itemName: pkg.itemName || pkg.itemType || 'Hàng hóa bưu gửi',
    weightKg: Number(pkg.weightKg) || 0.5,
    declaredValueVnd: Number(pkg.declaredValue) || 0,
    codAmountVnd: Number(meta.codAmount || pkg.codAmount) || 0,
    shippingFeeVnd: Number(meta.estimatedFee || meta.shippingFee || meta.pricing?.totalFee) || 22000,
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

  const fetchLiveShipments = async (showLoading = true) => {
    const accessToken = authStore.getAccessToken();
    if (!accessToken) return;

    if (showLoading) setLoading(true);
    try {
      const response =
        category === 'RECEIVED'
          ? await shipmentApi.getReceivedShipments(accessToken, {
              status: statusFilter !== 'ALL' ? statusFilter : undefined,
              limit: 50,
            })
          : await shipmentApi.getShipments(accessToken, {
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
    fetchLiveShipments(true);
    const interval = setInterval(() => {
      fetchLiveShipments(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [statusFilter, timeFilter, category]);

  useFocusEffect(
    React.useCallback(() => {
      fetchLiveShipments(false);
    }, [statusFilter, timeFilter, category])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLiveShipments(false);
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

  return (
    <View style={styles.container}>
      {/* HEADER TABS */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.topTabBtn, category === 'SENT' && styles.topTabBtnActive]}
          onPress={() => setCategory('SENT')}
        >
          <Text style={[styles.topTabText, category === 'SENT' && styles.topTabTextActive]}>
            Đơn gửi ({liveOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.topTabBtn, category === 'RECEIVED' && styles.topTabBtnActive]}
          onPress={() => setCategory('RECEIVED')}
        >
          <Text style={[styles.topTabText, category === 'RECEIVED' && styles.topTabTextActive]}>
            Đơn nhận (0)
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.filterChip}
          onPress={() => setShowTimeSheet(true)}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.filterChipText}>{getTimeLabel()}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.filterChip}
          onPress={() => setShowStatusSheet(true)}
        >
          <Ionicons name="funnel-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.filterChipText}>{getStatusLabel()}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ORDERS LIST */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPressDetail={(ord) => navigation.navigate('OrderDetail', { order: ord })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              iconName="cube-outline"
              title="Không có đơn hàng nào"
              subtitle="Chưa có đơn hàng nào phù hợp với bộ lọc hiện tại."
              buttonTitle="Tạo đơn ngay"
              onButtonPress={() => navigation.navigate('CreateOrder')}
            />
          }
        />
      )}

      {/* FILTER BOTTOM SHEETS */}
      <FilterBottomSheet
        visible={showTimeSheet}
        title="Lọc theo thời gian"
        options={TIME_FILTER_OPTIONS}
        selectedValue={timeFilter}
        onSelect={setTimeFilter}
        onClose={() => setShowTimeSheet(false)}
      />

      <FilterBottomSheet
        visible={showStatusSheet}
        title="Lọc theo trạng thái đơn"
        options={STATUS_FILTER_OPTIONS}
        selectedValue={statusFilter}
        onSelect={setStatusFilter}
        onClose={() => setShowStatusSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabBtnActive: {
    borderBottomColor: colors.primary,
  },
  topTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  topTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
  },
});
