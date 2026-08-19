import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
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
import type { ShipmentStatus, TrackingEvent } from '../../types';
import { copyToClipboard } from '../../utils/clipboard';
import { mapTimelineEventsForCustomer } from '../../utils/customerTrackingMapper';

import { printOrShareShippingLabel } from '../../services/shippingLabelPrinter';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

export function OrderDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { order } = route.params;
  const [liveStatus, setLiveStatus] = useState<ShipmentStatus | string>(order.status);
  const [liveTimeline, setLiveTimeline] = useState<TrackingEvent[]>(order.timeline || []);
  const [refreshing, setRefreshing] = useState(false);
  const [printing, setPrinting] = useState(false);

  const senderAddressText =
    order.sender.composedAddress || order.sender.addressDetail || 'Chưa có địa chỉ gửi';
  const receiverAddressText =
    order.receiver.composedAddress || order.receiver.addressDetail || 'Chưa có địa chỉ nhận';

  const fetchLiveTracking = async () => {
    try {
      const res = await trackingApi.getTracking(order.code);
      if (res.current?.currentStatusCode) {
        setLiveStatus(res.current.currentStatusCode);
      }
      if (res.timeline && res.timeline.length > 0) {
        const mapped = mapTimelineEventsForCustomer(
          res.timeline,
          senderAddressText,
          receiverAddressText,
        );
        setLiveTimeline(mapped);
      }
    } catch {
      // Keep existing timeline & status
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveTracking();
    const interval = setInterval(() => {
      fetchLiveTracking();
    }, 8000);

    return () => clearInterval(interval);
  }, [order.code]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveTracking();
  };

  const handlePrintWaybill = async () => {
    setPrinting(true);
    try {
      await printOrShareShippingLabel(order);
    } catch {
      // Ignore print cancel
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <AppHeader
        title="Chi tiết đơn hàng"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.shareBtn} onPress={handlePrintWaybill}>
            <Ionicons name="print-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* 1. CODE & STATUS HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroCodeRow}>
            <Ionicons name="barcode-outline" size={24} color={colors.primary} />
            <Text style={styles.heroCode}>{order.code}</Text>

            {/* COPY BUTTON */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.copyChipBtn}
              onPress={() => copyToClipboard(order.code, 'mã vận đơn')}
            >
              <Ionicons name="copy-outline" size={15} color={colors.primary} />
              <Text style={styles.copyChipText}>Sao chép</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroMetaRow}>
            <StatusBadge status={liveStatus} />
            <Text style={styles.heroDate}>
              Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>

          {/* PRINT WAYBILL PDF ACTION BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.printWaybillBtn, printing && styles.printWaybillBtnDisabled]}
            disabled={printing}
            onPress={handlePrintWaybill}
          >
            <Ionicons name="print" size={18} color="#ffffff" />
            <Text style={styles.printWaybillText}>
              {printing ? 'Đang tạo PDF mã vận đơn...' : 'In / Tải PDF Mã vận đơn'}
            </Text>
          </TouchableOpacity>
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
            <Text style={styles.addrDetail}>{senderAddressText}</Text>
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
            <Text style={styles.addrDetail}>{receiverAddressText}</Text>
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
  heroCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  heroCode: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  copyChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  copyChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  heroDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  printWaybillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    ...shadows.sm,
  },
  printWaybillBtnDisabled: {
    opacity: 0.7,
  },
  printWaybillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
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
    lineHeight: 19,
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
