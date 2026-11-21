import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

function mapShipmentToOrderModel(s: ShipmentResponse, targetCategory: OrderCategory = 'SENT'): OrderModel {
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
    category: targetCategory,
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
    shippingFeeVnd: Number(meta.estimatedFee || meta.shippingFee || meta.pricing?.totalFee) || 18000,
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

  const [sentOrders, setSentOrders] = useState<OrderModel[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveShipments = async (showLoading = true) => {
    const accessToken = authStore.getAccessToken();
    const user = authStore.getUser();
    if (!accessToken) return;

    if (showLoading) setLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.allSettled([
        shipmentApi.getShipments(accessToken, { limit: 100, userId: user?.id }),
        shipmentApi.getReceivedShipments(accessToken, { limit: 100, phone: user?.phone }),
      ]);

      if (sentRes.status === 'fulfilled') {
        const rawSent: ShipmentResponse[] = Array.isArray(sentRes.value)
          ? sentRes.value
          : (sentRes.value as any)?.items || [];
        setSentOrders(rawSent.map((s) => mapShipmentToOrderModel(s, 'SENT')));
      }

      if (receivedRes.status === 'fulfilled') {
        const rawReceived: ShipmentResponse[] = Array.isArray(receivedRes.value)
          ? receivedRes.value
          : (receivedRes.value as any)?.items || [];
        setReceivedOrders(rawReceived.map((s) => mapShipmentToOrderModel(s, 'RECEIVED')));
      }
    } catch {
      // Keep existing data on error
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
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchLiveShipments(false);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLiveShipments(false);
  };

  const handlePromptCancel = (ord: OrderModel) => {
    Alert.alert(
      'Xác nhận hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn hàng #${ord.code} không?\n\nKiện hàng chưa bàn giao cho bưu tá nên được hủy MIỄN PHÍ 100% (0 VNĐ).`,
      [
        { text: 'Giữ lại đơn', style: 'cancel' },
        {
          text: 'Xác nhận hủy đơn',
          style: 'destructive',
          onPress: async () => {
            const accessToken = authStore.getAccessToken();
            if (!accessToken) return;
            try {
              await shipmentApi.cancelShipment(
                accessToken,
                ord.code,
                'Khách hàng hủy trên danh sách đơn',
              );
              fetchLiveShipments(false);
              Alert.alert('Đã hủy đơn hàng', `Đơn hàng #${ord.code} đã được hủy thành công.`);
            } catch (err: any) {
              Alert.alert('Không thể hủy đơn', err?.message || 'Có lỗi xảy ra khi hủy đơn.');
            }
          },
        },
      ],
    );
  };

  const filteredOrders = useMemo(() => {
    const activeList = category === 'SENT' ? sentOrders : receivedOrders;

    return activeList.filter((ord) => {
      // 1. Filter by Time
      if (timeFilter !== 'custom' && ord.createdAt) {
        const orderDate = new Date(ord.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - orderDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (timeFilter === 'today') {
          const isToday =
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (timeFilter === 'yesterday') {
          const yest = new Date(now);
          yest.setDate(yest.getDate() - 1);
          const isYesterday =
            orderDate.getDate() === yest.getDate() &&
            orderDate.getMonth() === yest.getMonth() &&
            orderDate.getFullYear() === yest.getFullYear();
          if (!isYesterday) return false;
        } else if (timeFilter === '7days') {
          if (diffDays > 7) return false;
        } else if (timeFilter === '14days') {
          if (diffDays > 14) return false;
        } else if (timeFilter === '30days') {
          if (diffDays > 30) return false;
        } else if (timeFilter === 'this_month') {
          if (
            orderDate.getMonth() !== now.getMonth() ||
            orderDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (timeFilter === 'last_month') {
          const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (
            orderDate.getMonth() !== prevMonth ||
            orderDate.getFullYear() !== prevYear
          ) {
            return false;
          }
        }
      }

      // 2. Filter by Status
      if (statusFilter !== 'ALL') {
        const s = (ord.status || '').toUpperCase();
        if (statusFilter === 'ARRIVED_HUB') {
          if (s !== 'ARRIVED_HUB' && s !== 'SCAN_INBOUND' && s !== 'HUB_ARRIVED' && s !== 'MANIFEST_RECEIVED') return false;
        } else if (statusFilter === 'IN_TRANSIT') {
          if (s !== 'IN_TRANSIT' && s !== 'OUTBOUND' && s !== 'MANIFEST_DISPATCHED') return false;
        } else if (statusFilter === 'PICKUP_COMPLETED') {
          if (s !== 'PICKUP_COMPLETED' && s !== 'PICKED_UP' && s !== 'SCAN_PICKUP') return false;
        } else if (s !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [sentOrders, receivedOrders, category, statusFilter, timeFilter]);

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
            Đơn gửi ({sentOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.topTabBtn, category === 'RECEIVED' && styles.topTabBtnActive]}
          onPress={() => setCategory('RECEIVED')}
        >
          <Text style={[styles.topTabText, category === 'RECEIVED' && styles.topTabTextActive]}>
            Đơn nhận ({receivedOrders.length})
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
              onPressCancel={handlePromptCancel}
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
