import React, { useMemo, useState } from 'react';
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
import type { TaskListFilter, TaskStatus } from '../../features/tasks/tasks.types';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../navigation/navigation.types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { theme } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Tasks'>;

const FILTER_OPTIONS: Array<{ value: TaskListFilter; label: string }> = [
  { value: 'ALL', label: 'Tat ca' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'RETURN', label: 'Return' },
];

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

export function TaskListScreen(_: Props): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = useAppStore((state) => state.session);
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);
  const [selectedFilter, setSelectedFilter] = useState<TaskListFilter>('ALL');
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId: appEnv.courierId,
  });

  const tasks = tasksQuery.data ?? [];
  const filteredTasks = useMemo(
    () =>
      selectedFilter === 'ALL'
        ? tasks
        : tasks.filter((task) => task.taskType === selectedFilter),
    [selectedFilter, tasks],
  );

  const totalTaskCount = tasks.length;
  const assignedTaskCount = tasks.filter((task) => task.status === 'ASSIGNED').length;
  const completedTaskCount = tasks.filter((task) => task.status === 'COMPLETED').length;

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.greeting}>Chao {session?.user.username ?? 'Courier'}</Text>
          <Text style={styles.heroSubtitle}>Ban co {totalTaskCount} nhiem vu trong ca</Text>
        </View>
        <Ionicons name="bicycle" size={28} color="#FFFFFF" />
      </View>

      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tong task</Text>
          <Text style={styles.kpiValue}>{totalTaskCount}</Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Dang xu ly</Text>
          <Text style={styles.kpiValue}>{assignedTaskCount}</Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Da xong</Text>
          <Text style={styles.kpiValue}>{completedTaskCount}</Text>
        </Card>
      </View>

      {offlinePendingCount > 0 ? (
        <Card style={styles.offlineBanner}>
          <Text style={styles.offlineBannerTitle}>Dang co action cho retry offline</Text>
          <Text style={styles.offlineBannerText}>
            {offlinePendingCount} action dang queue. Vao tab Ca nhan de retry thu cong.
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
        <Text style={styles.sectionTitle}>Danh sach nhiem vu</Text>
        <Text style={styles.sectionMeta}>Filter theo payload server</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((filterOption) => {
          const active = filterOption.value === selectedFilter;
          return (
            <Pressable
              key={filterOption.value}
              onPress={() => setSelectedFilter(filterOption.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterChipText, active && styles.filterChipTextActive]}
              >
                {filterOption.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tasksQuery.isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>Dang tai nhiem vu...</Text>
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
            <Text style={styles.retryText}>Thu lai</Text>
          </Pressable>
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && filteredTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Khong co task phu hop</Text>
          <Text style={styles.stateText}>Thu doi filter hoac lam moi du lieu.</Text>
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError
        ? filteredTasks.map((task) => (
            <Card
              key={task.id}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
              style={styles.taskCard}
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
                <Text style={styles.taskShipment}>
                  Shipment: {task.shipmentCode ?? 'N/A'}
                </Text>
              </View>
            </Card>
          ))
        : null}
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  taskCard: {
    gap: theme.spacing.sm,
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

