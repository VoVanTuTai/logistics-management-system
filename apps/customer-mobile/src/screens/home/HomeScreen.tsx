import React, { useEffect, useState } from 'react';
import {
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

import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { shipmentApi, type ShipmentResponse } from '../../services/api/shipment.api';
import { authStore, useAuthSession } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';
import type { OrderModel, ShipmentStatus } from '../../types';

import { HomeHeader } from './components/HomeHeader';
import { QuickActionsGrid } from './components/QuickActionsGrid';
import { PromoBanner } from './components/PromoBanner';
import { RateCalculatorCard } from './components/RateCalculatorCard';
import { RecentOrdersSection } from './components/RecentOrdersSection';
import { NewsAndHighlightsSection } from './components/NewsAndHighlightsSection';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

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
    shippingFeeVnd:
      Number(
        meta.estimatedFee ||
          meta.shippingFee ||
          meta.service?.fee ||
          meta.pricing?.totalFee
      ) || 22000,
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
    const user = authStore.getUser();
    if (!token) return;

    if (showLoading) setLoadingOrders(true);
    try {
      const response = await shipmentApi.getShipments(token, { limit: 5, userId: user?.id });
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

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
  };

  const handleMyOrders = () => {
    navigation.navigate('OrdersTab');
  };

  const handleTracking = () => {
    navigation.navigate('TrackingTab');
  };

  const handleRateCalculator = () => {
    navigation.navigate('PriceCalculator');
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* A. HEADER & HERO WITH SEARCH CARD */}
        <HomeHeader
          userName={user?.displayName || user?.username || 'Khách hàng'}
          onPressNotification={() => {}}
          onPressSearch={handleTracking}
          onPressCreateOrder={handleCreateOrder}
        />

        {/* B. KHU VỰC THAO TÁC NHANH (TÍNH NĂNG) */}
        <QuickActionsGrid
          onPressCreateOrder={handleCreateOrder}
          onPressMyOrders={handleMyOrders}
          onPressTracking={handleTracking}
          onPressRateCalculator={handleRateCalculator}
        />

        {/* C. PROMOTION BANNER CAROUSEL */}
        <PromoBanner onPressPromo={handleCreateOrder} />

        {/* D. TRA CỨU CƯỚC NHANH */}
        <RateCalculatorCard onPressCalculate={handleRateCalculator} />

        {/* E. ĐƠN HÀNG GẦN ĐÂY */}
        <RecentOrdersSection
          recentOrders={recentOrders}
          loading={loadingOrders}
          onSeeAll={handleMyOrders}
          onPressOrder={handleOrderClick}
          onCreateFirstOrder={handleCreateOrder}
        />

        {/* F. TIN TỨC & DỊCH VỤ NỔI BẬT */}
        <NewsAndHighlightsSection onPressCreateOrder={handleCreateOrder} />
      </ScrollView>

      {/* FLOATING CTA BUTTON */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.floatingBtn}
          onPress={handleCreateOrder}
        >
          <Ionicons name="add-circle" size={22} color={colors.surface} />
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
  scrollContent: {
    paddingBottom: 95,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.lg,
  },
  floatingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.surface,
    marginLeft: 6,
  },
});
