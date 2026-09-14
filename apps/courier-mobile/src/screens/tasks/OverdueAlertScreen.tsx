import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import type { TaskDto } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierId } from '../../utils/courier';
import {
  computePickupSla,
  countSlaSummary,
  filterTasksBySlaStatus,
  type PickupSlaInfo,
  type SlaStatus,
} from '../../utils/pickupSla';
import { theme } from '../../theme';

type SlaFilterTab = 'ALL_ALERTS' | 'OVERDUE' | 'NEAR_OVERDUE';

interface Props {
  route?: {
    params?: {
      filter?: SlaFilterTab;
    };
  };
}

export function OverdueAlertScreen({ route }: Props): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);

  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });

  const [activeFilter, setActiveFilter] = useState<SlaFilterTab>(
    route?.params?.filter ?? 'ALL_ALERTS',
  );

  const tasks = tasksQuery.data ?? [];
  const now = useMemo(() => new Date(), [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => countSlaSummary(tasks, now), [tasks, now]);
  const filteredAlerts = useMemo(
    () => filterTasksBySlaStatus(tasks, activeFilter, now),
    [tasks, activeFilter, now],
  );

  const totalAlerts = summary.overdueCount + summary.nearOverdueCount;

  const handleCall = async (task: TaskDto) => {
    // Try to get phone from task note (basic pattern)
    const phoneMatch = task.note?.match(/(\d{9,11})/);
    if (phoneMatch) {
      try {
        await Linking.openURL(`tel:${phoneMatch[1]}`);
      } catch {
        Alert.alert('Lỗi', 'Không thể mở ứng dụng gọi điện.');
      }
    } else {
      Alert.alert('Chưa có SĐT', 'Đơn này chưa có số điện thoại người gửi.');
    }
  };

  const handleNavigate = (task: TaskDto) => {
    // Open Google Maps with task note as query if available
    const addressQuery = encodeURIComponent(task.note ?? task.shipmentCode ?? '');
    const url = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở bản đồ.');
    });
  };

  const handlePickupScan = (task: TaskDto) => {
    navigation.navigate('PickupScan', {
      taskId: task.id,
      shipmentCode: task.shipmentCode ?? undefined,
    });
  };

  const filterTabs: { key: SlaFilterTab; label: string; count: number }[] = [
    { key: 'ALL_ALERTS', label: 'Tất cả cảnh báo', count: totalAlerts },
    { key: 'OVERDUE', label: 'Đã quá hạn', count: summary.overdueCount },
    { key: 'NEAR_OVERDUE', label: 'Sắp quá hạn', count: summary.nearOverdueCount },
  ];

  return (
    <Screen
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      onRefresh={() => void tasksQuery.refetch()}
      refreshing={tasksQuery.isRefetching}
    >
      {/* ──── Summary Header ──── */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryCardsRow}>
          <View style={[styles.summaryCard, styles.summaryCardDanger]}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="alert-circle" size={22} color="#DC2626" />
            </View>
            <Text style={styles.summaryCount}>{summary.overdueCount}</Text>
            <Text style={styles.summaryLabel}>Đã quá hạn</Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardWarning]}>
            <View style={styles.summaryIconWrapWarning}>
              <Ionicons name="time" size={22} color="#D97706" />
            </View>
            <Text style={styles.summaryCountWarning}>{summary.nearOverdueCount}</Text>
            <Text style={styles.summaryLabelWarning}>Sắp quá hạn</Text>
          </View>
        </View>

        {/* SLA Rule Banner */}
        <View style={styles.ruleBanner}>
          <View style={styles.ruleBannerHeader}>
            <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
            <Text style={styles.ruleBannerTitle}>Quy chuẩn SLA NEXUS</Text>
          </View>
          <Text style={styles.ruleText}>
            • Đơn tạo trước 12h trưa → Lấy trước 22h tối cùng ngày{'\n'}
            • Đơn tạo từ 12h trưa → Lấy trước 12h trưa ngày hôm sau
          </Text>
        </View>
      </View>

      {/* ──── Filter Tabs ──── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filterTabs.map((tab) => {
          const isActive = tab.key === activeFilter;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label} ({tab.count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ──── Loading ──── */}
      {tasksQuery.isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>Đang tải dữ liệu...</Text>
        </View>
      ) : null}

      {/* ──── Error ──── */}
      {tasksQuery.isError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>
            {tasksQuery.error instanceof Error
              ? tasksQuery.error.message
              : 'Không tải được dữ liệu.'}
          </Text>
          <Pressable onPress={() => void tasksQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </Card>
      ) : null}

      {/* ──── Empty State ──── */}
      {!tasksQuery.isLoading && !tasksQuery.isError && filteredAlerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
          <Text style={styles.emptyTitle}>
            {totalAlerts === 0
              ? '100% đơn thu gom đang trong thời hạn SLA'
              : 'Không có đơn phù hợp bộ lọc hiện tại'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {totalAlerts === 0
              ? 'Tất cả đơn pickup đang được xử lý đúng hạn. Tuyệt vời!'
              : 'Thử chuyển tab bộ lọc khác để xem đơn cảnh báo.'}
          </Text>
        </View>
      ) : null}

      {/* ──── SLA Task Cards ──── */}
      {!tasksQuery.isLoading && !tasksQuery.isError
        ? filteredAlerts.map(({ task, sla }) => (
            <SlaTaskCard
              key={task.id}
              task={task}
              sla={sla}
              onCall={() => void handleCall(task)}
              onNavigate={() => handleNavigate(task)}
              onPickupScan={() => handlePickupScan(task)}
              onViewDetail={() => navigation.navigate('TaskDetail', { taskId: task.id })}
            />
          ))
        : null}
    </Screen>
  );
}

