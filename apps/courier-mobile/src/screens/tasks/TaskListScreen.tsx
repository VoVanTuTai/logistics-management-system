import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { shipmentApi } from '../../features/shipment/shipment.api';
import type { ShipmentDto, ShipmentMetadata } from '../../features/shipment/shipment.types';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import type { TaskDto, TaskStatus, TaskType } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierId, resolveCourierDisplayName } from '../../utils/courier';
import { theme } from '../../theme';

type TaskListRouteParams = AppNavigatorParamList['TaskList'];
type TaskViewMode = 'ORDER' | 'CUSTOMER';
const UNKNOWN_RECEIVER_NAME = 'Chưa có người nhận';

interface TaskDisplayItem {
  task: TaskDto;
  shipment: ShipmentDto | null;
  receiverName: string;
  receiverPhone: string | null;
  deliveryAddress: string | null;
  customerKey: string;
}

interface CustomerTaskGroup {
  id: string;
  receiverName: string;
  receiverPhone: string | null;
  deliveryAddress: string | null;
  tasks: TaskDisplayItem[];
}

interface Props {
  route?: {
    params?: TaskListRouteParams;
  };
}

function statusVariant(status: TaskStatus):
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  if (status === 'CREATED') return 'warning';
  return 'info';
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

function normalizePhone(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const normalizedPhone = phone.replace(/[^\d+]/g, '');
  return normalizedPhone.length > 0 ? normalizedPhone : null;
}

