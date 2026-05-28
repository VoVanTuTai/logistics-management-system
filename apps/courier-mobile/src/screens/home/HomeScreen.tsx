import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { HomeHeader } from '../../components/home/HomeHeader';
import { NotificationBanner } from '../../components/home/NotificationBanner';
import { QuickStatsRow } from '../../components/home/QuickStatsRow';
import { OverdueCard } from '../../components/home/OverdueCard';
import { AppGrid, type HomeAppGridItem } from '../../components/home/AppGrid';
import type { TaskDto, TaskStatus } from '../../features/tasks/tasks.types';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierDisplayName, resolveCourierId } from '../../utils/courier';

const appItems: HomeAppGridItem[] = [
  {
    id: 'pickup',
    label: 'Nhận hàng',
    iconName: 'cube-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'delivery',
    label: 'Phát hàng',
    iconName: 'paper-plane-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'goods-arrival',
    label: 'Hàng đến',
    iconName: 'download-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'bag-seal',
    label: 'Đóng bao',
    iconName: 'archive-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
  },
  {
    id: 'vehicle-out',
    label: 'Xe đi',
    iconName: 'car-sport-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'cod',
    label: 'Tiền hàng COD',
    iconName: 'wallet-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'tracking',
    label: 'Theo dõi đơn',
    iconName: 'locate-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'scan-issue',
    label: 'Báo vấn đề',
    iconName: 'alert-circle-outline',
    iconColor: '#C25B12',
    iconBgColor: '#FFEDD5',
  },
];

const WAITING_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set(['CREATED', 'ASSIGNED']);

function mapTaskStatusVariant(
  status: TaskStatus,
): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
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

export function HomeScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const onRefresh = () => void tasksQuery.refetch();
  const refreshing = tasksQuery.isRefetching;

  const tasks = tasksQuery.data ?? [];
  const waitingPickupTasks = useMemo(
    () => tasks.filter((task) => task.taskType === 'PICKUP' && isWaitingTask(task)),
    [tasks],
  );
  const waitingDeliveryTasks = useMemo(
    () => tasks.filter((task) => task.taskType === 'DELIVERY' && isWaitingTask(task)),
    [tasks],
  );

  const pickupCount = waitingPickupTasks.length;
  const deliveryCount = waitingDeliveryTasks.length;
  const processingCount = tasks.filter((task) => task.status === 'ASSIGNED').length;

  const displayName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const hubLabel = `Mã nhân viên: ${courierId}`;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <HomeHeader
          greeting="Xin chào"
          userName={displayName}
          hubName={hubLabel}
          onPressQr={() => navigation.navigate('MainTabs', { screen: 'Scan' })}
          onPressNotification={() => Alert.alert('Thông báo', 'Mở danh sách thông báo')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <NotificationBanner
            title="Thông báo vận hành"
            message={`Đã đồng bộ ${tasks.length} nhiệm vụ từ gateway-bff.`}
            onPress={() => Alert.alert('Thông báo', 'Chi tiết thông báo vận hành')}
          />

          <QuickStatsRow
            waitingPickup={pickupCount}
            waitingDelivery={deliveryCount}
            activeStat={null}
            onPressWaitingPickup={() =>
              navigation.navigate('TaskList', {
                initialTaskType: 'PICKUP',
                initialStatus: 'ASSIGNED',
              })
            }
            onPressWaitingDelivery={() =>
              navigation.navigate('TaskList', {
                initialTaskType: 'DELIVERY',
                initialStatus: 'ASSIGNED',
              })
            }
          />

          <OverdueCard
            title="Đơn đang xử lý"
            overdueCount={processingCount}
            subtitle="Hiển thị số task có trạng thái ASSIGNED theo payload server."
            onPress={() =>
              navigation.navigate('TaskList', {
                initialTaskType: 'ALL',
                initialStatus: 'ASSIGNED',
              })
            }
          />

          {tasksQuery.isLoading ? (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.stateText}>Đang tải dữ liệu nhiệm vụ...</Text>
            </View>
          ) : null}

          {tasksQuery.isError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {tasksQuery.error instanceof Error
                  ? tasksQuery.error.message
                  : 'Không tải được dữ liệu nhiệm vụ.'}
              </Text>
              <Pressable onPress={() => void tasksQuery.refetch()} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Ẩn block "nhiệm vụ gần đây" theo yêu cầu */}

          <AppGrid
            items={appItems}
            onPressItem={(item) => {
              if (item.id === 'pickup') {
                navigation.navigate('PickupScan', {});
                return;
              }

              if (item.id === 'delivery') {
                navigation.navigate('DeliveryDispatch');
                return;
              }

              if (item.id === 'goods-arrival') {
                navigation.navigate('GoodsArrival');
                return;
              }

              if (item.id === 'bag-seal') {
                navigation.navigate('BagSeal');
                return;
              }

              if (item.id === 'vehicle-out') {
                navigation.navigate('VehicleOutbound');
                return;
              }

              if (item.id === 'cod') {
                navigation.navigate('CodStats');
                return;
              }

              if (item.id === 'tracking') {
                navigation.navigate('TrackingLookup');
                return;
              }

              if (item.id === 'scan-issue') {
                navigation.navigate('ScanIssue');
              }
            }}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  centeredBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  stateText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.sm,
  },
  errorText: {
    ...theme.typography.body.md,
    color: theme.colors.danger,
  },
  retryButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  retryButtonText: {
    ...theme.typography.caption.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  emptyTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  recentCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  recentTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  recentTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  recentTaskInfo: {
    flex: 1,
  },
  recentTaskCode: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textPrimary,
  },
  recentTaskMeta: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  queueCloseButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  queueCloseText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
  },
  queueTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
