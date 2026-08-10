import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../components/AppHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { TrackingTimeline } from '../../components/TrackingTimeline';
import type { RootStackParamList } from '../../navigation/types';
import { trackingApi } from '../../services/api/tracking.api';
import { colors, shadows, spacing } from '../../theme';
import type { TrackingEvent } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

export function OrderDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { order } = route.params;
  const [liveTimeline, setLiveTimeline] = useState<TrackingEvent[]>(order.timeline || []);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveTracking = async () => {
      try {
        const res = await trackingApi.getTracking(order.code);
        if (isMounted && res.timeline && res.timeline.length > 0) {
          const mapped: TrackingEvent[] = res.timeline.map((ev, index) => ({
            id: ev.id || `ev-${index}`,
            title: ev.statusAfterEvent || ev.eventType || 'Cập nhật trạng thái',
            timestamp: new Date(ev.occurredAt).toLocaleString('vi-VN'),
            location: ev.locationText || ev.locationCode || undefined,
            completed: true,
            isCurrent: index === res.timeline.length - 1,
          }));
          setLiveTimeline(mapped);
        }
      } catch {
        // Keep initial timeline
      }
    };

    fetchLiveTracking();
    return () => {
      isMounted = false;
    };
  }, [order.code]);

  return (
    <View style={styles.flex}>
      <AppHeader
        title="Chi tiết đơn hàng"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. CODE & STATUS HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCodeRow}>
              <Ionicons name="barcode-outline" size={24} color={colors.primary} />
              <Text style={styles.heroCode}>{order.code}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.heroDate}>
            Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>

        {/* 2. TIMELINE JOURNEY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="navigate-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Hành trình vận đơn</Text>
          </View>
          <TrackingTimeline timeline={liveTimeline} />
        </View>

        {/* 3. SENDER & RECEIVER */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Thông tin giao nhận</Text>
          </View>

          {/* SENDER */}
          <View style={styles.addressBlock}>
            <View style={styles.addrHeaderRow}>
              <View style={[styles.badgeDot, { backgroundColor: colors.info }]} />
              <Text style={styles.addrRole}>NGƯỜI GỬI</Text>
            </View>
            <Text style={styles.addrName}>{order.sender.name}</Text>
            <Text style={styles.addrPhone}>{order.sender.phone}</Text>
            <Text style={styles.addrDetail}>{order.sender.addressDetail}</Text>
          </View>

          <View style={styles.divider} />

          {/* RECEIVER */}
          <View style={styles.addressBlock}>
            <View style={styles.addrHeaderRow}>
              <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.addrRole}>NGƯỜI NHẬN</Text>
            </View>
            <Text style={styles.addrName}>{order.receiver.name}</Text>
            <Text style={styles.addrPhone}>{order.receiver.phone}</Text>
            <Text style={styles.addrDetail}>{order.receiver.addressDetail}</Text>
          </View>
        </View>

        {/* 4. ITEM & PACKAGE INFO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Thông tin hàng hóa</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên hàng:</Text>
              <Text style={styles.infoVal}>{order.itemName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Khối lượng:</Text>
              <Text style={styles.infoVal}>{order.weightKg} kg</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Khai giá:</Text>
              <Text style={styles.infoVal}>{formatVnd(order.declaredValueVnd)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tiền thu hộ (COD):</Text>
              <Text style={[styles.infoVal, { color: colors.primary }]}>
                {formatVnd(order.codAmountVnd)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cước vận chuyển:</Text>
              <Text style={styles.infoVal}>{formatVnd(order.shippingFeeVnd)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  shareBtn: {
    padding: spacing.xs,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCode: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  heroDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  addressBlock: {
    gap: 4,
  },
  addrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  addrRole: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  addrName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addrPhone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addrDetail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
