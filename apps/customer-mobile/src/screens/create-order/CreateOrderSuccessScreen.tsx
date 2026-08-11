import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { shipmentApi } from '../../services/api/shipment.api';
import { authStore } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';
import type { OrderModel, ShipmentStatus } from '../../types';
import { copyToClipboard } from '../../utils/clipboard';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOrderSuccess'>;

export function CreateOrderSuccessScreen({ route, navigation }: Props): React.JSX.Element {
  const { orderCode } = route.params;
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleViewOrder = async () => {
    const accessToken = authStore.getAccessToken();
    if (!accessToken) {
      navigation.replace('MainTabs', { screen: 'OrdersTab' });
      return;
    }

    setLoadingDetail(true);
    try {
      const shipment = await shipmentApi.getShipmentByCode(accessToken, orderCode);
      const meta = (shipment.metadata as Record<string, any>) || {};
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

      const orderModel: OrderModel = {
        id: shipment.id,
        code: shipment.code,
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
        },
        receiver: {
          name: receiver.name || 'Người nhận',
          phone: receiver.phone || '',
          addressDetail: receiverAddressComposed,
          composedAddress: receiverAddressComposed,
          ward: receiver.ward,
          district: receiver.district,
          province: receiver.province,
        },
        itemName: pkg.itemName || pkg.itemType || 'Hàng hóa bưu gửi',
        weightKg: Number(pkg.weightKg) || 0.5,
        declaredValueVnd: Number(pkg.declaredValue) || 0,
        codAmountVnd: Number(meta.codAmount || pkg.codAmount) || 0,
        shippingFeeVnd: Number(meta.estimatedFee || meta.shippingFee || meta.pricing?.totalFee) || 22000,
        status: (shipment.currentStatus as ShipmentStatus) || 'CREATED',
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
        timeline: [],
      };

      navigation.replace('OrderDetail', { order: orderModel });
    } catch {
      navigation.replace('MainTabs', { screen: 'OrdersTab' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGoHome = () => {
    navigation.replace('MainTabs', { screen: 'HomeTab' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>

        <Text style={styles.title}>Tạo đơn hàng thành công!</Text>
        <Text style={styles.subtitle}>Đơn hàng của quý khách đã được ghi nhận vào hệ thống NEXUS Express.</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.codeBox}
          onPress={() => copyToClipboard(orderCode, 'mã vận đơn')}
        >
          <Text style={styles.codeLabel}>Mã vận đơn:</Text>
          <View style={styles.codeValRow}>
            <Text style={styles.codeVal}>{orderCode}</Text>
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.copyHint}>Bấm vào đây để sao chép mã đơn</Text>
        </TouchableOpacity>

        <View style={styles.btnStack}>
          <PrimaryButton
            title="Xem chi tiết đơn hàng"
            onPress={handleViewOrder}
            loading={loadingDetail}
            size="lg"
          />

          <PrimaryButton
            title="Về trang chủ"
            onPress={handleGoHome}
            variant="outline"
            size="lg"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.md,
  },
  checkCircle: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  codeBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.15)',
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  codeValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  copyHint: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  btnStack: {
    width: '100%',
    gap: spacing.md,
  },
});
