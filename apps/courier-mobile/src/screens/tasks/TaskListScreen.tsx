import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import type { TaskDto, TaskStatus } from '../../features/tasks/tasks.types';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../navigation/navigation.types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierId } from '../../utils/courier';
import { theme } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Tasks'>;

const WAITING_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set(['CREATED', 'ASSIGNED']);

function mapTaskStatusVariant(status: TaskStatus):
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info' {
  if (status === 'COMPLETED') {
    return 'success';
  }

  if (status === 'CANCELLED') {
    return 'danger';
  }

  if (status === 'CREATED') {
    return 'warning';
  }

  return 'info';
}

function isWaitingTask(task: TaskDto): boolean {
  return WAITING_TASK_STATUSES.has(task.status);
}

export function TaskListScreen(_: Props): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });

  const tasks = tasksQuery.data ?? [];
  const waitingPickupTasks = useMemo(
    () => tasks.filter((task) => task.taskType === 'PICKUP' && isWaitingTask(task)),
    [tasks],
  );
  const waitingDeliveryTasks = useMemo(
    () => tasks.filter((task) => task.taskType === 'DELIVERY' && isWaitingTask(task)),
    [tasks],
  );

  const waitingTaskCount = waitingPickupTasks.length + waitingDeliveryTasks.length;
  const completedTaskCount = tasks.filter((task) => task.status === 'COMPLETED').length;

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.greeting}>Chao {session?.user.username ?? 'Courier'}</Text>
          <Text style={styles.heroSubtitle}>Ban co {waitingTaskCount} nhiem vu can xu ly</Text>
        </View>
        <Ionicons name="bicycle" size={28} color="#FFFFFF" />
      </View>

      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Doi lay</Text>
          <Text style={styles.kpiValue}>{waitingPickupTasks.length}</Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Doi phat</Text>
          <Text style={styles.kpiValue}>{waitingDeliveryTasks.length}</Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Da xong</Text>
          <Text style={styles.kpiValue}>{completedTaskCount}</Text>
        </Card>
      </View>

      {offlinePendingCount > 0 ? (
        <Card style={styles.offlineBanner}>
          <Text style={styles.offlineBannerTitle}>Đang có thao tác chờ đồng bộ offline</Text>
          <Text style={styles.offlineBannerText}>
            {offlinePendingCount} thao tác đang trong hàng đợi. Vào tab Cá nhân để thử lại thủ công.
          </Text>
        </Card>
      ) : null}

      <View style={styles.quickGrid}>
        <Card style={styles.quickCard} onPress={() => navigation.navigate('PickupScan', {})}>
          <Ionicons name="scan-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.quickTitle}>Pickup scan</Text>
        </Card>

        <Card
          style={styles.quickCard}
          onPress={() => navigation.navigate('HubScan', { mode: 'INBOUND' })}
        >
          <Ionicons name="arrow-down-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.quickTitle}>Hub inbound</Text>
        </Card>

        <Card
          style={styles.quickCard}
          onPress={() => navigation.navigate('HubScan', { mode: 'OUTBOUND' })}
        >
          <Ionicons name="arrow-up-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.quickTitle}>Hub outbound</Text>
        </Card>

        <Card style={styles.quickCard} onPress={() => void tasksQuery.refetch()}>
          <Ionicons name="refresh-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.quickTitle}>Lam moi task</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nhiệm vụ theo luong</Text>
        <Text style={styles.sectionMeta}>Hien thi 2 list: doi lay va doi phat</Text>
      </View>

      {tasksQuery.isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>Đang tải nhiem vu...</Text>
        </View>
      ) : null}

      {tasksQuery.isError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>
            {tasksQuery.error instanceof Error
              ? tasksQuery.error.message
              : 'Tai task that bai.'}
          </Text>
          <Pressable onPress={() => void tasksQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </Card>
      ) : null}

      {!tasksQuery.isLoading &&
      !tasksQuery.isError &&
      waitingPickupTasks.length === 0 &&
      waitingDeliveryTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Không có task cho xu ly</Text>
          <Text style={styles.stateText}>Thu lam moi du lieu hoac doi dieu phoi moi.</Text>
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError ? (
        <Card style={styles.taskSectionCard}>
          <View style={styles.taskSectionHeader}>
            <View style={styles.taskSectionTitleRow}>
              <Ionicons name="cube-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.taskSectionTitle}>List doi lay</Text>
            </View>
            <StatusBadge label={String(waitingPickupTasks.length)} variant="warning" />
          </View>
          <Text style={styles.taskSectionMeta}>Task PICKUP trang thai CREATED/ASSIGNED</Text>

          {waitingPickupTasks.length === 0 ? (
            <Text style={styles.taskSectionEmptyText}>Chua co task doi lay.</Text>
          ) : (
            waitingPickupTasks.map((task, index) => (
              <Pressable
                key={task.id}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                style={[styles.taskRow, index > 0 && styles.taskRowSeparated]}
              >
                <View style={styles.taskTopRow}>
                  <Text style={styles.taskCode}>{task.taskCode}</Text>
                  <StatusBadge
                    label={task.status}
                    variant={mapTaskStatusVariant(task.status)}
                  />
                </View>
                <View style={styles.taskMetaRow}>
                  <StatusBadge label={task.taskType} variant="neutral" />
                  <Text style={styles.taskShipment}>Shipment: {task.shipmentCode ?? 'N/A'}</Text>
                </View>
              </Pressable>
            ))
          )}
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError ? (
        <Card style={styles.taskSectionCard}>
          <View style={styles.taskSectionHeader}>
            <View style={styles.taskSectionTitleRow}>
              <Ionicons name="paper-plane-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.taskSectionTitle}>List doi phat</Text>
            </View>
            <StatusBadge label={String(waitingDeliveryTasks.length)} variant="info" />
          </View>
          <Text style={styles.taskSectionMeta}>Task DELIVERY trang thai CREATED/ASSIGNED</Text>

          {waitingDeliveryTasks.length === 0 ? (
            <Text style={styles.taskSectionEmptyText}>Chua co task doi phat.</Text>
          ) : (
            waitingDeliveryTasks.map((task, index) => (
              <Pressable
                key={task.id}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                style={[styles.taskRow, index > 0 && styles.taskRowSeparated]}
              >
                <View style={styles.taskTopRow}>
                  <Text style={styles.taskCode}>{task.taskCode}</Text>
                  <StatusBadge
                    label={task.status}
                    variant={mapTaskStatusVariant(task.status)}
                  />
                </View>
                <View style={styles.taskMetaRow}>
                  <StatusBadge label={task.taskType} variant="neutral" />
                  <Text style={styles.taskShipment}>Shipment: {task.shipmentCode ?? 'N/A'}</Text>
                </View>
              </Pressable>
            ))
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#DDE8FF',
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  kpiLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  offlineBanner: {
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  quickCard: {
    width: '47%',
    gap: theme.spacing.sm,
    minHeight: 96,
    justifyContent: 'center',
  },
  quickTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
    gap: 2,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
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
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  taskSectionCard: {
    gap: theme.spacing.sm,
  },
  taskSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  taskSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  taskSectionTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  taskSectionMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: -2,
  },
  taskSectionEmptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  taskRow: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  taskRowSeparated: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
    fontWeight: '800',
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
});

