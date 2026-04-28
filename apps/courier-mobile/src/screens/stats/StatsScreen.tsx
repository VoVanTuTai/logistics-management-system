import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatsShortcutCard } from '../../components/stats/StatsShortcutCard';
import { StatsOverviewCard } from '../../components/stats/StatsOverviewCard';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierId } from '../../utils/courier';
import { theme } from '../../theme';

export function StatsScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const onRefresh = () => void tasksQuery.refetch();
  const refreshing = tasksQuery.isRefetching;

  const tasks = tasksQuery.data ?? [];
  const totalCount = tasks.length;
  const completedCount = tasks.filter((task) => task.status === 'COMPLETED').length;
  const assignedCount = tasks.filter((task) => task.status === 'ASSIGNED').length;
  const cancelledCount = tasks.filter((task) => task.status === 'CANCELLED').length;

  const shortcutData = [
    {
      id: 'support',
      title: 'CS',
      subtitle: 'Yêu cầu hỗ trợ',
      value: `${assignedCount} phiên`,
      iconName: 'headset-outline' as const,
      iconColor: '#4338CA',
      iconBgColor: '#EEF2FF',
    },
    {
      id: 'efficiency',
      title: 'Hiệu suất',
      subtitle: 'Tỷ lệ hoàn thành',
      value: totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '0%',
      iconName: 'trending-up-outline' as const,
      iconColor: '#4F46E5',
      iconBgColor: '#EEF2FF',
    },
  ];

  const summaryData = [
    { label: 'Tổng task', value: String(totalCount) },
    { label: 'Đang xử lý', value: String(assignedCount) },
    { label: 'Đã hoàn thành', value: String(completedCount) },
    { label: 'Đã hủy', value: String(cancelledCount) },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View>
            <Text style={styles.headerTitle}>Thống kê</Text>
            <Text style={styles.headerSubtitle}>
              Tổng quan hoạt động giao nhận theo dữ liệu server
            </Text>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Lối tắt</Text>
            <View style={styles.shortcutRow}>
              {shortcutData.map((item) => (
                <StatsShortcutCard
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  value={item.value}
                  iconName={item.iconName}
                  iconColor={item.iconColor}
                  iconBgColor={item.iconBgColor}
                  onPress={() => Alert.alert(item.title, 'Đang mở shortcut')}
                />
              ))}
            </View>
          </View>

          {tasksQuery.isLoading ? (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.stateText}>Đang tải thống kê...</Text>
            </View>
          ) : null}

          {tasksQuery.isError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {tasksQuery.error instanceof Error
                  ? tasksQuery.error.message
                  : 'Không tải được thống kê.'}
              </Text>
            </View>
          ) : null}

          {!tasksQuery.isLoading && !tasksQuery.isError ? (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
              <View style={styles.overviewGrid}>
                <StatsOverviewCard
                  label="Task hoàn thành"
                  value={String(completedCount)}
                  trendText={`${totalCount} task tổng`}
                  trendType={completedCount > 0 ? 'up' : 'neutral'}
                />
                <StatsOverviewCard
                  label="Task đang xử lý"
                  value={String(assignedCount)}
                  trendText="Trạng thái ASSIGNED"
                  trendType={assignedCount > 0 ? 'up' : 'neutral'}
                />
                <StatsOverviewCard
                  label="Task bị hủy"
                  value={String(cancelledCount)}
                  trendText="Trạng thái CANCELLED"
                  trendType={cancelledCount > 0 ? 'down' : 'neutral'}
                />
              </View>
            </View>
          ) : null}

          {!tasksQuery.isLoading && !tasksQuery.isError ? (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Nhịp độ vận hành</Text>
              <View style={styles.summaryCard}>
                {summaryData.map((row, index) => (
                  <View
                    key={row.label}
                    style={[
                      styles.summaryRow,
                      index < summaryData.length - 1 && styles.summaryRowBorder,
                    ]}
                  >
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
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
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.title.md,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  sectionWrap: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
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
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body.md,
    color: theme.colors.danger,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card,
  },
  summaryRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEF6',
  },
  summaryLabel: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    ...theme.typography.subtitle.md,
    color: theme.colors.primary,
  },
});

