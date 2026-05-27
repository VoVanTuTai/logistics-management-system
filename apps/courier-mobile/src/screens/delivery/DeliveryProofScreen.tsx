import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { enqueueCodCollectOffline } from '../../features/cod/cod.offline';
import type { CollectCodPayload } from '../../features/cod/cod.types';
import { enqueueDeliverySuccessOffline } from '../../features/delivery/delivery-success.offline';
import { useDeliverySuccessActionMutation } from '../../features/delivery/delivery-success.mutation';
import type { DeliverySuccessPayload } from '../../features/delivery/delivery.types';
import { useCompanyBankInfoQuery, useCollectCodMutation } from '../../features/cod/cod.queries';
import { useShipmentDetailQuery } from '../../features/shipment/shipment.queries';
import type { ShipmentMetadata } from '../../features/shipment/shipment.types';
import { tasksApi } from '../../features/tasks/tasks.api';
import { useTaskDetailQuery } from '../../features/tasks/tasks.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { ApiClientError, shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { createIdempotencyKey } from '../../utils/idempotency';
import { resolveCourierId, buildDeliverySuccessAuditNote } from '../../utils/courier';
import { appEnv } from '../../utils/env';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'DeliveryProof'>;

function shouldQueueCodCollectRetry(error: unknown): boolean {
  if (shouldQueueOffline(error)) {
    return true;
  }

  return error instanceof ApiClientError && error.status !== null && error.status >= 500;
}

