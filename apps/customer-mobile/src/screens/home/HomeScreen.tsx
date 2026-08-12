import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { OrderCard } from '../../components/OrderCard';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { shipmentApi, type ShipmentResponse } from '../../services/api/shipment.api';
import { authStore, useAuthSession } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';
import type { OrderModel, ShipmentStatus } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const QUICK_ACTIONS = [
  { id: 'create', title: 'Tạo đơn', icon: 'document-text', color: colors.primary, bg: colors.primaryLight, isHighlight: true },
  { id: 'orders', title: 'Quản lý đơn', icon: 'cube', color: '#EA8A2F', bg: '#FFF7ED', isHighlight: true },
  { id: 'points', title: 'NEXUS ++', subtitle: 'Tích điểm', icon: 'gift', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'vouchers', title: 'Khuyến mãi', subtitle: 'Ưu đãi', icon: 'pricetag', color: '#3B82F6', bg: '#EFF6FF' },
];

const SERVICES = [
  { id: 'express', title: 'Tạo đơn hỏa tốc', icon: 'flash' },
  { id: 'intl', title: 'Giao hàng quốc tế', icon: 'airplane' },
  { id: 'hubs', title: 'Tìm kiếm bưu cục', icon: 'location' },
  { id: 'rates', title: 'Tra tính cước', icon: 'calculator' },
  { id: 'addresses', title: 'Danh sách địa chỉ', icon: 'bookmarks' },
  { id: 'guide', title: 'Hướng dẫn sử dụng', icon: 'book' },
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
    shippingFeeVnd: Number(meta.estimatedFee || meta.shippingFee || meta.service?.fee || meta.pricing?.totalFee) || 22000,
    status: (s.currentStatus as ShipmentStatus) || 'CREATED',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    timeline: [],
  };
}

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const session = useAuthSession();
  const user = session?.user;

  const [recentOrders, setRecentOrders] = useState<OrderModel[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchRecentShipments = async (showLoading = true) => {
    const token = authStore.getAccessToken();
    if (!token) return;

    if (showLoading) setLoadingOrders(true);
    try {
      const response = await shipmentApi.getShipments(token, { limit: 5 });
      const rawItems: ShipmentResponse[] = Array.isArray(response)
        ? response
        : response.items || [];

      setRecentOrders(rawItems.map(mapShipmentToOrderModel));
    } catch {
      setRecentOrders([]);
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecentShipments(true);
    const interval = setInterval(() => {
      fetchRecentShipments(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [session]);

  useFocusEffect(
    React.useCallback(() => {
      fetchRecentShipments(false);
    }, [session])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecentShipments(false);
  };

  const handleOrderClick = (order: OrderModel) => {
    navigation.navigate('OrderDetail', { order });
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* 1. TOP HEADER CARD */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.userRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={styles.userTextCol}>
                <Text style={styles.greetingText}>Xin chào,</Text>
                <Text style={styles.userName}>{user?.displayName || user?.username || 'Khách hàng'}</Text>
              </View>
            </View>

            <View style={styles.headerIconsRow}>
              <TouchableOpacity style={styles.iconCircleBtn}>
                <Ionicons name="search-outline" size={20} color={colors.surface} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircleBtn}>
                <Ionicons name="notifications-outline" size={20} color={colors.surface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* BANNER PROMO */}
          <View style={styles.promoCard}>
            <View style={styles.promoTextCol}>
              <View style={styles.promoTag}>
                <Text style={styles.promoTagText}>ƯU ĐÃI THÁNG 8</Text>
              </View>
              <Text style={styles.promoTitle}>GIẢM 25K CƯỚC PHÍ</Text>
              <Text style={styles.promoSub}>Đồng giá ship hỏa tốc toàn quốc</Text>
            </View>
            <View style={styles.promoIconCol}>
              <Ionicons name="rocket-outline" size={48} color={colors.surface} />
            </View>
          </View>
        </View>

        {/* 2. QUICK ACTIONS CARD */}
        <View style={styles.sectionContainer}>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[styles.quickCard, { backgroundColor: item.bg }]}
                onPress={() => {
                  if (item.id === 'create') navigation.navigate('CreateOrder');
                  if (item.id === 'orders') navigation.navigate('OrdersTab');
                }}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={22} color={colors.surface} />
                </View>
                <Text style={styles.quickTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.quickSub}>{item.subtitle}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. QUICK PRICE LOOKUP CARD */}
        <View style={styles.sectionContainer}>
          <View style={styles.lookupCard}>
            <View style={styles.lookupHeader}>
              <Ionicons name="calculator-outline" size={20} color={colors.primary} />
              <Text style={styles.lookupTitle}>Tra cứu cước phí nhanh</Text>
            </View>

            <View style={styles.lookupRow}>
              <View style={styles.lookupItem}>
                <Text style={styles.lookupLabel}>Người gửi</Text>
                <Text style={styles.lookupVal}>Hồ Chí Minh</Text>
              </View>

              <Ionicons name="arrow-forward" size={18} color={colors.primary} />

              <View style={styles.lookupItem}>
                <Text style={styles.lookupLabel}>Người nhận</Text>
                <Text style={styles.lookupVal}>Hà Nội</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.lookupBtn} onPress={() => navigation.navigate('CreateOrder')}>
              <Text style={styles.lookupBtnText}>🔍 Tính cước & Tạo đơn ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. DỊCH VỤ GRID */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Dịch vụ nổi bật</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map((srv) => (
              <TouchableOpacity
                key={srv.id}
                activeOpacity={0.7}
                style={styles.serviceItem}
                onPress={() => {
                  if (srv.id === 'express') navigation.navigate('CreateOrder');
                  if (srv.id === 'rates') navigation.navigate('CreateOrder');
                }}
              >
                <View style={styles.serviceIconBox}>
                  <Ionicons name={srv.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={styles.serviceText}>{srv.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. ĐƠN HÀNG GẦN ĐÂY */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.seeAllText}>Xem tất cả &gt;</Text>
            </TouchableOpacity>
          </View>

          {loadingOrders ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải đơn hàng mới nhất...</Text>
            </View>
          ) : recentOrders.length > 0 ? (
            recentOrders.map((ord) => (
              <OrderCard key={ord.id} order={ord} onPressDetail={handleOrderClick} />
            ))
          ) : (
            <View style={styles.emptyRecentBox}>
              <Ionicons name="cube-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyRecentText}>Chưa có đơn hàng nào phát sinh</Text>
              <TouchableOpacity
                style={styles.createFirstBtn}
                onPress={() => navigation.navigate('CreateOrder')}
              >
                <Text style={styles.createFirstBtnText}>+ Tạo đơn hàng đầu tiên</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FLOATING CTA BUTTON */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.floatingBtn}
          onPress={() => navigation.navigate('CreateOrder')}
        >
          <Ionicons name="add-circle" size={24} color={colors.surface} />
          <Text style={styles.floatingBtnText}>Tạo đơn hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: 90,
  },
  headerBanner: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl + 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  userTextCol: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.surface,
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  promoTextCol: {
    flex: 1,
  },
  promoTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  promoTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.surface,
  },
  promoSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  promoIconCol: {
    marginLeft: spacing.sm,
  },
  sectionContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  quickSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  lookupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  lookupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lookupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lookupItem: {
    alignItems: 'flex-start',
  },
  lookupLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  lookupVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  lookupBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  lookupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  serviceItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyRecentBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  emptyRecentText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  createFirstBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  createFirstBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 30,
    ...shadows.lg,
  },
  floatingBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
    marginLeft: 6,
  },
});
