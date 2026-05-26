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
import { canAccessCourierFeature } from '../../features/permissions/courier-permissions';
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

function toShipmentStatusLabelVi(status: string | null | undefined): string {
  if (!status) {
    return 'N/A';
  }

  const labels: Record<string, string> = {
    CANCELLED: 'Đã hủy',
    CREATED: 'Mới tạo',
    DELIVERED: 'Giao thành công',
    DELIVERY_FAILED: 'Giao thất bại',
    EXCEPTION: 'Kiện vấn đề',
    MANIFEST_RECEIVED: 'Đã nhận bao',
    MANIFEST_SEALED: 'Đã niêm phong bao',
    MANIFEST_UNSEALED: 'Đã gỡ bao',
    NDR_CREATED: 'Cần xử lý giao thất bại',
    PICKUP_COMPLETED: 'Nhận hàng',
    IN_TRANSIT: 'Đang luân chuyển',
    RETURN_COMPLETED: 'Hoàn hàng thành công',
    RETURN_STARTED: 'Bắt đầu hoàn hàng',
    SEND_GOODS: 'Đã gửi hàng',
    INVENTORY_CHECK: 'Kiểm tra hàng tồn',
    SCAN_INBOUND: 'Hàng đến',
    SCAN_OUTBOUND: 'Đã quét xuất hub',
    TASK_ASSIGNED: 'Đã phân công',
    UPDATED: 'Đã cập nhật',
  };

  return labels[status] ?? status;
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

  const issueReason = readMetadataString(shipmentMetadata, ['issueReason', 'exceptionReason', 'ndrReason', 'ndrCase.issueType']);
  const issueEmployeeName = readMetadataString(shipmentMetadata, ['issueEmployeeName', 'exceptionEmployeeName', 'ndrCase.reportedByName', 'reportedBy']);
  const issueEmployeeCode = readMetadataString(shipmentMetadata, ['issueEmployeeCode', 'exceptionEmployeeCode', 'ndrCase.reportedById', 'reportedById']);
  const issueHubCode = readMetadataString(shipmentMetadata, ['issueHubCode', 'exceptionHubCode', 'ndrCase.reportedHubCode', 'reportedHubCode']);
  const issueNoteFull = readMetadataString(shipmentMetadata, ['issueNote', 'exceptionNote', 'ndrCase.note', 'note']);

  let displayStatus = toShipmentStatusLabelVi(shipmentQuery.data?.currentStatus);
  if (shipmentQuery.data?.currentStatus === 'EXCEPTION') {
    const reasonText = issueReason ?? 'Không rõ lý do';
    displayStatus = `${displayStatus} (Lý do: ${reasonText})`;
    if (issueEmployeeName || issueEmployeeCode || issueHubCode) {
      displayStatus += `\nNV: ${issueEmployeeName || 'N/A'} (${issueEmployeeCode || 'N/A'}) - Hub: ${issueHubCode || 'N/A'}`;
    } else if (issueNoteFull) {
      displayStatus += `\nGhi chú: ${issueNoteFull}`;
    }
  }

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
        Alert.alert('Không có số điện thoại', 'Đơn hàng chưa có thông tin số liên hệ.');
        return;
      }

      const phone = normalizePhone(rawPhone);
      const targetUrl = kind === 'sms' ? `sms:${phone}` : `tel:${phone}`;

      try {
        const supported = await Linking.canOpenURL(targetUrl);
        if (!supported) {
          Alert.alert('Không mở được ứng dụng', `Không thể xử lý: ${targetUrl}`);
          return;
        }

        await Linking.openURL(targetUrl);
      } catch (error) {
        Alert.alert(
          'Thao tác thất bại',
          error instanceof Error ? error.message : 'Không thể mở liên kết gọi điện.',
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
          <Text style={styles.centeredText}>Đang tải chi tiết nhiệm vụ...</Text>
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
              : 'Tải chi tiết nhiệm vụ thất bại.'}
          </Text>
          <Pressable onPress={() => void taskQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Không tìm thấy nhiệm vụ.</Text>
        </View>
      </Screen>
    );
  }

  const hasShipmentCode = Boolean(task.shipmentCode);
  const isPickupTask = task.taskType === 'PICKUP';
  const isReloadingStatus = taskQuery.isRefetching || shipmentQuery.isRefetching;
  const canRunPrimaryAction = isPickupTask
    ? canAccessCourierFeature(session?.user, 'scan.pickup')
    : canAccessCourierFeature(session?.user, 'scan.delivery-sign');
  const canReportIssue = canAccessCourierFeature(session?.user, 'scan.issue');

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
              Mã đơn: {task.shipmentCode ?? 'N/A'}
            </Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Thông tin nhiệm vụ</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã nhiệm vụ</Text>
              <Text style={styles.infoValue}>{task.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Yêu cầu lấy hàng</Text>
              <Text style={styles.infoValue}>{task.pickupRequestId ?? 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số lần phân công</Text>
              <Text style={styles.infoValue}>{String(task.assignments.length)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tạo lúc</Text>
              <Text style={styles.infoValue}>{formatDateTime(task.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cập nhật lúc</Text>
              <Text style={styles.infoValue}>{formatDateTime(task.updatedAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú nhiệm vụ</Text>
              <Text style={styles.infoValue}>{task.note ?? 'N/A'}</Text>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
            {shipmentQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
              </View>
            ) : null}

            {shipmentQuery.isError ? (
              <Text style={styles.errorInlineText}>
                {shipmentQuery.error instanceof Error
                  ? shipmentQuery.error.message
                  : 'Không tải được thông tin đơn hàng.'}
              </Text>
            ) : null}

            {!shipmentQuery.isLoading && !shipmentQuery.isError ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Trạng thái đơn</Text>
                  <Text style={styles.infoValue}>
                    {displayStatus}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Người gửi</Text>
                  <Text style={styles.infoValue}>{senderName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số điện thoại gửi</Text>
                  <Text style={styles.infoValue}>{senderPhone ?? 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Người nhận</Text>
                  <Text style={styles.infoValue}>{receiverName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số điện thoại nhận</Text>
                  <Text style={styles.infoValue}>{receiverPhone ?? 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Địa chỉ giao</Text>
                  <Text style={styles.infoValue}>{deliveryAddress}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ghi chú đơn</Text>
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
            <Text style={styles.actionButtonText}>gọi</Text>
          </Pressable>

          <Pressable
            disabled={!hasShipmentCode || !canRunPrimaryAction}
            onPress={() => {
              if (isPickupTask) {
                navigation.navigate('PickupScan', {
                  taskId: task.id,
                  shipmentCode: task.shipmentCode ?? undefined,
                });
                return;
              }

              navigation.navigate('DeliveryProof', {
                taskId: task.id,
                taskCode: task.taskCode,
                shipmentCode: task.shipmentCode ?? undefined,
              });
            }}
            style={[
              styles.actionButton,
              styles.midActionButton,
              (!hasShipmentCode || !canRunPrimaryAction) && styles.actionButtonDisabled,
            ]}
          >
            <Ionicons
              name={isPickupTask ? 'cube-outline' : 'document-text-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>
              {isPickupTask ? 'Nhận hàng' : 'Ký nhận'}
            </Text>
          </Pressable>

          <Pressable
            disabled={!hasShipmentCode || !canReportIssue}
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
              (!hasShipmentCode || !canReportIssue) && styles.actionButtonDisabled,
            ]}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Vấn đề</Text>
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
            <Text style={styles.modalTitle}>Thao tác liên hệ</Text>
            <Pressable
              onPress={() => {
                void handleContactAction('call', receiverPhone);
              }}
              style={styles.modalAction}
            >
              <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.modalActionText}>Gọi người nhận</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void handleContactAction('call', senderPhone);
              }}
              style={styles.modalAction}
            >
              <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.modalActionText}>Gọi người gửi</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void handleContactAction('sms', receiverPhone);
              }}
              style={styles.modalAction}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.modalActionText}>Nhắn tin người nhận</Text>
            </Pressable>
            <Pressable
              onPress={() => setCallOptionsVisible(false)}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelText}>Đóng</Text>
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
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
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
    borderColor: '#BFDBFE',
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
