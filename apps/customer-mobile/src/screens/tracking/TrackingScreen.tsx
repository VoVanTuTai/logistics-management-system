import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { shipmentApi, type ShipmentResponse } from '../../services/api/shipment.api';
import { trackingApi, type UnifiedTrackingResponse } from '../../services/api/tracking.api';
import { authStore } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';
import type { OrderModel, ShipmentStatus, TrackingEvent } from '../../types';
import { copyToClipboard } from '../../utils/clipboard';
import { mapTrackingToCustomerOrderModel, normalizeMediaPublicUrl } from '../../utils/customerTrackingMapper';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'TrackingTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

function mapTrackingToOrderModel(
  res: UnifiedTrackingResponse,
  shipment?: ShipmentResponse | null,
): OrderModel {
  const currentStatus =
    (res.current?.currentStatusCode as ShipmentStatus) ||
    (shipment?.currentStatus as ShipmentStatus) ||
    'CREATED';

  const meta = (shipment?.metadata as Record<string, any>) || {};
  const sender = meta.sender || {};
  const receiver = meta.receiver || {};
  const pkg = meta.package || {};

  const senderAddressComposed =
    sender.address ||
    [sender.addressDetail, sender.ward, sender.province].filter(Boolean).join(', ') ||
    res.current?.currentLocationText ||
    '';

  const receiverAddressComposed =
    receiver.address ||
    [receiver.addressDetail, receiver.ward, receiver.province].filter(Boolean).join(', ') ||
    '';

  const rawTimeline = [...(res.timeline || [])];
  // Sort ascending first by occurredAt
  rawTimeline.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  const totalEvents = rawTimeline.length;

  const mappedTimeline: TrackingEvent[] = rawTimeline.map((ev, index) => {
    const occurredDate = new Date(ev.occurredAt);
    const isValidDate = !isNaN(occurredDate.getTime());

    const timeLabel = isValidDate
      ? occurredDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';
    const dateLabel = isValidDate
      ? occurredDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    const createdDate = ev.createdAt ? new Date(ev.createdAt) : null;
    const uploadedAt = createdDate && !isNaN(createdDate.getTime())
      ? createdDate.toLocaleString('vi-VN')
      : undefined;

    // Real API fields
    const action = ev.eventType || ev.statusAfterEvent || 'Cập nhật hành trình';
    const statusText = ev.statusAfterEvent || undefined;
    const locationText = ev.locationText || ev.locationCode || undefined;
    const actorText = ev.actor || undefined;

    // Check for real proof image URL in event metadata, shipment metadata, or embedded in note text
    let proofImageUrl: string | undefined = undefined;
    if (ev.metadata?.podImageUrl && typeof ev.metadata.podImageUrl === 'string') {
      proofImageUrl = ev.metadata.podImageUrl;
    } else if (ev.metadata?.proofImageUrl && typeof ev.metadata.proofImageUrl === 'string') {
      proofImageUrl = ev.metadata.proofImageUrl;
    } else if (ev.metadata?.photoUrl && typeof ev.metadata.photoUrl === 'string') {
      proofImageUrl = ev.metadata.photoUrl;
    } else if (index === totalEvents - 1 && meta.podImageUrl && typeof meta.podImageUrl === 'string') {
      proofImageUrl = meta.podImageUrl;
    }

    const noteRaw = ev.note || '';
    const textUrlMatch = noteRaw.match(/https?:\/\/[^\s"'<>()]+/i) || (ev.actor || '').match(/https?:\/\/[^\s"'<>()]+/i);
    if (!proofImageUrl && textUrlMatch) {
      proofImageUrl = textUrlMatch[0];
    }

    proofImageUrl = normalizeMediaPublicUrl(proofImageUrl);

    // Clean note text by removing raw URL links & "Minh chứng: Xem ảnh" placeholders
    let cleanNote: string | undefined = noteRaw
      .replace(/https?:\/\/[^\s"'<>()]+/gi, '')
      .replace(/\|?\s*Minh chứng:\s*Xem ảnh/gi, '')
      .replace(/\|?\s*Minh chứng:\s*/gi, '')
      .trim();

    if (!cleanNote) {
      cleanNote = undefined;
    }

    return {
      id: ev.id || `ev-${index}`,
      stt: index + 1,
      action,
      statusText,
      scannedAt: isValidDate ? occurredDate.toLocaleString('vi-VN') : ev.occurredAt,
      timeLabel,
      dateLabel,
      uploadedAt,
      locationText,
      actorText,
      noteText: cleanNote,
      proofImageUrl,
      completed: true,
      isCurrent: index === totalEvents - 1,
    };
  });

  // Reverse timeline so newest event is on top for mobile layout
  mappedTimeline.reverse();

  return {
    id: shipment?.id || res.shipmentCode,
    code: res.shipmentCode,
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
    status: currentStatus,
    createdAt: shipment?.createdAt || res.current?.lastEventAt || new Date().toISOString(),
    updatedAt: shipment?.updatedAt || res.current?.updatedAt || new Date().toISOString(),
    timeline: mappedTimeline.length > 0 ? mappedTimeline : [
      {
        id: 't-1',
        stt: 1,
        action: 'Tạo đơn hàng',
        statusText: 'Đã tạo',
        scannedAt: new Date(shipment?.createdAt || Date.now()).toLocaleString('vi-VN'),
        timeLabel: new Date(shipment?.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        dateLabel: new Date(shipment?.createdAt || Date.now()).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        completed: true,
        isCurrent: true,
      },
    ],
  };
}

export function TrackingScreen({ route, navigation }: Props): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState(route.params?.initialCode ?? '');
  const [foundOrder, setFoundOrder] = useState<OrderModel | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const accessToken = authStore.getAccessToken();
      const [shipmentResult, trackingResult] = await Promise.allSettled([
        accessToken ? shipmentApi.getShipmentByCode(accessToken, q) : Promise.resolve(null),
        trackingApi.getTracking(q),
      ]);

      const shipment = shipmentResult.status === 'fulfilled' ? shipmentResult.value : null;
      const trackingRes =
        trackingResult.status === 'fulfilled'
          ? trackingResult.value
          : { shipmentCode: q, current: null, timeline: [] };

      if (!shipment && (!trackingRes.timeline || trackingRes.timeline.length === 0) && !trackingRes.current) {
        setFoundOrder(null);
      } else {
        setFoundOrder(mapTrackingToCustomerOrderModel(trackingRes, shipment));
      }
    } catch {
      setFoundOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route.params?.initialCode) {
      setSearchQuery(route.params.initialCode);
      handleSearch();
    }
  }, [route.params?.initialCode]);

  return (
    <View style={styles.flex}>
      {/* HEADER */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Tra cứu hành trình vận đơn</Text>
        <Text style={styles.headerSub}>Dữ liệu theo dõi thời gian thực từ Tracking API</Text>

        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập mã vận đơn (VD: 333911360074)..."
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
            <Text style={styles.loadingText}>Đang lấy lịch sử hành trình từ Tracking API...</Text>
          </View>
        ) : hasSearched && foundOrder ? (
          <View style={styles.resultBlock}>
            {/* HERO SHIPMENT HEADER CARD */}
            <View style={styles.carrierCard}>
              <View style={styles.carrierHeaderRow}>
                <View style={styles.carrierBrandCol}>
                  <View style={styles.brandBadge}>
                    <Ionicons name="flash" size={14} color={colors.surface} />
                    <Text style={styles.brandBadgeText}>NEXUS EXPRESS</Text>
                  </View>
                  <Text style={styles.serviceNameText}>Tra cứu hành trình hệ thống</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.supportContactBtn}
                  onPress={() => Linking.openURL('tel:19001088').catch(() => {})}
                >
                  <Ionicons name="headset-outline" size={15} color={colors.primary} />
                  <Text style={styles.supportContactBtnText}>Liên hệ CSKH</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.trackingCodeRow}>
                <Text style={styles.codeText}>{foundOrder.code}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.copyBtn}
                  onPress={() => copyToClipboard(foundOrder.code, 'mã vận đơn')}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.copyBtnText}>Sao chép</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statusRow}>
                <StatusBadge status={foundOrder.status} />
                <Text style={styles.updateTimeText}>Thời gian quét thực tế API</Text>
              </View>
            </View>

            {/* REAL TRACKING TIMELINE CARD */}
            <View style={styles.timelineCard}>
              <View style={styles.timelineHeaderRow}>
                <Ionicons name="list" size={20} color={colors.primary} />
                <Text style={styles.cardSectionTitle}>Lịch sử trạng thái quét (Real API Data)</Text>
              </View>

              <TrackingTimeline timeline={foundOrder.timeline} />
            </View>

            {/* SENDER / RECEIVER & PACKAGE SUMMARY */}
            <View style={styles.infoCard}>
              <Text style={styles.cardSectionTitle}>Thông tin bưu gửi & Thanh toán</Text>

              <View style={styles.infoBlock}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Người gửi:</Text>
                  <Text style={styles.infoVal}>{foundOrder.sender.name} {foundOrder.sender.phone ? `(${foundOrder.sender.phone})` : ''}</Text>
                </View>
                {foundOrder.sender.composedAddress || foundOrder.sender.addressDetail ? (
                  <View style={styles.infoRowAddress}>
                    <Text style={styles.infoLabel}>Địa chỉ gửi:</Text>
                    <Text style={styles.infoValAddress}>{foundOrder.sender.composedAddress || foundOrder.sender.addressDetail}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.infoBlock}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Người nhận:</Text>
                  <Text style={styles.infoVal}>{foundOrder.receiver.name} {foundOrder.receiver.phone ? `(${foundOrder.receiver.phone})` : ''}</Text>
                </View>
                {foundOrder.receiver.composedAddress || foundOrder.receiver.addressDetail ? (
                  <View style={styles.infoRowAddress}>
                    <Text style={styles.infoLabel}>Địa chỉ nhận:</Text>
                    <Text style={styles.infoValAddress}>{foundOrder.receiver.composedAddress || foundOrder.receiver.addressDetail}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tên hàng hóa:</Text>
                <Text style={styles.infoVal}>{foundOrder.itemName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Khối lượng:</Text>
                <Text style={styles.infoVal}>{foundOrder.weightKg} kg</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cước vận chuyển:</Text>
                <Text style={styles.infoVal}>{formatVnd(foundOrder.shippingFeeVnd)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tiền thu hộ (COD):</Text>
                <Text style={[styles.infoVal, { color: colors.primary }]}>{formatVnd(foundOrder.codAmountVnd)}</Text>
              </View>
            </View>
          </View>
        ) : hasSearched && !foundOrder ? (
          <View style={styles.notFoundBox}>
            <Ionicons name="search-outline" size={56} color={colors.textMuted} />
            <Text style={styles.notFoundTitle}>Không tìm thấy thông tin vận đơn</Text>
            <Text style={styles.notFoundSub}>
              Mã vận đơn "{searchQuery}" chưa phát sinh lịch sử quét trên hệ thống tracking. Vui lòng kiểm tra lại mã.
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderBox}>
            <Ionicons name="location-outline" size={64} color={colors.primaryLight} />
            <Text style={styles.placeholderText}>Nhập mã vận đơn phía trên để tra cứu lịch sử hành trình</Text>
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
  carrierCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  carrierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  carrierBrandCol: {
    gap: 4,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.surface,
  },
  serviceNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  supportContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  supportContactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  trackingCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: spacing.xs,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 3,
  },
  copyBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  updateTimeText: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  infoBlock: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoRowAddress: {
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoValAddress: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
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