function normalizeCustomerText(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function buildCustomerKey(input: {
  taskId: string;
  receiverName: string;
  receiverPhone: string | null;
  deliveryAddress: string | null;
}): string {
  const phoneKey = normalizePhone(input.receiverPhone);
  if (phoneKey) {
    return `phone:${phoneKey}`;
  }

  const nameKey = normalizeCustomerText(input.receiverName);
  const addressKey = normalizeCustomerText(input.deliveryAddress);
  if (nameKey && nameKey !== 'n/a' && nameKey !== normalizeCustomerText(UNKNOWN_RECEIVER_NAME)) {
    return `receiver:${nameKey}:${addressKey}`;
  }

  return `task:${input.taskId}`;
}

function buildTaskDisplayItem(
  task: TaskDto,
  shipment: ShipmentDto | null,
): TaskDisplayItem {
  const metadata = shipment?.metadata ?? null;
  const receiverName =
    readMetadataString(metadata, [
      'receiverName',
      'receiver.name',
      'recipientName',
      'recipient.name',
    ]) ?? UNKNOWN_RECEIVER_NAME;
  const receiverPhone =
    readMetadataString(metadata, [
      'receiverPhone',
      'receiver.phone',
      'recipientPhone',
      'recipient.phone',
    ]) ?? null;
  const deliveryAddress =
    readMetadataString(metadata, [
      'deliveryAddress',
      'receiverAddress',
      'recipientAddress',
      'receiver.address',
      'recipient.address',
      'address',
    ]) ?? null;

  return {
    task,
    shipment,
    receiverName,
    receiverPhone,
    deliveryAddress,
    customerKey: buildCustomerKey({
      taskId: task.id,
      receiverName,
      receiverPhone,
      deliveryAddress,
    }),
  };
}

function groupTasksByCustomer(items: TaskDisplayItem[]): CustomerTaskGroup[] {
  const groups = new Map<string, CustomerTaskGroup>();

  for (const item of items) {
    const existingGroup = groups.get(item.customerKey);
    if (existingGroup) {
      existingGroup.tasks.push(item);
      continue;
    }

    groups.set(item.customerKey, {
      id: item.customerKey,
      receiverName: item.receiverName,
      receiverPhone: item.receiverPhone,
      deliveryAddress: item.deliveryAddress,
      tasks: [item],
    });
  }

  return Array.from(groups.values());
}

function formatShipmentCode(task: TaskDto): string {
  return task.shipmentCode ?? 'Chưa có mã vận đơn';
}

function toTaskTypeLabel(taskType: TaskType): string {
  const labels: Record<TaskType, string> = {
    PICKUP: 'Đợi lấy',
    DELIVERY: 'Đợi phát',
    RETURN: 'Hoàn hàng',
  };

  return labels[taskType];
}

export function TaskListScreen({ route }: Props = {}): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const courierName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);

  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const onRefresh = () => void tasksQuery.refetch();

  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | 'ALL'>(
    route?.params?.initialTaskType ?? 'ALL',
  );
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED'
  >(route?.params?.initialStatus ?? 'ALL');
  const [viewMode, setViewMode] = useState<TaskViewMode>('ORDER');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const tasks = tasksQuery.data ?? [];

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (taskTypeFilter === 'ALL' || task.taskType === taskTypeFilter) &&
          (statusFilter === 'ALL' || task.status === statusFilter),
      ),
    [tasks, taskTypeFilter, statusFilter],
  );

  const filteredShipmentCodes = useMemo(
    () =>
      Array.from(
        new Set(
          filteredTasks
            .map((task) => task.shipmentCode?.trim())
            .filter((shipmentCode): shipmentCode is string => Boolean(shipmentCode)),
        ),
      ),
    [filteredTasks],
  );
  const shipmentQueries = useQueries({
    queries: filteredShipmentCodes.map((shipmentCode) => ({
      queryKey: ['shipment', 'detail', shipmentCode],
      queryFn: () =>
        shipmentApi.getShipmentDetail(
          session?.tokens.accessToken as string,
          shipmentCode,
        ),
      enabled: Boolean(session?.tokens.accessToken),
      staleTime: 30_000,
    })),
  });
  const shipmentByCode = useMemo(() => {
    const shipments = new Map<string, ShipmentDto>();

    filteredShipmentCodes.forEach((shipmentCode, index) => {
      const shipment = shipmentQueries[index]?.data;
      if (shipment) {
        shipments.set(shipmentCode, shipment);
      }
    });

    return shipments;
  }, [filteredShipmentCodes, shipmentQueries]);
  const displayItems = useMemo(
    () =>
      filteredTasks.map((task) =>
        buildTaskDisplayItem(
          task,
          task.shipmentCode ? shipmentByCode.get(task.shipmentCode) ?? null : null,
        ),
      ),
    [filteredTasks, shipmentByCode],
  );
  const customerGroups = useMemo(
    () => groupTasksByCustomer(displayItems),
    [displayItems],
  );

  const typeOptions: { value: TaskType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PICKUP', label: 'Đợi lấy' },
    { value: 'DELIVERY', label: 'Đợi phát' },
    { value: 'RETURN', label: 'Hoàn hàng' },
  ];

  const statusOptions: {
    value: 'ALL' | 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
    label: string;
  }[] = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'CREATED', label: 'Chờ nhận' },
    { value: 'ASSIGNED', label: 'Đang giao' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  const visibleCountText =
    viewMode === 'CUSTOMER'
      ? `${customerGroups.length} khách / ${filteredTasks.length} đơn`
      : `${filteredTasks.length} nhiệm vụ`;

  const handleCallCustomer = async (phone: string | null) => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      Alert.alert('Chưa có số điện thoại', 'Đơn này chưa có số điện thoại người nhận.');
      return;
    }

    const canOpen = await Linking.canOpenURL(`tel:${normalizedPhone}`);
    if (canOpen) {
      await Linking.openURL(`tel:${normalizedPhone}`);
      return;
    }

    Alert.alert('Không thể gọi', normalizedPhone);
  };

  return (
    <Screen
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={tasksQuery.isRefetching}
    >
      <View style={styles.headerBlock}>
        <View style={styles.headerTop}>
          <Text style={styles.headerSubtitle}>
            {courierName} - {courierId} • {visibleCountText}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('TrackingLookup')}
            style={({ pressed }) => [styles.trackButton, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="locate-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.trackButtonText}>Theo doi don</Text>
          </Pressable>
        </View>

        <View style={styles.selectRow}>
          <View style={styles.selectColumn}>
            <Pressable
              style={styles.selectButton}
              onPress={() => {
                setTypeMenuOpen((prev) => !prev);
                setStatusMenuOpen(false);
              }}
            >
              <Text style={styles.selectLabel}>Loại</Text>
              <Text style={styles.selectValue}>
                {typeOptions.find((o) => o.value === taskTypeFilter)?.label ?? 'Tất cả'}
              </Text>
              <Ionicons
                name={typeMenuOpen ? 'chevron-up' : 'chevron-down'}
                size={12}
                color="#EFF6FF"
              />
            </Pressable>
            {typeMenuOpen ? (
              <View style={styles.dropdown}>
                {typeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setTaskTypeFilter(option.value);
                      setTypeMenuOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.selectColumn}>
            <Pressable
              style={styles.selectButton}
              onPress={() => {
                setStatusMenuOpen((prev) => !prev);
                setTypeMenuOpen(false);
              }}
            >
              <Text style={styles.selectLabel}>Trạng thái</Text>
              <Text style={styles.selectValue}>
                {statusOptions.find((o) => o.value === statusFilter)?.label ?? 'Tất cả'}
              </Text>
              <Ionicons
                name={statusMenuOpen ? 'chevron-up' : 'chevron-down'}
                size={12}
                color="#EFF6FF"
              />
            </Pressable>
            {statusMenuOpen ? (
              <View style={styles.dropdown}>
                {statusOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStatusFilter(option.value);
                      setStatusMenuOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.viewModeRow}>
          <Pressable
            onPress={() => setViewMode('ORDER')}
            style={({ pressed }) => [
              styles.viewModeButton,
              viewMode === 'ORDER' && styles.viewModeButtonActive,
              pressed && styles.viewModeButtonPressed,
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={14}
              color={viewMode === 'ORDER' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'ORDER' && styles.viewModeTextActive,
              ]}
            >
              Theo đơn
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('CUSTOMER')}
            style={({ pressed }) => [
              styles.viewModeButton,
              viewMode === 'CUSTOMER' && styles.viewModeButtonActive,
              pressed && styles.viewModeButtonPressed,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={14}
              color={viewMode === 'CUSTOMER' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'CUSTOMER' && styles.viewModeTextActive,
              ]}
            >
              Theo khách hàng
            </Text>
          </Pressable>
        </View>
      </View>

      {offlinePendingCount > 0 ? (
        <Card style={styles.offlineBanner}>
          <Text style={styles.offlineBannerTitle}>Đang có thao tác chờ đồng bộ offline</Text>
          <Text style={styles.offlineBannerText}>
            {offlinePendingCount} thao tác đang trong hàng đợi. Vào tab Cá nhân để thử lại thủ công.
          </Text>
        </Card>
      ) : null}

      {tasksQuery.isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>Đang tải nhiệm vụ...</Text>
        </View>
      ) : null}

      {tasksQuery.isError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>
            {tasksQuery.error instanceof Error
              ? tasksQuery.error.message
              : 'Tải nhiệm vụ thất bại.'}
          </Text>
          <Pressable onPress={() => void tasksQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && filteredTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Không có nhiệm vụ phù hợp</Text>
          <Text style={styles.stateText}>Thử đổi bộ lọc hoặc kéo để làm mới.</Text>
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && viewMode === 'ORDER'
        ? displayItems.map((item, index) => (
            <Card
              key={item.task.id}
              style={[styles.taskCard, index === 0 && { marginTop: theme.spacing.xs }]}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.task.id })}
            >
              <View style={styles.taskTopRow}>
                <View style={styles.taskTitleBlock}>
                  <Text style={styles.shipmentCode}>{formatShipmentCode(item.task)}</Text>
                  <Text numberOfLines={1} style={styles.receiverName}>
                    {item.receiverName}
                  </Text>
                </View>
                <StatusBadge label={item.task.status} variant={statusVariant(item.task.status)} />
              </View>
              <View style={styles.taskMetaRow}>
                <StatusBadge label={toTaskTypeLabel(item.task.taskType)} variant="neutral" />
                <Text numberOfLines={1} style={styles.taskShipment}>
                  {item.deliveryAddress ?? item.receiverPhone ?? 'Chưa có thông tin nhận'}
                </Text>
              </View>
              <Text style={styles.taskNote}>{item.task.note ?? 'Không có ghi chú.'}</Text>
            </Card>
          ))
        : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && viewMode === 'CUSTOMER'
        ? customerGroups.map((group, index) => (
            <Card
              key={group.id}
              style={[styles.customerCard, index === 0 && { marginTop: theme.spacing.xs }]}
            >
              <View style={styles.customerTopRow}>
                <View style={styles.customerTitleBlock}>
                  <Text style={styles.customerName}>{group.receiverName}</Text>
                  <Text numberOfLines={1} style={styles.customerMeta}>
                    {group.receiverPhone ?? group.deliveryAddress ?? 'Chưa có thông tin liên hệ'}
                  </Text>
                </View>
                <StatusBadge label={`${group.tasks.length} đơn`} variant="info" />
              </View>

              <View style={styles.customerActionRow}>
                <Pressable
                  onPress={() => void handleCallCustomer(group.receiverPhone)}
                  style={({ pressed }) => [
                    styles.callButton,
                    !group.receiverPhone && styles.callButtonDisabled,
                    pressed && styles.callButtonPressed,
                  ]}
                >
                  <Ionicons name="call-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.callButtonText}>Gọi khách</Text>
                </Pressable>
                <View style={styles.signModeBadge}>
                  <Ionicons name="create-outline" size={13} color={theme.colors.textSecondary} />
                  <Text style={styles.signModeText}>Ký từng đơn</Text>
                </View>
              </View>

              <View style={styles.groupShipmentList}>
                {group.tasks.map((item) => (
                  <Pressable
                    key={item.task.id}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: item.task.id })}
                    style={({ pressed }) => [
                      styles.groupShipmentRow,
                      pressed && styles.groupShipmentRowPressed,
                    ]}
                  >
                    <View style={styles.groupShipmentTextBlock}>
                      <Text style={styles.groupShipmentCode}>{formatShipmentCode(item.task)}</Text>
                      <Text numberOfLines={1} style={styles.groupShipmentMeta}>
                        {toTaskTypeLabel(item.task.taskType)}
                      </Text>
                    </View>
                    <StatusBadge
                      label={item.task.status}
                      variant={statusVariant(item.task.status)}
                    />
                  </Pressable>
                ))}
              </View>
            </Card>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xxs,
    gap: theme.spacing.xs,
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    ...theme.shadow.sm,
    marginTop: 0
    
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSubtitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: theme.radius.md,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  trackButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  selectRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    backgroundColor: '#EEF4FB',
    borderRadius: theme.radius.md,
    padding: 3,
  },
  viewModeButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  viewModeButtonActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadow.sm,
  },
  viewModeButtonPressed: {
    opacity: 0.88,
  },
  viewModeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  selectColumn: {
    flex: 1,
  },
  selectButton: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 1,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  selectLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 0,
  },
  selectValue: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    marginRight: theme.spacing.xs,
  },
  dropdown: {
    marginTop: 4,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    ...theme.shadow.card,
  },
  dropdownItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  dropdownText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  offlineBanner: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  offlineBannerTitle: {
    color: '#9A3412',
    fontWeight: '700',
    marginBottom: 4,
  },
  offlineBannerText: {
    color: '#7C2D12',
    lineHeight: 19,
  },
  centeredState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  stateText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
  },
  errorCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginHorizontal: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.danger,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  taskCard: {
    marginHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  taskTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  shipmentCode: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  receiverName: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  taskCode: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  taskShipment: {
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
  },
  taskNote: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  customerCard: {
    marginHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  customerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  customerMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  customerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  callButton: {
    minHeight: 34,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  callButtonDisabled: {
    opacity: 0.55,
  },
  callButtonPressed: {
    opacity: 0.88,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  signModeBadge: {
    minHeight: 34,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  signModeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  groupShipmentList: {
    gap: theme.spacing.xs,
  },
  groupShipmentRow: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  groupShipmentRowPressed: {
    opacity: 0.85,
  },
  groupShipmentTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  groupShipmentCode: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  groupShipmentMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
