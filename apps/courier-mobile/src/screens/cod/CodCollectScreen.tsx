import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useCollectCodMutation, useCompanyBankInfoQuery } from '../../features/cod/cod.queries';
import { canAccessCourierFeature } from '../../features/permissions/courier-permissions';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { resolveCourierId } from '../../utils/courier';
import { appEnv } from '../../utils/env';
import { createIdempotencyKey } from '../../utils/idempotency';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'CodCollect'>;

export function CodCollectScreen({ route, navigation }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const accessToken = session?.tokens.accessToken ?? null;
  const canCollectCod = canAccessCourierFeature(session?.user, 'scan.delivery-sign');

  const collectMutation = useCollectCodMutation(accessToken);
  const bankInfoQuery = useCompanyBankInfoQuery({ accessToken });

  const [paymentMethod, setPaymentMethod] = React.useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [collectedAmount, setCollectedAmount] = React.useState(
    route.params.codAmount ? String(route.params.codAmount) : '',
  );
  const [note, setNote] = React.useState('');

  const shipmentCode = route.params.shipmentCode ?? '';
  const transferMemo = shipmentCode ? `COD ${shipmentCode}` : 'COD';

  const handleSubmit = async () => {
    if (!canCollectCod) {
      Alert.alert('Không có quyền', 'Tài khoản hiện tại chưa được phân quyền thu COD.');
      return;
    }

    if (!shipmentCode) {
      Alert.alert('Lỗi', 'Thiếu mã vận đơn');
      return;
    }

    const parsedAmount = Number(collectedAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Lỗi', 'Số tiền thu không hợp lệ');
      return;
    }

    if (paymentMethod === 'BANK_TRANSFER') {
      Alert.alert(
        'Chờ xác nhận chuyển khoản',
        `Cho khách chuyển đúng nội dung "${transferMemo}". Hệ thống sẽ chờ SePay/ngân hàng xác nhận tiền vào công ty, không ghi nhận thu thủ công.`,
      );
      return;
    }

    try {
      await collectMutation.mutateAsync({
        shipmentCode,
        collectedAmount: parsedAmount,
        courierId: courierId ?? '',
        paymentMethod: 'COD',
        idempotencyKey: createIdempotencyKey('cod-collect'),
        occurredAt: new Date().toISOString(),
        note: note.trim() || undefined,
      });

      Alert.alert(
        'Thành công',
        `Đã xác nhận thu ${parsedAmount.toLocaleString('vi-VN')}đ cho đơn ${shipmentCode}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Lỗi',
        error instanceof Error ? error.message : 'Không thể xác nhận thu COD',
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Mã vận đơn</Text>
        <Text style={styles.infoValue}>{shipmentCode}</Text>
      </View>

      {/* Payment method toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Hình thức thanh toán</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.toggleButton,
              paymentMethod === 'COD' && styles.toggleButtonActive,
            ]}
            onPress={() => setPaymentMethod('COD')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                paymentMethod === 'COD' && styles.toggleButtonTextActive,
              ]}
            >
              💵 Tiền mặt
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              paymentMethod === 'BANK_TRANSFER' && styles.toggleButtonActive,
            ]}
            onPress={() => setPaymentMethod('BANK_TRANSFER')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                paymentMethod === 'BANK_TRANSFER' && styles.toggleButtonTextActive,
              ]}
            >
              🏦 Chuyển khoản
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Số tiền thu (VND)</Text>
        <TextInput
          style={styles.input}
          value={collectedAmount}
          onChangeText={setCollectedAmount}
          keyboardType="numeric"
          placeholder="Nhập số tiền"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Note */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Ghi chú (tùy chọn)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          placeholder="Ghi chú..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {paymentMethod === 'BANK_TRANSFER' ? (
        <View style={styles.hintCard}>
          <Text style={styles.hintText}>
            Khi chọn chuyển khoản, khách hàng chuyển thẳng vào tài khoản công ty.
            Tiền sẽ được ghi nhận sau khi SePay/ngân hàng xác nhận.
          </Text>
        </View>
      ) : null}

      {paymentMethod === 'BANK_TRANSFER' && bankInfoQuery.data ? (
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>QR chuyển khoản công ty</Text>
          <Image
            source={{
              uri: `https://img.vietqr.io/image/${bankInfoQuery.data.bin}-${bankInfoQuery.data.accountNumber}-compact2.png?amount=${Number(collectedAmount) || 0}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(bankInfoQuery.data.accountName)}`,
            }}
            style={styles.qrImage}
            resizeMode="contain"
          />
          <Text style={styles.qrLine}>STK: {bankInfoQuery.data.accountNumber}</Text>
          <Text style={styles.qrLine}>Chủ TK: {bankInfoQuery.data.accountName}</Text>
          <Text style={styles.qrMemo}>Nội dung: {transferMemo}</Text>
        </View>
      ) : null}

      {paymentMethod === 'BANK_TRANSFER' && bankInfoQuery.isError ? (
        <View style={styles.hintCard}>
          <Text style={styles.hintText}>
            Chưa tải được tài khoản công ty. Vui lòng thử lại trước khi cho khách chuyển khoản.
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[
          styles.submitButton,
          (!canCollectCod || collectMutation.isPending) && styles.submitButtonDisabled,
        ]}
        disabled={!canCollectCod || collectMutation.isPending}
        onPress={() => {
          void handleSubmit();
        }}
      >
        <Text style={styles.submitButtonText}>
          {collectMutation.isPending
            ? 'Đang xử lý...'
            : paymentMethod === 'BANK_TRANSFER'
              ? 'Chờ SePay xác nhận'
              : 'Xác nhận thu tiền'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  infoLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    ...theme.typography.title.md,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionLabel: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EFF6FF',
  },
  toggleButtonText: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hintCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: theme.spacing.md,
  },
  hintText: {
    ...theme.typography.body.sm,
    color: '#92400E',
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  qrTitle: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  qrImage: {
    width: 220,
    height: 260,
  },
  qrLine: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
  },
  qrMemo: {
    ...theme.typography.body.sm,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...theme.typography.subtitle.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