// ─────────────────────────────────────────────
// SLA Task Card Component
// ─────────────────────────────────────────────

interface SlaTaskCardProps {
  task: TaskDto;
  sla: PickupSlaInfo;
  onCall: () => void;
  onNavigate: () => void;
  onPickupScan: () => void;
  onViewDetail: () => void;
}

function SlaTaskCard({
  task,
  sla,
  onCall,
  onNavigate,
  onPickupScan,
  onViewDetail,
}: SlaTaskCardProps): React.JSX.Element {
  const isOverdue = sla.status === 'OVERDUE';
  const badgeBg = isOverdue ? '#FEE2E2' : '#FEF3C7';
  const badgeColor = isOverdue ? '#DC2626' : '#D97706';
  const badgeIcon = isOverdue ? 'alert-circle' : 'time';
  const borderColor = isOverdue ? '#FCA5A5' : '#FDE68A';
  const statusLabel = isOverdue ? 'ĐÃ QUÁ HẠN' : 'SẮP QUÁ HẠN';

  return (
    <Pressable onPress={onViewDetail}>
      <Card style={[styles.taskCard, { borderColor, borderWidth: 1 }]}>
        {/* Badge + Status */}
        <View style={styles.taskCardHeader}>
          <View style={[styles.slaBadge, { backgroundColor: badgeBg }]}>
            <Ionicons name={badgeIcon as any} size={14} color={badgeColor} />
            <Text style={[styles.slaBadgeText, { color: badgeColor }]}>{statusLabel}</Text>
          </View>
          <Text style={[styles.slaTime, { color: badgeColor }]}>{sla.message}</Text>
        </View>

        {/* Task Info */}
        <View style={styles.taskInfoBlock}>
          <View style={styles.taskInfoRow}>
            <Ionicons name="barcode-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.taskInfoLabel}>Mã vận đơn</Text>
            <Text style={styles.taskInfoValue}>{task.shipmentCode ?? 'Chưa có'}</Text>
          </View>
          <View style={styles.taskInfoRow}>
            <Ionicons name="document-text-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.taskInfoLabel}>Mã nhiệm vụ</Text>
            <Text style={styles.taskInfoValue}>{task.taskCode}</Text>
          </View>
          {task.note ? (
            <View style={styles.taskInfoRow}>
              <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.taskInfoLabel}>Ghi chú</Text>
              <Text style={styles.taskInfoValue} numberOfLines={2}>{task.note}</Text>
            </View>
          ) : null}
        </View>

        {/* Rule Label */}
        <View style={styles.ruleTag}>
          <Ionicons name="information-circle-outline" size={12} color={theme.colors.textMuted} />
          <Text style={styles.ruleTagText}>{sla.ruleLabel}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable onPress={onCall} style={[styles.actionButton, styles.actionButtonCall]}>
            <Ionicons name="call" size={16} color="#15803D" />
            <Text style={[styles.actionButtonText, { color: '#15803D' }]}>Gọi Shop</Text>
          </Pressable>

          <Pressable onPress={onNavigate} style={[styles.actionButton, styles.actionButtonNav]}>
            <Ionicons name="navigate" size={16} color="#1D4ED8" />
            <Text style={[styles.actionButtonText, { color: '#1D4ED8' }]}>Dẫn đường</Text>
          </Pressable>

          <Pressable onPress={onPickupScan} style={[styles.actionButton, styles.actionButtonScan]}>
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Quét nhận</Text>
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  // Summary Header
  summaryHeader: {
    gap: theme.spacing.md,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: 6,
    ...theme.shadow.card,
  },
  summaryCardDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  summaryCardWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconWrapWarning: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCount: {
    ...theme.typography.title.md,
    color: '#DC2626',
  },
  summaryLabel: {
    ...theme.typography.caption.md,
    color: '#991B1B',
  },
  summaryCountWarning: {
    ...theme.typography.title.md,
    color: '#D97706',
  },
  summaryLabelWarning: {
    ...theme.typography.caption.md,
    color: '#92400E',
  },

  // Rule Banner
  ruleBanner: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 6,
  },
  ruleBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleBannerTitle: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.primary,
  },
  ruleText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Filter Tabs
  filterRow: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  filterTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterTabText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // States
  centeredState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  stateText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
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
  retryText: {
    ...theme.typography.caption.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  emptyTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  // SLA Task Card
  taskCard: {
    gap: theme.spacing.sm,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  slaBadgeText: {
    ...theme.typography.caption.sm,
    fontWeight: '700',
  },
  slaTime: {
    ...theme.typography.caption.md,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Task Info
  taskInfoBlock: {
    gap: 6,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  taskInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskInfoLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    width: 90,
  },
  taskInfoValue: {
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    flex: 1,
    fontWeight: '600',
  },

  // Rule Tag
  ruleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  ruleTagText: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  actionButtonCall: {
    backgroundColor: '#DCFCE7',
  },
  actionButtonNav: {
    backgroundColor: '#DBEAFE',
  },
  actionButtonScan: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    ...theme.typography.caption.md,
    fontWeight: '700',
  },
});
