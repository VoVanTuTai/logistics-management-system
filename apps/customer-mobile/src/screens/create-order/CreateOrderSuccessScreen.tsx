import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { shipmentApi } from '../../services/api/shipment.api';
import { authStore } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';
import type { OrderModel, ShipmentStatus } from '../../types';

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

      const orderModel: OrderModel = {
        id: shipment.id,
        code: shipment.code,
        category: 'SENT',
        orderType: 'REGULAR',
        sender: {
          name: sender.name || 'Người gửi',
          phone: sender.phone || '',
          addressDetail: sender.addressDetail || sender.province || '',
        },
        receiver: {
          name: receiver.name || 'Người nhận',
          phone: receiver.phone || '',
          addressDetail: receiver.addressDetail || receiver.province || '',
        },
        itemName: pkg.itemName || 'Hàng hóa bưu gửi',
        weightKg: Number(pkg.weightKg) || 0.5,
        declaredValueVnd: Number(pkg.declaredValue) || 0,
        codAmountVnd: Number(meta.codAmount || pkg.codAmount) || 0,
        shippingFeeVnd: Number(meta.shippingFee || meta.service?.fee) || 22000,
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

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Mã vận đơn:</Text>
          <Text style={styles.codeVal}>{orderCode}</Text>
        </View>

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
  codeVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  btnStack: {
    width: '100%',
    gap: spacing.md,
  },
});
