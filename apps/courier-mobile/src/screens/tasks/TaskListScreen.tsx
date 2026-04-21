import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import type { TaskDto, TaskStatus, TaskType } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierId } from '../../utils/courier';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'TaskList'>;

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

export function TaskListScreen({ route }: Props): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);

  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const onRefresh = () => void tasksQuery.refetch();

  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | 'ALL'>(
    route.params?.initialTaskType ?? 'ALL',
  );
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED'
  >(route.params?.initialStatus ?? 'ALL');
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
            {courierId} • {filteredTasks.length} nhiệm vụ
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
                color="#EEF2FF"
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
                color="#EEF2FF"
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

      {!tasksQuery.isLoading && !tasksQuery.isError
        ? filteredTasks.map((task, index) => (
            <Card
              key={task.id}
              style={[styles.taskCard, index === 0 && { marginTop: theme.spacing.xs }]}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
            >
              <View style={styles.taskTopRow}>
                <Text style={styles.taskCode}>{task.taskCode}</Text>
                <StatusBadge label={task.status} variant={statusVariant(task.status)} />
              </View>
              <View style={styles.taskMetaRow}>
                <StatusBadge label={task.taskType} variant="neutral" />
                <Text style={styles.taskShipment}>Shipment: {task.shipmentCode ?? 'N/A'}</Text>
              </View>
              <Text style={styles.taskNote}>{task.note ?? 'Không có ghi chú.'}</Text>
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
    borderColor: '#C7D2FE',
    borderRadius: theme.radius.md,
    backgroundColor: '#EEF2FF',
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
});

