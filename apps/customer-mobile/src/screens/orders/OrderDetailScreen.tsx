import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
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
import { CourierRatingModal } from '../../components/CourierRatingModal';
import { CustomerComplaintsModal } from '../../components/CustomerComplaintsModal';
import { StatusBadge } from '../../components/StatusBadge';
import { TrackingTimeline } from '../../components/TrackingTimeline';
import type { RootStackParamList } from '../../navigation/types';
import { trackingApi } from '../../services/api/tracking.api';
import { shipmentApi } from '../../services/api/shipment.api';
import { ratingsApi } from '../../services/api/ratings.api';
import { authStore } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';
import type { ShipmentStatus, TrackingEvent } from '../../types';
import { copyToClipboard } from '../../utils/clipboard';
import { mapTimelineEventsForCustomer } from '../../utils/customerTrackingMapper';
import {
  resolveCourierForOrder,
  resolveCourierContextForOrder,
  formatCourierPhone,
} from '../../utils/courierResolver';

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
  const [receiptStatus, setReceiptStatus] = useState<'UNCONFIRMED' | 'CONFIRMED' | 'REPORTED_NOT_RECEIVED'>('UNCONFIRMED');
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [showComplaintsModal, setShowComplaintsModal] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const canCancel =
    order.category === 'SENT' &&
    !['DELIVERED', 'COMPLETED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'RETURNED', 'RETURNING', 'CANCELLED', 'DELIVERING', 'OUT_FOR_DELIVERY'].includes(
      String(liveStatus).toUpperCase(),
    );

  const isDelivered =
    ['DELIVERED', 'COMPLETED', 'DELIVERY_SUCCESS'].includes(String(liveStatus).toUpperCase()) ||
    ['DELIVERED', 'COMPLETED', 'DELIVERY_SUCCESS'].includes(String(order.status).toUpperCase());

  const isReceiver = order.category === 'RECEIVED';

  const handleCancelOrder = () => {
    Alert.alert(
      'Xác nhận hủy đơn hàng',
      `Quý khách có chắc chắn muốn hủy đơn hàng #${order.code} không?\n\nKiện hàng chưa bàn giao cho bưu tá nên được hủy MIỄN PHÍ 100% (0 VNĐ).`,
      [
        { text: 'Giữ lại đơn', style: 'cancel' },
        {
          text: 'Xác nhận hủy đơn',
          style: 'destructive',
          onPress: async () => {
            const token = authStore.getAccessToken();
            if (!token) {
              Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn.');
              return;
            }
            setCancelling(true);
            try {
              await shipmentApi.cancelShipment(token, order.code, 'Khách hàng hủy trên chi tiết đơn');
              setLiveStatus('CANCELLED');
              Alert.alert('Đã hủy đơn hàng thành công', `Đơn hàng #${order.code} đã được hủy trên hệ thống.`);
            } catch (err: any) {
              Alert.alert('Không thể hủy đơn', err?.message || 'Có lỗi xảy ra khi hủy đơn.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

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

  useEffect(() => {
    let mounted = true;
    if (isReceiver && isDelivered) {
      ratingsApi
        .getRatingForShipment(order.code)
        .then((existing) => {
          if (mounted && existing) {
            setHasRated(true);
            setReceiptStatus('CONFIRMED');
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [order.code, isReceiver, isDelivered]);

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

  const courierResolution = resolveCourierContextForOrder({
    status: liveStatus,
    courierId: order.courierId || (order as any).metadata?.assignedCourier || (order as any).metadata?.courierId,
    courierName: (order as any).metadata?.courierName || (order as any).metadata?.deliveryCourierName,
    courierPhone: (order as any).metadata?.courierPhone || (order as any).metadata?.deliveryCourierPhone,
    pickupCourierId: (order as any).metadata?.pickupCourierId,
    deliveryCourierId: (order as any).metadata?.deliveryCourierId,
    currentTaskType: (order as any).metadata?.currentTaskType,
    senderHubCode: order.sender.hubCode,
    receiverHubCode: order.receiver.hubCode,
    currentHubCode: (order as any).metadata?.currentHubCode,
    timelineNotes: liveTimeline.map((t) => [t.noteText, t.title, t.actorText, t.boldPrefix, t.addressSuffix].filter(Boolean).join(' ')),
  });

  const courier = courierResolution.courier;
  const activeOrFallbackCourier = courier || resolveCourierForOrder({
    courierId: order.courierId || (order as any).metadata?.assignedCourier || (order as any).metadata?.courierId,
    courierName: (order as any).metadata?.courierName || (order as any).metadata?.deliveryCourierName,
    courierPhone: (order as any).metadata?.courierPhone || (order as any).metadata?.deliveryCourierPhone,
    receiverHubCode: order.receiver.hubCode,
  });

  const handleCallCourier = () => {
    const target = courier || activeOrFallbackCourier;
    Linking.openURL(`tel:${target.phone}`).catch(() => {
      Alert.alert('Thông tin bưu tá', `Bưu tá: ${target.name}\nSố điện thoại: ${target.phone}`);
    });
  };

  const handleCopyCourierPhone = () => {
    const target = courier || activeOrFallbackCourier;
    copyToClipboard(target.phone);
    Alert.alert('Đã sao chép', `Đã sao chép số điện thoại ${target.phone} vào bộ nhớ tạm.`);
  };

  const handleConfirmReceived = () => {
    if (!isDelivered) {
      Alert.alert(
        'Chưa thể xác nhận',
        'Kiện hàng đang trong hành trình vận chuyển. Bạn chỉ có thể xác nhận nhận hàng và đánh giá bưu tá sau khi đơn hàng được giao đến nơi.',
      );
      return;
    }
    Alert.alert(
      'Xác nhận nhận hàng',
      'Bạn xác nhận đã nhận được kiện hàng này nguyên vẹn từ bưu tá?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            setReceiptStatus('CONFIRMED');
            Alert.alert(
              'Xác nhận giao hàng thành công',
              'Cảm ơn bạn! Bạn có muốn dành ít giây để đánh giá thái độ bưu tá và dịch vụ giao hàng không?',
              [
                { text: 'Để sau', style: 'cancel' },
                {
                  text: 'Đánh giá dịch vụ',
                  onPress: () => setShowRatingModal(true),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleReportNotReceived = () => {
    Alert.alert(
      'Báo cáo chưa nhận hàng',
      'Bạn chưa nhận được kiện hàng này từ bưu tá? Bạn muốn gọi ngay cho bưu tá hay gửi yêu cầu kiểm tra tới bưu cục?',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: `Gọi bưu tá (${activeOrFallbackCourier.phone})`,
          onPress: handleCallCourier,
        },
        {
          text: 'Báo chưa nhận',
          style: 'destructive',
          onPress: () => {
            setReceiptStatus('REPORTED_NOT_RECEIVED');
            Alert.alert('Đã tiếp nhận', 'Nexus đã ghi nhận phản ánh của bạn. Bưu cục phát sẽ đối soát với shipper và phản hồi sớm nhất.');
          },
        },
      ]
    );
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

        {/* RECEIVER COD & DELIVERY NOTICE BANNER */}
        {order.category === 'RECEIVED' ? (
          <View style={styles.receiverNoticeCard}>
            <View style={styles.receiverNoticeHeader}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.receiverNoticeTitle}>THÔNG BÁO NHẬN HÀNG</Text>
            </View>
            <Text style={styles.receiverNoticeDesc}>
              {courierResolution.isDelivery
                ? 'Bưu phẩm đang được điều phối giao. Quý khách chỉ thanh toán số tiền COD bên dưới cho bưu tá khi nhận kiện:'
                : 'Đơn hàng đang trong quy trình gom lấy & trung chuyển. Quý khách vui lòng chuẩn bị số tiền COD dự kiến khi nhận kiện:'}
            </Text>
            <View style={styles.receiverNoticeAmountRow}>
              <Text style={styles.receiverNoticeAmountLabel}>Số tiền cần thanh toán (COD):</Text>
              <Text style={styles.receiverNoticeAmountVal}>
                {order.codAmountVnd > 0 ? formatVnd(order.codAmountVnd) : '0đ (Không thu tiền)'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* COURIER / TRANSIT INFO CARD */}
        {courierResolution.isInTransit ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>{courierResolution.cardTitle}</Text>
            </View>
            <View style={styles.inTransitCardContent}>
              <Text style={styles.inTransitDesc}>{courierResolution.statusDescription}</Text>
              <View style={styles.inTransitHubRow}>
                <Text style={styles.inTransitHubLabel}>Bưu cục kế tiếp: </Text>
                <Text style={styles.inTransitHubVal}>{courierResolution.hubLabel}</Text>
              </View>
            </View>
          </View>
        ) : courier ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={courierResolution.isPickup ? 'cube-outline' : 'bicycle-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>{courierResolution.cardTitle}</Text>
            </View>

            <View style={styles.courierCardContent}>
              <View style={styles.courierAvatarCircle}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={styles.courierInfoBlock}>
                <View style={styles.courierNameBadgeRow}>
                  <Text style={styles.courierNameText}>{courier.name}</Text>
                  <View
                    style={[
                      styles.activeShipperBadge,
                      {
                        backgroundColor: courierResolution.badgeBg,
                        borderColor: courierResolution.badgeBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activeShipperBadgeText,
                        { color: courierResolution.badgeTextColor },
                      ]}
                    >
                      {courierResolution.badgeLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.courierPhoneText}>SĐT: {formatCourierPhone(courier.phone)}</Text>
                <Text style={styles.courierHubText}>{courierResolution.hubLabel}</Text>
              </View>

              <View style={styles.courierActionsCol}>
                <TouchableOpacity
                  style={styles.callBtn}
                  activeOpacity={0.8}
                  onPress={handleCallCourier}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.callBtnText}>Gọi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.copyPhoneBtn}
                  activeOpacity={0.7}
                  onPress={handleCopyCourierPhone}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* RECEIPT CONFIRMATION & RATING SECTION (CHỈ DÀNH CHO NGƯỜI NHẬN SAU KHI GIAO HÀNG THÀNH CÔNG) */}
        {isReceiver ? (
          isDelivered ? (
            <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Ionicons
                name={
                  receiptStatus === 'CONFIRMED'
                    ? 'checkmark-circle'
                    : receiptStatus === 'REPORTED_NOT_RECEIVED'
                    ? 'alert-circle'
                    : 'help-circle-outline'
                }
                size={20}
                color={
                  receiptStatus === 'CONFIRMED'
                    ? '#059669'
                    : receiptStatus === 'REPORTED_NOT_RECEIVED'
                    ? '#DC2626'
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.receiptTitle,
                  receiptStatus === 'CONFIRMED' && { color: '#059669' },
                  receiptStatus === 'REPORTED_NOT_RECEIVED' && { color: '#DC2626' },
                ]}
              >
                {receiptStatus === 'CONFIRMED'
                  ? 'ĐÃ XÁC NHẬN NHẬN HÀNG'
                  : receiptStatus === 'REPORTED_NOT_RECEIVED'
                  ? 'BÁO CÁO: CHƯA NHẬN HÀNG'
                  : 'BẠN ĐÃ NHẬN ĐƯỢC HÀNG CHƯA?'}
              </Text>
            </View>

            {receiptStatus === 'CONFIRMED' ? (
              <View style={styles.confirmedBox}>
                <Text style={styles.confirmedText}>
                  Bạn đã xác nhận nhận hàng an toàn và nguyên vẹn. Cảm ơn bạn đã tin tưởng dịch vụ của Nexus Logistics!
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.receiptBtn, { backgroundColor: hasRated ? '#16A34A' : '#D97706', flex: 1 }]}
                    activeOpacity={0.8}
                    onPress={() => setShowRatingModal(true)}
                  >
                    <Ionicons name="star" size={16} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                      {hasRated ? 'Đã gửi đánh giá' : 'Đánh giá bưu tá'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.receiptBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', flex: 1 }]}
                    activeOpacity={0.8}
                    onPress={() => setShowComplaintsModal(true)}
                  >
                    <Ionicons name="shield-outline" size={16} color="#334155" />
                    <Text style={{ color: '#334155', fontWeight: '600', fontSize: 13 }}>
                      Khiếu nại / Bồi thường
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : receiptStatus === 'REPORTED_NOT_RECEIVED' ? (
              <View style={styles.reportedBox}>
                <Text style={styles.reportedText}>
                  Hệ thống đã ghi nhận phản ánh của bạn. Bưu cục đang kiểm tra lại với bưu tá {activeOrFallbackCourier.name}.
                </Text>
                <TouchableOpacity
                  style={styles.callShipperLink}
                  activeOpacity={0.8}
                  onPress={handleCallCourier}
                >
                  <Ionicons name="call-outline" size={14} color="#DC2626" />
                  <Text style={styles.callShipperLinkText}>
                    Bấm để gọi trực tiếp cho shipper ({formatCourierPhone(activeOrFallbackCourier.phone)})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.receiptBtn, { backgroundColor: '#DC2626', marginTop: 10, justifyContent: 'center' }]}
                  activeOpacity={0.8}
                  onPress={() => setShowComplaintsModal(true)}
                >
                  <Ionicons name="warning-outline" size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                    Tạo yêu cầu giải quyết khiếu nại CSKH
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.receiptActionContainer}>
                <Text style={styles.receiptPrompt}>
                  Xác nhận này giúp bảo vệ quyền lợi nhận hàng và làm căn cứ giải quyết nếu có sự cố:
                </Text>
                <View style={styles.receiptBtnRow}>
                  <TouchableOpacity
                    style={[styles.receiptBtn, styles.receiptBtnSuccess]}
                    activeOpacity={0.8}
                    onPress={handleConfirmReceived}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.receiptBtnSuccessText}>Tôi đã nhận hàng</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.receiptBtn, styles.receiptBtnDanger]}
                    activeOpacity={0.8}
                    onPress={handleReportNotReceived}
                  >
                    <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                    <Text style={styles.receiptBtnDangerText}>Chưa nhận được</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.receiptCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.receiptHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#64748B" />
              <Text style={[styles.receiptTitle, { color: '#475569' }]}>
                ĐANG VẬN CHUYỂN ĐẾN NGƯỜI NHẬN
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18, marginTop: 4 }}>
              Kiện hàng đang trong hành trình luân chuyển đến bạn. Bạn sẽ có thể xác nhận nhận hàng và đánh giá thái độ bưu tá ngay sau khi kiện hàng được giao thành công.
            </Text>
          </View>
        )) : null}

        {/* 4. ITEM & PACKAGE INFO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>
              {order.category === 'RECEIVED' ? 'Thông tin kiện hàng & Thanh toán' : 'Thông tin hàng hóa & Cước phí'}
            </Text>
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
            {order.category !== 'RECEIVED' ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Khai giá:</Text>
                <Text style={styles.infoVal}>{formatVnd(order.declaredValueVnd)}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tiền thu hộ (COD):</Text>
              <Text style={[styles.infoVal, { color: colors.primary }]}>
                {formatVnd(order.codAmountVnd)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cước vận chuyển:</Text>
              <Text style={styles.infoVal}>
                {order.category === 'RECEIVED' ? 'Người gửi đã thanh toán' : formatVnd(order.shippingFeeVnd)}
              </Text>
            </View>
            {order.category === 'RECEIVED' ? (
              <View style={styles.privacyNoticeBox}>
                <Text style={styles.privacyNoticeText}>
                  Bảo mật bưu chính: Biểu phí chi tiết và hợp đồng thương mại giữa Người gửi và hệ thống được bảo mật theo quy định.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* 5. CSKH SUPPORT & DISPUTE RESOLUTION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#0284C7" />
            <Text style={styles.cardTitle}>Hỗ trợ & Bảo hiểm Vận chuyển</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 12 }}>
            Kiện hàng được bảo hiểm theo Quy chuẩn Nexus Logistics. Bạn có thể giục phát, khiếu nại bể vỡ hoặc theo dõi hồ sơ đền bù bất cứ lúc nào.
          </Text>
          <TouchableOpacity
            style={[styles.receiptBtn, { backgroundColor: '#0284C7', justifyContent: 'center' }]}
            activeOpacity={0.8}
            onPress={() => setShowComplaintsModal(true)}
          >
            <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
              Khiếu nại bưu kiện
            </Text>
          </TouchableOpacity>
        </View>

        {/* 6. CANCEL ORDER (BEFORE COURIER HANDOVER) */}
        {canCancel ? (
          <View style={[styles.card, { borderColor: '#FECDD3', backgroundColor: '#FFF1F2' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="alert-circle-outline" size={18} color="#E11D48" />
              <Text style={[styles.cardTitle, { color: '#BE123C' }]}>Hủy đơn hàng</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#9F1239', lineHeight: 18, marginBottom: 12 }}>
              Đơn hàng chưa bàn giao cho bưu tá. Quý khách có thể hủy đơn miễn phí 100% (0 VNĐ) nếu có nhu cầu thay đổi thông tin hoặc hoãn gửi.
            </Text>
            <TouchableOpacity
              style={[styles.receiptBtn, { backgroundColor: '#E11D48', justifyContent: 'center' }]}
              activeOpacity={0.8}
              onPress={handleCancelOrder}
              disabled={cancelling}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                {cancelling ? 'Đang xử lý hủy đơn...' : 'Xác nhận hủy đơn hàng'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Courier Rating Modal */}
      <CourierRatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        shipmentCode={order.code}
        courierName={activeOrFallbackCourier.name}
        courierPhone={activeOrFallbackCourier.phone}
        customerPhone={order.receiver.phone}
        onRatingSubmitted={() => setHasRated(true)}
      />

      {/* Complaints Tracking & Creation Modal */}
      <CustomerComplaintsModal
        visible={showComplaintsModal}
        onClose={() => setShowComplaintsModal(false)}
        prefilledShipmentCode={order.code}
      />
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
  receiverNoticeCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    ...shadows.sm,
  },
  receiverNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  receiverNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  receiverNoticeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  receiverNoticeAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  receiverNoticeAmountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  receiverNoticeAmountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  privacyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  privacyNoticeText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 15,
  },
  inTransitCardContent: {
    paddingVertical: 4,
  },
  inTransitDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  inTransitHubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  inTransitHubLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  inTransitHubVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  courierCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courierAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  courierInfoBlock: {
    flex: 1,
  },
  courierNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  courierNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  activeShipperBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  activeShipperBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  courierPhoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  courierHubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  courierActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    ...shadows.sm,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  copyPhoneBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: '#F8FAFC',
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  confirmedBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: spacing.md,
  },
  confirmedText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
    fontWeight: '600',
  },
  reportedBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: spacing.md,
    gap: 6,
  },
  reportedText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
    fontWeight: '600',
  },
  callShipperLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  callShipperLinkText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  receiptActionContainer: {
    gap: 8,
  },
  receiptPrompt: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  receiptBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  receiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  receiptBtnSuccess: {
    backgroundColor: '#059669',
    ...shadows.sm,
  },
  receiptBtnSuccessText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  receiptBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  receiptBtnDangerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});