function readMetadataPath(
  metadata: ShipmentMetadata | null,
  path: string,
): unknown {
  if (!metadata) {
    return null;
  }

  const keys = path.split('.');
  let current: unknown = metadata;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function readMetadataString(
  metadata: ShipmentMetadata | null,
  paths: string[],
): string | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export function DeliveryProofScreen({ navigation, route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const queryClient = useQueryClient();
  const mutation = useDeliverySuccessActionMutation(
    session?.tokens.accessToken ?? null,
  );
  const taskQuery = useTaskDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    taskId: route.params.taskId ?? '',
  });
  const resolvedShipmentCode = route.params.shipmentCode ?? taskQuery.data?.shipmentCode ?? null;
  const shipmentQuery = useShipmentDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    shipmentCode: resolvedShipmentCode,
  });
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView | null>(null);
  const [cameraVisible, setCameraVisible] = React.useState(false);
  const [capturing, setCapturing] = React.useState(false);
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'COD' | 'BANK_TRANSFER'>('COD');

  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const bankInfoQuery = useCompanyBankInfoQuery({ accessToken: session?.tokens.accessToken ?? null });
  const bankInfo = bankInfoQuery.data;
  const collectMutation = useCollectCodMutation(session?.tokens.accessToken ?? null);

  const codAmount = shipmentQuery.data?.codAmount ?? 0;
  const shipmentMetadata = shipmentQuery.data?.metadata ?? null;
  const receiverPhone =
    readMetadataString(shipmentMetadata, [
      'receiverPhone',
      'receiver.phone',
      'recipientPhone',
      'recipient.phone',
    ]) ?? 'N/A';
  const deliveryAddress =
    readMetadataString(shipmentMetadata, [
      'deliveryAddress',
      'receiverAddress',
      'recipientAddress',
      'receiver.address',
      'recipient.address',
      'address',
    ]) ?? 'N/A';

  // Financial calculations
  const shippingFee = (() => {
    const raw = readMetadataPath(shipmentMetadata, 'shippingFee');
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') { const n = Number(raw); return Number.isNaN(n) ? 0 : n; }
    return 0;
  })();
  const prepaidAmount = (() => {
    const raw = readMetadataPath(shipmentMetadata, 'prepaidAmount');
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') { const n = Number(raw); return Number.isNaN(n) ? 0 : n; }
    return 0;
  })();
  const totalAmountDue = codAmount + shippingFee - prepaidAmount;
  const hasAmountToPay = totalAmountDue > 0;
  const transferMemo = resolvedShipmentCode ? `COD ${resolvedShipmentCode}` : 'COD';

  const openCamera = React.useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để chụp ảnh giao hàng.');
        return;
      }
    }

    setCameraVisible(true);
  }, [permission?.granted, requestPermission]);

  const captureProof = React.useCallback(async () => {
    if (!cameraRef.current) {
      return;
    }

    setCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
      });

      if (!picture.uri) {
        throw new Error('Không chụp được ảnh.');
      }

      setPhotoUri(picture.uri);
      setCameraVisible(false);
      setSubmitMessage(null);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Không chụp được ảnh.');
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!resolvedShipmentCode) {
      setSubmitMessage('Không có mã shipment cho nhiệm vụ này.');
      return;
    }

    if (!photoUri) {
      setSubmitMessage('Cần chụp 1 ảnh chứng minh giao hàng trước khi ký nhận.');
      return;
    }

    if (hasAmountToPay && !paymentMethod) {
      setSubmitMessage('Vui lòng chọn phương thức thanh toán.');
      return;
    }

    const auditNote = buildDeliverySuccessAuditNote({
      displayName: session?.user.displayName,
      username: session?.user.username,
      courierId,
      hubCode: session?.user.hubCodes?.[0] ?? null,
      note: note.trim().length > 0 ? note.trim() : 'Ký nhận giao hàng.',
    });

    const payload: DeliverySuccessPayload = {
      shipmentCode: resolvedShipmentCode,
      taskId: route.params.taskId ?? null,
      courierId,
      locationCode: null,
      actor: session?.user.username ?? null,
      note: auditNote,
      occurredAt: new Date().toISOString(),
      idempotencyKey: createIdempotencyKey('delivery-success'),
      podImageUrl: photoUri,
      podNote: auditNote,
      podCapturedBy: session?.user.username ?? null,
      otpCode: null,
    };

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const result = await mutation.mutateAsync(payload);
      let codWarningMessage: string | null = null;
      const codCollectPayload: CollectCodPayload = {
        shipmentCode: resolvedShipmentCode,
        collectedAmount: codAmount,
        courierId: courierId ?? '',
        paymentMethod: 'COD',
        idempotencyKey: createIdempotencyKey('cod-collect-' + resolvedShipmentCode),
        occurredAt: new Date().toISOString(),
        note: 'Thu COD tiền mặt lúc ký nhận phát hàng',
      };

      if (codAmount > 0 && paymentMethod === 'COD') {
        try {
          await collectMutation.mutateAsync(codCollectPayload);
        } catch (codErr) {
          const errorMessage =
            codErr instanceof Error ? codErr.message : 'Lỗi không xác định';
          codWarningMessage =
            'Giao hàng thành công nhưng chưa ghi nhận được COD tiền mặt: ' +
            errorMessage;

          console.warn('[DeliveryProof] COD collect failed after delivery success', {
            shipmentCode: resolvedShipmentCode,
            error: codErr,
          });

          if (shouldQueueCodCollectRetry(codErr)) {
            await enqueueCodCollectOffline(codCollectPayload);
            codWarningMessage += ' App đã đưa COD vào hàng đợi retry.';
          } else {
            codWarningMessage += ' Cần kiểm tra COD record trên payment-service.';
          }

          Alert.alert('Cảnh báo COD', codWarningMessage);
        }
      }

      const taskId = route.params.taskId ?? null;
      const accessToken = session?.tokens.accessToken ?? null;
      let taskStatusUpdated = false;

      if (taskId && accessToken) {
        try {
          await tasksApi.updateTaskStatus(accessToken, taskId, 'COMPLETED');
          taskStatusUpdated = true;
        } catch {
          taskStatusUpdated = false;
        }
      }

      const successMessage =
        result.source === 'DUPLICATE_REPLAY'
          ? 'Server đã trả lại kết quả cũ cho idempotencyKey trùng lặp.'
          : taskStatusUpdated
            ? '✓ Ký nhận thành công. Task đã chuyển COMPLETED.'
            : '✓ Ký nhận thành công. Trạng thái đơn đã được cập nhật.';
      const paymentMessage =
        codAmount > 0 && paymentMethod === 'BANK_TRANSFER'
          ? `Khách chuyển khoản theo nội dung "${transferMemo}". COD sẽ chờ SePay/ngân hàng xác nhận tiền vào công ty.`
          : null;

      setSubmitMessage(
        [successMessage, paymentMessage, codWarningMessage].filter(Boolean).join(' '),
      );

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (route.params.taskId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', 'detail', route.params.taskId],
        });
      }
      if (resolvedShipmentCode) {
        await queryClient.invalidateQueries({
          queryKey: ['shipment', 'detail', resolvedShipmentCode],
        });
      }

      if (!codWarningMessage) {
        setTimeout(() => {
          navigation.goBack();
        }, 600);
      }
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueDeliverySuccessOffline(payload);
        setSubmitMessage('Mất mạng: thao tác đã được lưu offline và sẽ tự động upload POD, gửi lại với cùng idempotencyKey.');
      } else {
        const message =
          error instanceof Error ? error.message : 'Ký nhận thất bại.';
        setSubmitMessage(message);
        setGlobalError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    codAmount,
    collectMutation,
    courierId,
    hasAmountToPay,
    mutation,
    navigation,
    note,
    paymentMethod,
    photoUri,
    queryClient,
    resolvedShipmentCode,
    route.params.taskId,
    session?.tokens.accessToken,
    session?.user.displayName,
    session?.user.hubCodes,
    session?.user.username,
    setGlobalError,
    transferMemo,
  ]);

  return (
    <Screen scroll={false}>
      <View style={styles.layout}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <Text style={styles.sectionTitle}>Xác nhận ký nhận</Text>
            <Text style={styles.sectionHint}>
              Cần chụp 1 tấm hình chứng minh giao hàng trước khi gửi lên hệ thống.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Task code</Text>
              <Text style={styles.infoValue}>
                {route.params.taskCode ?? taskQuery.data?.taskCode ?? 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shipment</Text>
              <Text style={styles.infoValue}>{resolvedShipmentCode ?? 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{receiverPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Địa chỉ giao</Text>
              <Text style={styles.infoValue}>{deliveryAddress}</Text>
            </View>
            {shipmentQuery.isLoading ? (
              <View style={styles.inlineStateRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.inlineStateText}>Đang tải thông tin đơn hàng...</Text>
              </View>
            ) : null}
          </Card>

          {codAmount > 0 ? (
            <Card style={styles.financialCard}>
              <Text style={styles.sectionTitle}>💰 Tổng tiền phải thu</Text>
              <Text style={styles.sectionHint}>
                Đơn hàng có thu hộ. Vui lòng thu đủ tiền trước khi ký nhận.
              </Text>

              {/* Financial breakdown */}
              <View style={styles.financialBreakdown}>
                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>Tiền thu hộ (COD)</Text>
                  <Text style={styles.finValue}>{codAmount.toLocaleString('vi-VN')}đ</Text>
                </View>
                {shippingFee > 0 ? (
                  <View style={styles.finRow}>
                    <Text style={styles.finLabel}>Phí vận chuyển</Text>
                    <Text style={styles.finValue}>{shippingFee.toLocaleString('vi-VN')}đ</Text>
                  </View>
                ) : null}
                {prepaidAmount > 0 ? (
                  <View style={styles.finRow}>
                    <Text style={styles.finLabel}>Đã trả trước</Text>
                    <Text style={[styles.finValue, { color: '#059669' }]}>-{prepaidAmount.toLocaleString('vi-VN')}đ</Text>
                  </View>
                ) : null}
                <View style={styles.finTotalRow}>
                  <Text style={styles.finTotalLabel}>TỔNG PHẢI THU</Text>
                  <Text style={styles.finTotalValue}>{totalAmountDue.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>

              {/* Payment method toggle */}
              <Text style={[styles.sectionHint, { marginTop: 12, marginBottom: 4 }]}>Phương thức thanh toán:</Text>
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
                    🏦 Chuyển khoản QR
                  </Text>
                </Pressable>
              </View>

              {/* Cash confirmation */}
              {paymentMethod === 'COD' ? (
                <View style={styles.cashConfirmBox}>
                  <Ionicons name="cash-outline" size={20} color="#059669" />
                  <Text style={styles.cashConfirmText}>
                    Xác nhận đã thu đủ {totalAmountDue.toLocaleString('vi-VN')}đ tiền mặt từ người nhận.
                  </Text>
                </View>
              ) : null}

              {/* QR code */}
              {paymentMethod === 'BANK_TRANSFER' && bankInfo ? (
                <View style={styles.qrContainer}>
                  <Text style={styles.qrHint}>Cho khách hàng quét QR và chuyển đúng nội dung</Text>
                  <Image
                    source={{
                      uri: `https://img.vietqr.io/image/${bankInfo.bin}-${bankInfo.accountNumber}-compact2.png?amount=${totalAmountDue}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(bankInfo.accountName)}`,
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <View style={styles.bankDetailBox}>
                    <Text style={styles.bankDetailText}>Ngân hàng: {bankInfo.bankName ?? bankInfo.bin}</Text>
                    <Text style={styles.bankDetailText}>STK: {bankInfo.accountNumber}</Text>
                    <Text style={styles.bankDetailText}>Chủ TK: {bankInfo.accountName}</Text>
                    <Text style={styles.bankDetailMemoText}>Nội dung: {transferMemo}</Text>
                    <Text style={[styles.bankDetailText, { fontWeight: '700', color: '#B91C1C' }]}>
                      Số tiền: {totalAmountDue.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                  <View style={styles.bankPendingBox}>
                    <Ionicons name="time-outline" size={18} color="#1D4ED8" />
                    <Text style={styles.bankPendingText}>
                      Không ghi nhận đã nộp tại bước này. Payment-service sẽ chờ webhook SePay/ngân hàng xác nhận tiền vào công ty.
                    </Text>
                  </View>
                </View>
              ) : null}
              {paymentMethod === 'BANK_TRANSFER' && bankInfoQuery.isLoading ? (
                <View style={styles.inlineStateRow}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.inlineStateText}>Đang tải tài khoản công ty...</Text>
                </View>
              ) : null}
              {paymentMethod === 'BANK_TRANSFER' && bankInfoQuery.isError ? (
                <View style={styles.cashConfirmBox}>
                  <Ionicons name="warning-outline" size={20} color="#B45309" />
                  <Text style={styles.cashConfirmText}>
                    Chưa tải được tài khoản công ty. Vui lòng thử lại trước khi cho khách chuyển khoản.
                  </Text>
                </View>
              ) : null}
            </Card>
          ) : null}

          <Card>
            <Text style={styles.sectionTitle}>Ảnh chứng minh giao hàng</Text>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image-outline" size={30} color={theme.colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>Chưa có ảnh giao hàng</Text>
              </View>
            )}

            <View style={styles.photoActionsRow}>
              <Pressable onPress={() => void openCamera()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  {photoUri ? 'Chụp lại ảnh' : 'Chụp ảnh chứng minh'}
                </Text>
              </Pressable>
              {photoUri ? (
                <Pressable
                  onPress={() => setPhotoUri(null)}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Xóa ảnh</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Ghi chú giao hàng</Text>
            <TextInput
              placeholder="Nhập ghi chú bổ sung (nếu cần)"
              placeholderTextColor="#94A3B8"
              style={styles.noteInput}
              multiline
              value={note}
              onChangeText={setNote}
            />
          </Card>

          {submitMessage ? (
            <Card
              style={[
                styles.messageCard,
                isSubmitting ? styles.messageCardNeutral : styles.messageCardResult,
              ]}
            >
              <Text style={styles.messageText}>{submitMessage}</Text>
            </Card>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {hasAmountToPay
                  ? paymentMethod === 'BANK_TRANSFER'
                    ? 'Xác nhận ký nhận - chờ SePay'
                    : `Xác nhận ký nhận - Thu ${totalAmountDue.toLocaleString('vi-VN')}đ`
                  : 'Xác nhận ký nhận giao hàng'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <Modal
        visible={cameraVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraCard}>
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraTitle}>Chụp ảnh minh chứng</Text>
              <Pressable onPress={() => setCameraVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
            ) : (
              <View style={styles.permissionFallback}>
                <Text style={styles.permissionText}>
                  Chưa có quyền camera. Vui lòng cấp quyền để tiếp tục.
                </Text>
                <Pressable
                  onPress={() => {
                    void requestPermission();
                  }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cấp quyền</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.cameraActionRow}>
              <Pressable
                onPress={() => setCameraVisible(false)}
                style={styles.cameraSecondaryButton}
              >
                <Text style={styles.cameraSecondaryButtonText}>Đóng</Text>
              </Pressable>
              <Pressable
                disabled={!permission?.granted || capturing}
                onPress={() => {
                  void captureProof();
                }}
                style={[
                  styles.cameraPrimaryButton,
                  (!permission?.granted || capturing) && styles.submitButtonDisabled,
                ]}
              >
                {capturing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.cameraPrimaryButtonText}>Chụp</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 110,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  sectionHint: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    flex: 1,
  },
  infoValue: {
    ...theme.typography.body.sm,
    color: theme.colors.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  inlineStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  inlineStateText: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  photoPreview: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius.md,
    backgroundColor: '#E2E8F0',
  },
  photoPlaceholder: {
    height: 170,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#F8FAFC',
  },
  photoPlaceholderText: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  photoActionsRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    ...theme.typography.body.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  clearButton: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
  },
  clearButtonText: {
    ...theme.typography.body.sm,
    color: '#B91C1C',
    fontWeight: '600',
  },
  noteInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  messageCard: {
    borderWidth: 1,
  },
  messageCardNeutral: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  messageCardResult: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  messageText: {
    ...theme.typography.body.md,
    color: '#166534',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EFF6FF',
  },
  toggleButtonText: {
    ...theme.typography.body.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: theme.colors.primary,
  },
  codAmountText: {
    ...theme.typography.subtitle.md,
    color: theme.colors.danger,
    fontWeight: '700',
  },
  financialCard: {
    borderWidth: 1.5,
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
  },
  financialBreakdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  finLabel: {
    ...theme.typography.body.sm,
    color: theme.colors.textSecondary,
  },
  finValue: {
    ...theme.typography.body.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  finTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
  },
  finTotalLabel: {
    ...theme.typography.body.sm,
    color: '#991B1B',
    fontWeight: '800',
  },
  finTotalValue: {
    ...theme.typography.subtitle.md,
    color: '#B91C1C',
    fontWeight: '800',
  },
  cashConfirmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  cashConfirmText: {
    ...theme.typography.body.sm,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  bankDetailBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  bankDetailText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
  },
  bankDetailMemoText: {
    ...theme.typography.body.sm,
    color: '#1D4ED8',
    fontWeight: '800',
  },
  bankPendingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bankPendingText: {
    ...theme.typography.caption.md,
    color: '#1E3A8A',
    flex: 1,
  },
  qrContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrHint: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  qrImage: {
    width: 220,
    height: 260,
  },
  footer: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    ...theme.typography.body.lg,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  cameraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraTitle: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
  },
  cameraPreview: {
    height: 360,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  permissionFallback: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  permissionText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  cameraActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  cameraSecondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  cameraSecondaryButtonText: {
    ...theme.typography.body.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  cameraPrimaryButton: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  cameraPrimaryButtonText: {
    ...theme.typography.body.sm,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
