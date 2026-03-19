import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { HomeHeader } from '../../components/home/HomeHeader';
import { NotificationBanner } from '../../components/home/NotificationBanner';
import { QuickStatsRow } from '../../components/home/QuickStatsRow';
import { OverdueCard } from '../../components/home/OverdueCard';
import { AppGrid, type HomeAppGridItem } from '../../components/home/AppGrid';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { TaskStatus } from '../../features/tasks/tasks.types';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';

const appItems: HomeAppGridItem[] = [
  {
    id: 'create-order',
    label: 'Lên đơn',
    iconName: 'add-circle-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'scan-history',
    label: 'Lịch sử quét',
    iconName: 'scan-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
  {
    id: 'cash-stats',
    label: 'Thống kê tiền hàng',
    iconName: 'wallet-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'shipping-fee',
    label: 'Tính vận phí',
    iconName: 'calculator-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
  },
  {
    id: 'tracking',
    label: 'Theo dõi đơn',
    iconName: 'locate-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'uniform-check',
    label: 'Kiểm tra đồng phục',
    iconName: 'shirt-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
  {
    id: 'referral',
    label: 'Giới thiệu khách hàng',
    iconName: 'people-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'weight-change',
    label: 'Đăng ký đổi trọng lượng',
    iconName: 'barbell-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
  },
];

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

export function HomeScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId: appEnv.courierId,
  });

  const tasks = tasksQuery.data ?? [];
  const pickupCount = tasks.filter((task) => task.taskType === 'PICKUP').length;
  const deliveryCount = tasks.filter((task) => task.taskType === 'DELIVERY').length;
  const processingCount = tasks.filter((task) => task.status === 'ASSIGNED').length;
  const recentTasks = tasks.slice(0, 3);

  const displayName = session?.user.username ?? 'Courier';
  const hubLabel = `Mã courier: ${appEnv.courierId}`;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <HomeHeader
          greeting="Xin chào"
          userName={displayName}
          hubName={hubLabel}
          onPressQr={() => Alert.alert('QR', 'Mở shortcut QR')}
          onPressNotification={() => Alert.alert('Thông báo', 'Mở danh sách thông báo')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <NotificationBanner
            title="Thông báo vận hành"
            message={`Đã đồng bộ ${tasks.length} nhiệm vụ từ gateway-bff.`}
            onPress={() => Alert.alert('Thông báo', 'Chi tiết thông báo vận hành')}
          />

          <QuickStatsRow waitingPickup={pickupCount} waitingDelivery={deliveryCount} />

          <OverdueCard
            title="Đơn đang xử lý"
            overdueCount={processingCount}
            subtitle="Hiển thị số task có trạng thái ASSIGNED theo payload server."
            onPress={() => Alert.alert('Trạng thái', 'Mở danh sách đơn đang xử lý')}
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

          {!tasksQuery.isLoading && !tasksQuery.isError && recentTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có nhiệm vụ</Text>
              <Text style={styles.stateText}>Bạn có thể kéo để làm mới dữ liệu.</Text>
            </View>
          ) : null}

          {!tasksQuery.isLoading && !tasksQuery.isError && recentTasks.length > 0 ? (
            <View style={styles.recentCard}>
              <Text style={styles.recentTitle}>Nhiệm vụ gần đây</Text>
              {recentTasks.map((task) => (
                <View key={task.id} style={styles.recentTaskRow}>
                  <View style={styles.recentTaskInfo}>
                    <Text style={styles.recentTaskCode}>{task.taskCode}</Text>
                    <Text style={styles.recentTaskMeta}>
                      {task.taskType} • {task.shipmentCode ?? 'N/A'}
                    </Text>
                  </View>
                  <StatusBadge
                    label={task.status}
                    variant={mapTaskStatusVariant(task.status)}
                  />
                </View>
              ))}
            </View>
          ) : null}

          <AppGrid
            items={appItems}
            onPressItem={(item) => {
              Alert.alert('Ứng dụng', item.label);
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
});
