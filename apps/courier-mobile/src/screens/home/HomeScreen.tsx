import React, { useMemo, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { HomeHeader } from '../../components/home/HomeHeader';
import { NotificationBanner } from '../../components/home/NotificationBanner';
import { NotificationModal } from '../../components/notifications/NotificationModal';
import { QuickStatsRow } from '../../components/home/QuickStatsRow';
import { OverdueCard } from '../../components/home/OverdueCard';
import { AppGrid } from '../../components/home/AppGrid';
import type { TaskDto, TaskStatus } from '../../features/tasks/tasks.types';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import { useCodRecordsQuery } from '../../features/cod/cod.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAuthStore } from '../../features/auth/auth.store';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierDisplayName, resolveCourierId } from '../../utils/courier';
import { getQuickAppItems, navigateToQuickApp } from '../../features/quick-apps/quickApps';
import { canAccessCourierFeature } from '../../features/permissions/courier-permissions';
import { countSlaSummary } from '../../utils/pickupSla';

const CASH_IN_HAND_LIMIT = 15_000_000;
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
  const quickAppIds = useAppStore((state) => state.quickAppIds);
  const refreshMobilePermissions = useAuthStore(
    (state) => state.refreshMobilePermissions,
  );
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const codRecordsQuery = useCodRecordsQuery({
    courierId,
    accessToken: session?.tokens.accessToken ?? null,
  });
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const onRefresh = () => {
    void tasksQuery.refetch();
    void codRecordsQuery.refetch();
    void refreshMobilePermissions();
  };
  const refreshing = tasksQuery.isRefetching || codRecordsQuery.isRefetching;

  const cashNeedRemit = useMemo(() => {
    const records = codRecordsQuery.data ?? [];
    return records
      .filter((r) => r.paymentMethod === 'COD' && r.status === 'COLLECTED')
      .reduce((sum, r) => sum + (r.collectedAmount ?? r.codAmount ?? 0), 0);
  }, [codRecordsQuery.data]);

  const overdueCashRecords = useMemo(() => {
    const records = codRecordsQuery.data ?? [];
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return records.filter((r) => {
      if (r.paymentMethod !== 'COD' || r.status !== 'COLLECTED') {
        return false;
      }
      const recordDate = new Date(r.collectedAt || r.createdAt);
      return !Number.isNaN(recordDate.getTime()) && recordDate.getTime() < todayStart;
    });
  }, [codRecordsQuery.data]);

  const overdueCashAmount = useMemo(() => {
    return overdueCashRecords.reduce(
      (sum, r) => sum + (r.collectedAmount ?? r.codAmount ?? 0),
      0,
    );
  }, [overdueCashRecords]);

  const isOverdueCodLocked = overdueCashAmount > 0;
  const isCashOverLimit = cashNeedRemit >= CASH_IN_HAND_LIMIT;

  useFocusEffect(
    React.useCallback(() => {
      void refreshMobilePermissions();
      void codRecordsQuery.refetch();
    }, [refreshMobilePermissions, codRecordsQuery]),
  );

  const canScanPickup = canAccessCourierFeature(session?.user, 'scan.pickup');
  const canScanDelivery =
    canAccessCourierFeature(session?.user, 'scan.delivery') ||
    canAccessCourierFeature(session?.user, 'scan.delivery-sign');

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
  const slaSummary = useMemo(() => countSlaSummary(tasks), [tasks]);
  const quickAppItems = useMemo(() => {
    const items = getQuickAppItems(quickAppIds);
    return items.filter(
      (item) => !item.permission || canAccessCourierFeature(session?.user, item.permission),
    );
  }, [quickAppIds, session?.user]);

  const transferredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const isReassigned = task.assignments && task.assignments.length > 1;
      const noteText = task.note || '';
      const hasTransferNote =
        noteText.toLowerCase().includes('chuyển') ||
        noteText.toLowerCase().includes('reassign') ||
        noteText.toLowerCase().includes('điều phối lại');
      return isReassigned || hasTransferNote;
    });
  }, [tasks]);

  const newTasks = useMemo(() => {
    return tasks.filter((task) => task.status === 'ASSIGNED');
  }, [tasks]);

  const notificationCount = transferredTasks.length + newTasks.length;

  const todayTasksCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return tasks.filter((task) => {
      if (task.createdAt && new Date(task.createdAt).toDateString() === todayStr) {
        return true;
      }
      const activeAssignment = task.assignments?.find((a) => !a.unassignedAt);
      if (
        activeAssignment?.assignedAt &&
        new Date(activeAssignment.assignedAt).toDateString() === todayStr
      ) {
        return true;
      }
      return false;
    }).length;
  }, [tasks]);

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
          notificationCount={notificationCount}
          onPressQr={() => navigation.navigate('MainTabs', { screen: 'Scan' })}
          onPressNotification={() => setNotificationModalVisible(true)}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isOverdueCodLocked ? (
            <View style={styles.overdueLockAlert}>
              <View style={styles.overdueLockHeader}>
                <Ionicons name="lock-closed" size={20} color="#B91C1C" />
                <Text style={styles.overdueLockTitle}>TÀI KHOẢN BỊ KHÓA: NỢ COD QUA NGÀY</Text>
              </View>
              <Text style={styles.overdueLockMessage}>
                Cuối ca hôm trước bạn chưa nộp đóng COD. Tài khoản tạm thời bị <Text style={styles.overdueLockAmount}>KHÓA</Text> chức năng giao nhận đơn mới cho đến khi nộp hết <Text style={styles.overdueLockAmount}>{overdueCashAmount.toLocaleString('vi-VN')}đ</Text> tiền mặt ({overdueCashRecords.length} đơn tồn).
              </Text>
              <Pressable
                style={styles.overdueLockButton}
                onPress={() => navigation.navigate('CodStats')}
              >
                <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                <Text style={styles.overdueLockButtonText}>Mở khóa tài khoản (Nộp tiền VietQR)</Text>
              </Pressable>
            </View>
          ) : isCashOverLimit ? (
            <View style={styles.cashLimitAlert}>
              <View style={styles.cashLimitHeader}>
                <Ionicons name="warning" size={20} color="#DC2626" />
                <Text style={styles.cashLimitTitle}>Cảnh báo trần giữ tiền mặt COD</Text>
              </View>
              <Text style={styles.cashLimitMessage}>
                Bạn đang giữ <Text style={styles.cashLimitAmount}>{cashNeedRemit.toLocaleString('vi-VN')}đ</Text> tiền mặt COD (vượt hạn mức 15.000.000đ). Vui lòng nộp tiền ngay qua VietQR hoặc két Hub trước khi tiếp tục giao đơn!
              </Text>
              <Pressable
                style={styles.cashLimitButton}
                onPress={() => navigation.navigate('CodStats')}
              >
                <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                <Text style={styles.cashLimitButtonText}>Nộp tiền ngay (VietQR)</Text>
              </Pressable>
            </View>
          ) : null}

          <NotificationBanner
            title={transferredTasks.length > 0 ? 'Có đơn điều phối mới' : 'Thông báo vận hành'}
            message={
              transferredTasks.length > 0
                ? `Có ${transferredTasks.length} đơn chuyển từ shipper khác & ${newTasks.length} đơn cần giao nhận.`
                : `Đã nhận ${todayTasksCount} nhiệm vụ trong ca hôm nay.`
            }
            badgeCount={notificationCount}
            onPress={() => setNotificationModalVisible(true)}
          />

          <QuickStatsRow
            waitingPickup={pickupCount}
            waitingDelivery={deliveryCount}
            showPickup={canScanPickup}
            showDelivery={canScanDelivery}
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

          {canScanPickup || canScanDelivery ? (
            <OverdueCard
              overdueCount={slaSummary.overdueCount}
              nearOverdueCount={slaSummary.nearOverdueCount}
              onPress={() => navigation.navigate('OverdueAlert')}
            />
          ) : null}

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
            title="Ứng dụng tùy chỉnh"
            items={quickAppItems}
            onPressItem={(item) => {
              navigateToQuickApp(item.id, navigation);
            }}
          />
        </ScrollView>

        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
          tasks={tasks}
          onSelectTask={(taskId) => {
            navigation.navigate('TaskDetail', { taskId });
          }}
        />
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
  cashLimitAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1.5,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  cashLimitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashLimitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B91C1C',
  },
  cashLimitMessage: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  cashLimitAmount: {
    fontWeight: '800',
    color: '#991B1B',
  },
  cashLimitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  cashLimitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  overdueLockAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 2,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  overdueLockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overdueLockTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991B1B',
    flex: 1,
  },
  overdueLockMessage: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  overdueLockAmount: {
    fontWeight: '900',
    color: '#B91C1C',
  },
  overdueLockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#991B1B',
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  overdueLockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
