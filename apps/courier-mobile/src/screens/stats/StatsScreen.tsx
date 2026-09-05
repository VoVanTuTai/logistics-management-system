import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { StatsShortcutCard } from '../../components/stats/StatsShortcutCard';
import { StatsOverviewCard } from '../../components/stats/StatsOverviewCard';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import { useCodSummaryQuery } from '../../features/cod/cod.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierId } from '../../utils/courier';
import { theme } from '../../theme';

export function StatsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const accessToken = session?.tokens.accessToken ?? null;
  const tasksQuery = useAssignedTasksQuery({
    accessToken,
    courierId,
  });
  const codSummaryQuery = useCodSummaryQuery({ courierId, accessToken });
  const onRefresh = () => {
    void tasksQuery.refetch();
    void codSummaryQuery.refetch();
  };
  const refreshing = tasksQuery.isRefetching || codSummaryQuery.isRefetching;

  const tasks = tasksQuery.data ?? [];
  const totalCount = tasks.length;
  const completedCount = tasks.filter((task) => task.status === 'COMPLETED').length;
  const assignedCount = tasks.filter((task) => task.status === 'ASSIGNED').length;
  const cancelledCount = tasks.filter((task) => task.status === 'CANCELLED').length;

  const deliveryCount = tasks.filter((task) => task.taskType === 'DELIVERY').length;
  const pickupCount = tasks.filter((task) => task.taskType === 'PICKUP').length;
  const returnCount = tasks.filter((task) => task.taskType === 'RETURN').length;

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const codSummary = codSummaryQuery.data;
  const codTotalDisplay = codSummary
    ? (codSummary.collectedAmount + codSummary.remittedAmount + codSummary.pendingAmount).toLocaleString('vi-VN') + 'đ'
    : '0đ';

  const shortcutData = [
    {
      id: 'cod',
      title: 'Tiền hàng COD',
      subtitle: 'Thu hộ & Quyết toán',
      value: codTotalDisplay,
      iconName: 'cash-outline' as const,
      iconColor: '#059669',
      iconBgColor: '#ECFDF5',
      onPress: () => navigation.navigate('CodStats'),
    },
    {
      id: 'efficiency',
      title: 'Đã hoàn thành',
      subtitle: 'Xem danh sách',
      value: `${completedCount} nhiệm vụ`,
      iconName: 'checkmark-circle-outline' as const,
      iconColor: '#2563EB',
      iconBgColor: '#EFF6FF',
      onPress: () =>
        navigation.navigate('TaskList', {
          initialTaskType: 'ALL',
          initialStatus: 'COMPLETED',
        }),
    },
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <View style={styles.headerLiveDot} />
              <Text style={styles.headerBadgeText}>Dữ liệu ca trực thời gian thực</Text>
            </View>
            <Text style={styles.headerTitle}>Thống kê hiệu suất</Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              Theo dõi tiến độ hoàn thành, doanh thu COD và nhịp độ vận hành
            </Text>
          </View>

          {/* Hero Progress Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  Tiến độ ca trực
                </Text>
                <Text style={styles.heroSubtitle} numberOfLines={1}>
                  Đã hoàn tất {completedCount}/{totalCount} nhiệm vụ tiếp nhận
                </Text>
              </View>
              <View style={styles.heroRateBadge}>
                <Text style={styles.heroRateText}>{completionRate}%</Text>
              </View>
            </View>

            {/* Segmented Progress Track */}
            <View style={styles.progressBarTrack}>
              {totalCount === 0 ? (
                <View style={[styles.progressSegment, { backgroundColor: '#E2E8F0', flex: 1 }]} />
              ) : (
                <>
                  {completedCount > 0 ? (
                    <View
                      style={[
                        styles.progressSegment,
                        { backgroundColor: '#10B981', flex: completedCount },
                      ]}
                    />
                  ) : null}
                  {assignedCount > 0 ? (
                    <View
                      style={[
                        styles.progressSegment,
                        { backgroundColor: '#3B82F6', flex: assignedCount },
                      ]}
                    />
                  ) : null}
                  {cancelledCount > 0 ? (
                    <View
                      style={[
                        styles.progressSegment,
                        { backgroundColor: '#EF4444', flex: cancelledCount },
                      ]}
                    />
                  ) : null}
                </>
              )}
            </View>

            {/* Progress Legend */}
            <View style={styles.heroLegendRow}>
              <View style={styles.heroLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  Hoàn thành: {completedCount}
                </Text>
              </View>

              <View style={styles.heroLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  Đang xử lý: {assignedCount}
                </Text>
              </View>

              <View style={styles.heroLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  Đã hủy: {cancelledCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Lối tắt nhanh */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Lối tắt nhanh</Text>
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
                  onPress={item.onPress}
                />
              ))}
            </View>
          </View>

          {/* Loading state */}
          {tasksQuery.isLoading ? (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.stateText}>Đang tải thống kê ca trực...</Text>
            </View>
          ) : null}

          {/* Error state */}
          {tasksQuery.isError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {tasksQuery.error instanceof Error
                  ? tasksQuery.error.message
                  : 'Không tải được thống kê.'}
              </Text>
            </View>
          ) : null}

          {/* 2x2 Key Metric Grid */}
          {!tasksQuery.isLoading && !tasksQuery.isError ? (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Chỉ số nhiệm vụ</Text>
              <View style={styles.overviewGrid}>
                <StatsOverviewCard
                  label="Hoàn thành"
                  value={String(completedCount)}
                  trendText={totalCount > 0 ? `${completionRate}% tổng đơn` : 'Chưa có đơn'}
                  trendType={completedCount > 0 ? 'up' : 'neutral'}
                  iconName="checkmark-circle"
                  accentColor="#059669"
                  accentBgColor="#ECFDF5"
                />
                <StatsOverviewCard
                  label="Đang xử lý"
                  value={String(assignedCount)}
                  trendText={assignedCount > 0 ? 'Cần giao nhận' : 'Đã hoàn tất'}
                  trendType={assignedCount > 0 ? 'up' : 'neutral'}
                  iconName="time"
                  accentColor="#2563EB"
                  accentBgColor="#EFF6FF"
                />
                <StatsOverviewCard
                  label="Đã hủy"
                  value={String(cancelledCount)}
                  trendText={cancelledCount === 0 ? 'Không có hủy' : 'Cần kiểm tra'}
                  trendType={cancelledCount > 0 ? 'down' : 'neutral'}
                  iconName="close-circle"
                  accentColor="#DC2626"
                  accentBgColor="#FEF2F2"
                />
                <StatsOverviewCard
                  label="Tổng tiếp nhận"
                  value={String(totalCount)}
                  trendText="Nhiệm vụ ca trực"
                  trendType="neutral"
                  iconName="cube"
                  accentColor="#7C3AED"
                  accentBgColor="#F5F3FF"
                />
              </View>
            </View>
          ) : null}

          {/* Operational Breakdown */}
          {!tasksQuery.isLoading && !tasksQuery.isError ? (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Phân loại vận hành</Text>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownIconWrap, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <Ionicons name="paper-plane-outline" size={16} color="#2563EB" />
                  </View>
                  <View style={styles.breakdownTextWrap}>
                    <Text style={styles.breakdownLabel}>Đơn giao hàng (Delivery)</Text>
                    <Text style={styles.breakdownSub}>Nhiệm vụ giao đến khách hàng</Text>
                  </View>
                  <View style={styles.breakdownValueBadge}>
                    <Text style={styles.breakdownValueText}>{deliveryCount} đơn</Text>
                  </View>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownIconWrap, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Ionicons name="download-outline" size={16} color="#059669" />
                  </View>
                  <View style={styles.breakdownTextWrap}>
                    <Text style={styles.breakdownLabel}>Đơn lấy hàng (Pickup)</Text>
                    <Text style={styles.breakdownSub}>Nhiệm vụ thu gom từ chủ shop</Text>
                  </View>
                  <View style={[styles.breakdownValueBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.breakdownValueText, { color: '#059669' }]}>{pickupCount} đơn</Text>
                  </View>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownIconWrap, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <Ionicons name="return-up-back-outline" size={16} color="#D97706" />
                  </View>
                  <View style={styles.breakdownTextWrap}>
                    <Text style={styles.breakdownLabel}>Đơn chuyển hoàn (Return)</Text>
                    <Text style={styles.breakdownSub}>Hàng trả về bưu cục / kho</Text>
                  </View>
                  <View style={[styles.breakdownValueBadge, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <Text style={[styles.breakdownValueText, { color: '#D97706' }]}>{returnCount} đơn</Text>
                  </View>
                </View>

                <View style={styles.breakdownDivider} />

                <Pressable
                  style={({ pressed }) => [
                    styles.viewAllTasksBtn,
                    pressed && styles.viewAllTasksBtnPressed,
                  ]}
                  onPress={() => navigation.navigate('TaskList', { initialTaskType: 'ALL' })}
                >
                  <Text style={styles.viewAllTasksText}>Xem toàn bộ danh sách nhiệm vụ</Text>
                  <Ionicons name="chevron-forward" size={15} color={theme.colors.primary} />
                </Pressable>
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
    backgroundColor: '#F4F8FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  header: {
    gap: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    marginBottom: 2,
  },
  headerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  headerTitle: {
    ...theme.typography.title.md,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: theme.spacing.md,
    gap: 12,
    ...theme.shadow.card,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  heroRateBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    flexShrink: 0,
  },
  heroRateText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 2,
  },
  progressSegment: {
    height: '100%',
    borderRadius: 3,
  },
  heroLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  heroLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  sectionWrap: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  centeredBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#DFE7F2',
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
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  breakdownIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  breakdownTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  breakdownSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  breakdownValueBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    flexShrink: 0,
  },
  breakdownValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  viewAllTasksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  viewAllTasksBtnPressed: {
    opacity: 0.75,
  },
  viewAllTasksText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
