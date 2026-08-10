import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { StatusBadge } from '../../components/StatusBadge';
import { TrackingTimeline } from '../../components/TrackingTimeline';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { trackingApi, type PublicTrackingResponse } from '../../services/api/tracking.api';
import { colors, shadows, spacing } from '../../theme';
import type { OrderModel, ShipmentStatus, TrackingEvent } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'TrackingTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

function mapTrackingToOrderModel(res: PublicTrackingResponse): OrderModel {
  const currentStatus = (res.current?.currentStatusCode as ShipmentStatus) || 'CREATED';

  const mappedTimeline: TrackingEvent[] = res.timeline.map((ev, index) => ({
    id: ev.id || `ev-${index}`,
    title: ev.statusAfterEvent || ev.eventType || 'Cập nhật trạng thái',
    timestamp: new Date(ev.occurredAt).toLocaleString('vi-VN'),
    location: ev.locationText || ev.locationCode || undefined,
    completed: true,
    isCurrent: index === res.timeline.length - 1,
  }));

  const orderData = res.order;
  return {
    id: res.shipmentCode,
    code: res.shipmentCode,
    category: 'SENT',
    orderType: 'REGULAR',
    sender: {
      name: orderData?.sender?.name || 'Người gửi',
      phone: orderData?.sender?.phone || '',
      addressDetail: orderData?.sender?.addressDetail || '',
    },
    receiver: {
      name: orderData?.receiver?.name || 'Người nhận',
      phone: orderData?.receiver?.phone || '',
      addressDetail: orderData?.receiver?.addressDetail || '',
    },
    itemName: orderData?.package?.itemType || 'Hàng hóa bưu gửi',
    weightKg: Number(orderData?.package?.weightKg) || 0.5,
    declaredValueVnd: Number(orderData?.package?.declaredValue) || 0,
    codAmountVnd: Number(orderData?.codAmount) || 0,
    shippingFeeVnd: Number(orderData?.shippingFee) || 22000,
    status: currentStatus,
    createdAt: orderData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: mappedTimeline.length > 0 ? mappedTimeline : [
      {
        id: 't-1',
        title: 'Đã khởi tạo đơn trên hệ thống',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        completed: true,
        isCurrent: true,
      },
    ],
  };
}

export function TrackingScreen({ route, navigation }: Props): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState(route.params?.initialCode ?? 'NXS123456789');
  const [foundOrder, setFoundOrder] = useState<OrderModel | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await trackingApi.getTracking(q);
      setFoundOrder(mapTrackingToOrderModel(res));
    } catch {
      setFoundOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route.params?.initialCode) {
      handleSearch();
    }
  }, [route.params?.initialCode]);

  return (
    <View style={styles.flex}>
      {/* HEADER */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Tra cứu vận đơn</Text>
        <Text style={styles.headerSub}>Nhập mã vận đơn để theo dõi hành trình chuyển phát</Text>

        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập mã vận đơn (Ví dụ: NXS123456789)"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Tra cứu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tra cứu dữ liệu từ Tracking Service...</Text>
          </View>
        ) : hasSearched && foundOrder ? (
          <View style={styles.resultBlock}>
            {/* HERO RESULT CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.codeLabel}>Mã vận đơn</Text>
                  <Text style={styles.codeVal}>{foundOrder.code}</Text>
                </View>
                <StatusBadge status={foundOrder.status} />
              </View>
            </View>

            {/* TIMELINE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Hành trình chi tiết (Live Tracking)</Text>
              <TrackingTimeline timeline={foundOrder.timeline} />
            </View>

            {/* SENDER / RECEIVER SUMMARY */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin bưu gửi</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Người gửi:</Text>
                <Text style={styles.infoVal}>{foundOrder.sender.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Người nhận:</Text>
                <Text style={styles.infoVal}>{foundOrder.receiver.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tên hàng hóa:</Text>
                <Text style={styles.infoVal}>{foundOrder.itemName}</Text>
              </View>
            </View>
          </View>
        ) : hasSearched && !foundOrder ? (
          <View style={styles.notFoundBox}>
            <Ionicons name="search-outline" size={56} color={colors.textMuted} />
            <Text style={styles.notFoundTitle}>Không tìm thấy vận đơn</Text>
            <Text style={styles.notFoundSub}>
              Mã vận đơn "{searchQuery}" chưa phát sinh thông tin trên hệ thống tracking. Vui lòng kiểm tra lại.
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderBox}>
            <Ionicons name="location-outline" size={64} color={colors.primaryLight} />
            <Text style={styles.placeholderText}>Nhập mã vận đơn phía trên để bắt đầu tra cứu</Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  resultBlock: {
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  codeVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  notFoundBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
  },
  notFoundTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  notFoundSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
