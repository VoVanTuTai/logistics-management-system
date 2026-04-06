import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useShipmentDetailQuery } from '../../features/shipment/shipment.queries';
import type { ShipmentMetadata } from '../../features/shipment/shipment.types';
import { useTaskDetailQuery } from '../../features/tasks/tasks.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'TaskDetail'>;

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('vi-VN');
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

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function TaskDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const taskQuery = useTaskDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    taskId: route.params.taskId,
  });
  const [callOptionsVisible, setCallOptionsVisible] = React.useState(false);

  const task = taskQuery.data;
  const shipmentQuery = useShipmentDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    shipmentCode: task?.shipmentCode ?? null,
  });
  const shipmentMetadata = shipmentQuery.data?.metadata ?? null;
  const senderName =
    readMetadataString(shipmentMetadata, ['senderName', 'sender.name']) ?? 'N/A';
  const senderPhone =
    readMetadataString(shipmentMetadata, [
      'senderPhone',
      'sender.phone',
      'shipperPhone',
    ]) ?? null;
  const receiverName =
    readMetadataString(shipmentMetadata, ['receiverName', 'receiver.name']) ?? 'N/A';
  const receiverPhone =
    readMetadataString(shipmentMetadata, [
      'receiverPhone',
      'receiver.phone',
      'recipientPhone',
      'recipient.phone',
    ]) ?? null;
  const deliveryAddress =
    readMetadataString(shipmentMetadata, [
      'deliveryAddress',
      'receiverAddress',
      'recipientAddress',
      'receiver.address',
      'recipient.address',
      'address',
    ]) ?? 'N/A';
  const shipmentNote =
    readMetadataString(shipmentMetadata, ['note', 'shipmentNote']) ?? 'N/A';

  const handleReloadStatus = React.useCallback(async () => {
    const requests: Array<Promise<unknown>> = [taskQuery.refetch()];

    if (task?.shipmentCode) {
      requests.push(shipmentQuery.refetch());
    }

    await Promise.all(requests);
  }, [shipmentQuery, task?.shipmentCode, taskQuery]);

  const handleContactAction = React.useCallback(
    async (kind: 'call' | 'sms', rawPhone: string | null) => {
      setCallOptionsVisible(false);

      if (!rawPhone) {
        Alert.alert('Khong co so dien thoai', 'Don hang chua co thong tin so lien he.');
        return;
      }

      const phone = normalizePhone(rawPhone);
      const targetUrl = kind === 'sms' ? `sms:${phone}` : `tel:${phone}`;

      try {
        const supported = await Linking.canOpenURL(targetUrl);
        if (!supported) {
          Alert.alert('Khong mo duoc ung dung', `Khong the xu ly: ${targetUrl}`);
          return;
        }

        await Linking.openURL(targetUrl);
      } catch (error) {
        Alert.alert(
          'Thao tac that bai',
          error instanceof Error ? error.message : 'Khong the mo lien ket goi dien.',
        );
      }
    },
    [],
  );

  if (taskQuery.isLoading) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.centeredText}>Dang tai chi tiet nhiem vu...</Text>
        </View>
      </Screen>
    );
  }

  if (taskQuery.isError) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {taskQuery.error instanceof Error
              ? taskQuery.error.message
              : 'Tai chi tiet nhiem vu that bai.'}
          </Text>
          <Pressable onPress={() => void taskQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Thu lai</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Khong tim thay nhiem vu.</Text>
        </View>
      </Screen>
    );
  }

  const hasShipmentCode = Boolean(task.shipmentCode);
  const isReloadingStatus = taskQuery.isRefetching || shipmentQuery.isRefetching;

  return (
    <Screen scroll={false}>
      <View style={styles.layout}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Text style={styles.taskCode}>{task.taskCode}</Text>
              <Pressable
                onPress={() => {
                  void handleReloadStatus();
                }}
                disabled={isReloadingStatus}
                style={[styles.reloadButton, isReloadingStatus && styles.reloadButtonDisabled]}
              >
                {isReloadingStatus ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name="refresh-outline" size={14} color={theme.colors.primary} />
                )}
                <Text style={styles.reloadButtonText}>
                  {isReloadingStatus ? 'Reloading...' : 'Reload'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.heroMetaRow}>
              <StatusBadge label={task.status} variant="info" />
              <StatusBadge label={task.taskType} variant="neutral" />
            </View>
            <Text style={styles.shipmentText}>
              Ma don: {task.shipmentCode ?? 'N/A'}
            </Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Thong tin nhiem vu</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ma nhiem vu</Text>
              <Text style={styles.infoValue}>{task.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup request</Text>
              <Text style={styles.infoValue}>{task.pickupRequestId ?? 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>So lan phan cong</Text>
              <Text style={styles.infoValue}>{String(task.assignments.length)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tao luc</Text>
              <Text style={styles.infoValue}>{formatDateTime(task.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cap nhat luc</Text>
              <Text style={styles.infoValue}>{formatDateTime(task.updatedAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chu nhiem vu</Text>
              <Text style={styles.infoValue}>{task.note ?? 'N/A'}</Text>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Thong tin don hang</Text>
            {shipmentQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Dang tai thong tin don hang...</Text>
              </View>
            ) : null}

            {shipmentQuery.isError ? (
              <Text style={styles.errorInlineText}>
                {shipmentQuery.error instanceof Error
                  ? shipmentQuery.error.message
                  : 'Khong tai duoc thong tin don hang.'}
              </Text>
            ) : null}

            {!shipmentQuery.isLoading && !shipmentQuery.isError ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Trang thai don</Text>
                  <Text style={styles.infoValue}>
                    {shipmentQuery.data?.currentStatus ?? 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nguoi gui</Text>
                  <Text style={styles.infoValue}>{senderName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>So dien thoai gui</Text>
                  <Text style={styles.infoValue}>{senderPhone ?? 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nguoi nhan</Text>
                  <Text style={styles.infoValue}>{receiverName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>So dien thoai nhan</Text>
                  <Text style={styles.infoValue}>{receiverPhone ?? 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dia chi giao</Text>
                  <Text style={styles.infoValue}>{deliveryAddress}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ghi chu don</Text>
                  <Text style={styles.infoValue}>{shipmentNote}</Text>
                </View>
              </>
            ) : null}
          </Card>
        </ScrollView>

        <View style={styles.bottomActionBar}>
          <Pressable
            onPress={() => setCallOptionsVisible(true)}
            style={[styles.actionButton, styles.callActionButton]}
          >
            <Ionicons name="call-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Goi</Text>
          </Pressable>

          <Pressable
            disabled={!hasShipmentCode}
            onPress={() =>
              navigation.navigate('DeliveryProof', {
                taskId: task.id,
                taskCode: task.taskCode,
                shipmentCode: task.shipmentCode ?? undefined,
              })
            }
            style={[
              styles.actionButton,
              styles.midActionButton,
              !hasShipmentCode && styles.actionButtonDisabled,
            ]}
          >
            <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Ky nhan</Text>
          </Pressable>

          <Pressable
            disabled={!hasShipmentCode}
            onPress={() =>
              navigation.navigate('TaskIssue', {
                taskId: task.id,
                taskCode: task.taskCode,
                shipmentCode: task.shipmentCode ?? undefined,
              })
            }
            style={[
              styles.actionButton,
              styles.issueActionButton,
              !hasShipmentCode && styles.actionButtonDisabled,
            ]}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Van de</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={callOptionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCallOptionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCallOptionsVisible(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thao tac lien he</Text>
            <Pressable
              onPress={() => {
                void handleContactAction('call', receiverPhone);
              }}
              style={styles.modalAction}
            >
              <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.modalActionText}>Goi nguoi nhan</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void handleContactAction('call', senderPhone);
              }}
              style={styles.modalAction}
            >
              <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.modalActionText}>Goi nguoi gui</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void handleContactAction('sms', receiverPhone);
              }}
              style={styles.modalAction}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.modalActionText}>Nhan tin nguoi nhan</Text>
            </Pressable>
            <Pressable
              onPress={() => setCallOptionsVisible(false)}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelText}>Dong</Text>
            </Pressable>
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
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  centeredText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
  },
  heroCard: {
    backgroundColor: '#EDF4FF',
    borderColor: '#CDE0FF',
    gap: theme.spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  taskCode: {
    ...theme.typography.title.lg,
    color: theme.colors.primary,
    flex: 1,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#BFD6FF',
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    minWidth: 92,
    justifyContent: 'center',
  },
  reloadButtonDisabled: {
    opacity: 0.7,
  },
  reloadButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  shipmentText: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  bottomActionBar: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...theme.shadow.md,
  },
  actionButtonText: {
    ...theme.typography.caption.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  callActionButton: {
    backgroundColor: '#1D4ED8',
  },
  midActionButton: {
    backgroundColor: '#0F766E',
  },
  issueActionButton: {
    backgroundColor: '#B45309',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
  },
  errorInlineText: {
    ...theme.typography.caption.md,
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  modalAction: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  modalActionText: {
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  modalCancel: {
    marginTop: theme.spacing.xs,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});
