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
import { enqueueDeliverySuccessOffline } from '../../features/delivery/delivery-success.offline';
import { useDeliverySuccessActionMutation } from '../../features/delivery/delivery-success.mutation';
import type { DeliverySuccessPayload } from '../../features/delivery/delivery.types';
import { useShipmentDetailQuery } from '../../features/shipment/shipment.queries';
import type { ShipmentMetadata } from '../../features/shipment/shipment.types';
import { tasksApi } from '../../features/tasks/tasks.api';
import { useTaskDetailQuery } from '../../features/tasks/tasks.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'DeliveryProof'>;

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

  const shipmentMetadata = shipmentQuery.data?.metadata ?? null;
  const receiverName =
    readMetadataString(shipmentMetadata, ['receiverName', 'receiver.name']) ?? 'N/A';
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

  const openCamera = React.useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Can quyen camera', 'Vui long cap quyen camera de chup anh giao hang.');
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
        throw new Error('Khong chup duoc anh.');
      }

      setPhotoUri(picture.uri);
      setCameraVisible(false);
      setSubmitMessage(null);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Khong chup duoc anh.');
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!resolvedShipmentCode) {
      setSubmitMessage('Khong co ma shipment cho nhiem vu nay.');
      return;
    }

    if (!photoUri) {
      setSubmitMessage('Can chup 1 anh chung minh giao hang truoc khi ky nhan.');
      return;
    }

    const payload: DeliverySuccessPayload = {
      shipmentCode: resolvedShipmentCode,
      taskId: route.params.taskId ?? null,
      courierId: null,
      locationCode: null,
      actor: session?.user.username ?? null,
      note: note.trim().length > 0 ? note.trim() : 'Ky nhan giao hang tu courier app.',
      occurredAt: new Date().toISOString(),
      idempotencyKey: createIdempotencyKey('delivery-success'),
      podImageUrl: photoUri,
      podNote: note.trim().length > 0 ? note.trim() : null,
      podCapturedBy: session?.user.username ?? null,
      otpCode: null,
    };

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const result = await mutation.mutateAsync(payload);
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

      setSubmitMessage(
        result.source === 'DUPLICATE_REPLAY'
          ? 'Server da tra lai ket qua cu cho idempotencyKey trung lap.'
          : taskStatusUpdated
            ? 'Ky nhan thanh cong. Task da chuyen COMPLETED.'
            : 'Ky nhan thanh cong. Trang thai don da duoc cap nhat.',
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

      setTimeout(() => {
        navigation.goBack();
      }, 600);
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueDeliverySuccessOffline(payload);
        setSubmitMessage('Mat mang: thao tac da duoc luu offline va se tu dong dong bo.');
      } else {
        const message =
          error instanceof Error ? error.message : 'Ky nhan that bai.';
        setSubmitMessage(message);
        setGlobalError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mutation,
    navigation,
    note,
    photoUri,
    queryClient,
    resolvedShipmentCode,
    route.params.taskId,
    session?.tokens.accessToken,
    session?.user.username,
    setGlobalError,
  ]);

  return (
    <Screen scroll={false}>
      <View style={styles.layout}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <Text style={styles.sectionTitle}>Xac nhan ky nhan</Text>
            <Text style={styles.sectionHint}>
              Can chup 1 tam hinh chung minh giao hang truoc khi gui len he thong.
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
              <Text style={styles.infoLabel}>Nguoi nhan</Text>
              <Text style={styles.infoValue}>{receiverName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>So dien thoai</Text>
              <Text style={styles.infoValue}>{receiverPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Địa chỉ giao</Text>
              <Text style={styles.infoValue}>{deliveryAddress}</Text>
            </View>
            {shipmentQuery.isLoading ? (
              <View style={styles.inlineStateRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.inlineStateText}>Dang tai thong tin don hang...</Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Anh chung minh</Text>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image-outline" size={30} color={theme.colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>Chua co anh giao hang</Text>
              </View>
            )}

            <View style={styles.photoActionsRow}>
              <Pressable onPress={() => void openCamera()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  {photoUri ? 'Chup lai anh' : 'Chup anh chung minh'}
                </Text>
              </Pressable>
              {photoUri ? (
                <Pressable
                  onPress={() => setPhotoUri(null)}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Xoa anh</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Ghi chu giao hang</Text>
            <TextInput
              placeholder="Nhap ghi chu bo sung (neu can)"
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
              <Text style={styles.submitButtonText}>Xac nhan ky nhan</Text>
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
              <Text style={styles.cameraTitle}>Chup anh minh chung</Text>
              <Pressable onPress={() => setCameraVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
            ) : (
              <View style={styles.permissionFallback}>
                <Text style={styles.permissionText}>
                  Chua co quyen camera. Vui long cap quyen de tiep tuc.
                </Text>
                <Pressable
                  onPress={() => {
                    void requestPermission();
                  }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cap quyen</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.cameraActionRow}>
              <Pressable
                onPress={() => setCameraVisible(false)}
                style={styles.cameraSecondaryButton}
              >
                <Text style={styles.cameraSecondaryButtonText}>Dong</Text>
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
                  <Text style={styles.cameraPrimaryButtonText}>Chup</Text>
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
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  messageCardResult: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  messageText: {
    ...theme.typography.body.md,
    color: '#166534',
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

