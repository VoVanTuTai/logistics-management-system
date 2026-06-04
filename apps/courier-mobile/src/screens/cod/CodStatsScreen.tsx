import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  useCodSummaryQuery,
  useCodRecordsQuery,
  useCompanyBankInfoQuery,
  useDailySettlementQuery,
  useCreateSettlementMutation,
} from '../../features/cod/cod.queries';
import type { CodRecordDto } from '../../features/cod/cod.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { resolveCourierId } from '../../utils/courier';
import { appEnv } from '../../utils/env';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'CodStats'>;

/* ── helpers ─────────────────────────────────────────── */

function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}
function BreakdownRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}): React.JSX.Element {
  return (
    <View style={s.breakdownRow}>
      <View style={[s.breakdownDot, { backgroundColor: color }]} />
      <Text style={s.breakdownLabel}>{label}</Text>
      <Text style={[s.breakdownValue, { color }]}>{value}</Text>
    </View>
  );
}

/* ── Main screen ─────────────────────────────────────── */

export function CodStatsScreen({ navigation }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const accessToken = session?.tokens.accessToken ?? null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const summaryQuery = useCodSummaryQuery({ courierId, accessToken });
  const recordsQuery = useCodRecordsQuery({ courierId, accessToken });
  const bankInfoQuery = useCompanyBankInfoQuery({ accessToken });

  // Auto-polling state when active settlement batch is waiting for payment
  const [shouldPoll, setShouldPoll] = React.useState(false);
  const lastActiveBatchId = React.useRef<string | null>(null);

  const dailySettlementQuery = useDailySettlementQuery({
    courierId,
    date: todayStr,
    accessToken,
    refetchInterval: shouldPoll ? 2000 : false,
  });
  const createSettlementMutation = useCreateSettlementMutation(accessToken);

  const onRefresh = () => {
    void summaryQuery.refetch();
    void recordsQuery.refetch();
    void dailySettlementQuery.refetch();
  };
  const refreshing =
    summaryQuery.isRefetching ||
    recordsQuery.isRefetching ||
    dailySettlementQuery.isRefetching;

  const summary = summaryQuery.data;
  const records = recordsQuery.data ?? [];
  const bankInfo = bankInfoQuery.data;
  const dailySettlement = dailySettlementQuery.data;

  // Monitor settlement status changes
  React.useEffect(() => {
    const activeBatch = dailySettlement?.batches?.find((b) => b.status === 'WAITING_PAYMENT');

    if (activeBatch) {
      lastActiveBatchId.current = activeBatch.id;
      setShouldPoll(true);
    } else {
      if (lastActiveBatchId.current) {
        Alert.alert(
          'Quyết toán thành công',
          'Hệ thống đã nhận được tiền mặt nộp quyết toán của bạn qua chuyển khoản SePay.',
        );
        void summaryQuery.refetch();
        void recordsQuery.refetch();
        lastActiveBatchId.current = null;
      }
      setShouldPoll(false);
    }
  }, [dailySettlement, summaryQuery, recordsQuery]);

  /* ── Compute per-method breakdown from records ─────── */

  const cashRecords = records.filter((r) => r.paymentMethod === 'COD');
  const bankRecords = records.filter((r) => r.paymentMethod === 'BANK_TRANSFER');

  const sumAmount = (list: CodRecordDto[], statuses: string[]) =>
    list
      .filter((r) => statuses.includes(r.status))
      .reduce((sum, r) => sum + (r.collectedAmount ?? r.codAmount), 0);

  const countByStatus = (list: CodRecordDto[], status: string) =>
    list.filter((r) => r.status === status).length;

  const cashCollected = sumAmount(cashRecords, ['COLLECTED']);
  const cashRemitted = sumAmount(cashRecords, ['REMITTED']);
  const cashPending = sumAmount(cashRecords, ['PENDING']);
  const cashTotal = cashCollected + cashRemitted + cashPending;

  const bankCollected = sumAmount(bankRecords, ['COLLECTED']);
  const bankRemitted = sumAmount(bankRecords, ['REMITTED']);
  const bankPending = sumAmount(bankRecords, ['PENDING']);
  const bankTotal = bankCollected + bankRemitted + bankPending;

  const grandTotal = (summary?.pendingAmount ?? 0)
    + (summary?.collectedAmount ?? 0)
    + (summary?.remittedAmount ?? 0);

  const activeBatch = dailySettlement?.batches?.find((b) => b.status === 'WAITING_PAYMENT');

  // Cash that courier still holds and needs to remit
  const cashNeedRemit = cashCollected;

  // VietQR for remitting cash
  const qrMemo = activeBatch ? activeBatch.transferMemo : '';
  const qrUrl = activeBatch ? activeBatch.qrUrl : null;

  const handleCreateSettlement = async () => {
    const collectedCashRecords = cashRecords.filter((r) => r.status === 'COLLECTED');
    const shipmentCodes = collectedCashRecords.map((r) => r.shipmentCode);

    if (shipmentCodes.length === 0) {
      Alert.alert('Thông báo', 'Không có đơn tiền mặt nào cần nộp.');
      return;
    }

    try {
      await createSettlementMutation.mutateAsync({
        reportDate: todayStr,
        hubCode: session?.user.hubCodes?.[0] ?? 'UNKNOWN',
        courierId: courierId ?? 'UNKNOWN',
        shipmentCodes,
        createdBy: session?.user.username ?? 'UNKNOWN',
      });
      Alert.alert('Thành công', 'Đã tạo yêu cầu quyết toán. Vui lòng quét mã QR chuyển khoản nộp tiền.');
      void dailySettlementQuery.refetch();
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể tạo yêu cầu nộp tiền.');
    }
  };

  const isLoading = summaryQuery.isLoading || recordsQuery.isLoading;

  return (
    <SafeAreaView edges={['top']} style={s.safeArea}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Header ──────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Tiền hàng COD</Text>
          <Text style={s.headerSubtitle}>
            Thống kê thu hộ hôm nay — tiền mặt & chuyển khoản
          </Text>
        </View>

        {/* ── Loading ─────────────────────────────────── */}
        {isLoading ? (
          <View style={s.loadingBlock}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={s.loadingText}>Đang tải thống kê...</Text>
          </View>
        ) : null}

        {/* ── Grand total banner ──────────────────────── */}
        {!isLoading && summary ? (
          <View style={s.grandBanner}>
            <Ionicons name="wallet-outline" size={22} color="rgba(255,255,255,0.85)" />
            <Text style={s.grandLabel}>Tổng tiền hàng hôm nay</Text>
            <Text style={s.grandAmount}>{formatVnd(grandTotal)}</Text>
            <View style={s.grandRow}>
              <View style={s.grandChip}>
                <View style={[s.chipDot, { backgroundColor: '#34D399' }]} />
                <Text style={s.grandChipText}>
                  Đã thu {formatVnd(summary.collectedAmount + summary.remittedAmount)}
                </Text>
              </View>
              <View style={s.grandChip}>
                <View style={[s.chipDot, { backgroundColor: '#FBBF24' }]} />
                <Text style={s.grandChipText}>
                  Chờ thu {formatVnd(summary.pendingAmount)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ═══════════════════════════════════════════════
            SECTION 1: TIỀN MẶT
            ═══════════════════════════════════════════════ */}
        {!isLoading ? (
          <View style={s.methodSection}>
            {/* Section header */}
            <View style={s.methodHeader}>
              <View style={[s.methodIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cash-outline" size={20} color="#D97706" />
              </View>
              <View style={s.methodHeaderText}>
                <Text style={s.methodTitle}>Tiền mặt</Text>
                <Text style={s.methodSubtitle}>
                  {cashRecords.length} đơn · {formatVnd(cashTotal)}
                </Text>
              </View>
            </View>

            {/* Cash breakdown card */}
            <View style={s.breakdownCard}>
              <BreakdownRow
                label={`Chờ thu (${countByStatus(cashRecords, 'PENDING')})`}
                value={formatVnd(cashPending)}
                color="#F59E0B"
              />
              <View style={s.breakdownDivider} />
              <BreakdownRow
                label={`Đã thu (${countByStatus(cashRecords, 'COLLECTED')})`}
                value={formatVnd(cashCollected)}
                color="#10B981"
              />
              <View style={s.breakdownDivider} />
              <BreakdownRow
                label={`Đã nộp (${countByStatus(cashRecords, 'REMITTED')})`}
                value={formatVnd(cashRemitted)}
                color="#3B82F6"
              />
            </View>

            {/* Cash remit QR banner — only when courier holds cash or has an active batch */}
            {activeBatch ? (
              <View style={s.remitBanner}>
                <View style={s.remitBannerHeader}>
                  <Ionicons name="alert-circle-outline" size={20} color="#FFF" />
                  <Text style={s.remitBannerTitle}>Cần nộp tiền mặt (Có mã QR)</Text>
                </View>
                <Text style={s.remitBannerAmount}>
                  {formatVnd(activeBatch.totalAmount)}
                </Text>
                <Text style={s.remitBannerHint}>
                  Quét mã QR bên dưới để chuyển khoản nộp tiền về công ty
                </Text>

                {qrUrl ? (
                  <View style={s.qrContainer}>
                    <Image
                      source={{ uri: qrUrl }}
                      style={s.qrImage}
                      resizeMode="contain"
                    />
                    <View style={s.pollingStatusBlock}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={s.pollingStatusText}>Đang chờ xác nhận giao dịch SePay...</Text>
                    </View>
                    {bankInfo ? (
                      <View style={s.bankInfoBlock}>
                        <Text style={s.bankInfoText}>
                          {bankInfo.bankName} — {bankInfo.accountNumber}
                        </Text>
                        <Text style={s.bankInfoText}>
                          {bankInfo.accountName}
                        </Text>
                        <Text style={s.bankInfoMemo}>ND: {qrMemo}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : cashNeedRemit > 0 ? (
              <View style={s.remitBanner}>
                <View style={s.remitBannerHeader}>
                  <Ionicons name="alert-circle-outline" size={20} color="#FFF" />
                  <Text style={s.remitBannerTitle}>Cần nộp tiền mặt</Text>
                </View>
                <Text style={s.remitBannerAmount}>
                  {formatVnd(cashNeedRemit)}
                </Text>
                <Text style={s.remitBannerHint}>
                  Nhấn nút bên dưới để tạo mã quyết toán và QR chuyển tiền về công ty.
                </Text>
                <Pressable
                  onPress={() => {
                    void handleCreateSettlement();
                  }}
                  disabled={createSettlementMutation.isPending}
                  style={({ pressed }) => [
                    s.remitButton,
                    pressed && s.remitButtonPressed,
                    createSettlementMutation.isPending && s.remitButtonDisabled,
                  ]}
                >
                  {createSettlementMutation.isPending ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <Text style={s.remitButtonText}>Tạo QR nộp tiền mặt</Text>
                  )}
                </Pressable>
              </View>
            ) : cashRecords.length > 0 ? (
              <View style={s.allDoneBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={s.allDoneText}>Đã nộp hết tiền mặt 👍</Text>
              </View>
            ) : null}


          </View>
        ) : null}

        {/* ═══════════════════════════════════════════════
            SECTION 2: CHUYỂN KHOẢN
            ═══════════════════════════════════════════════ */}
        {!isLoading ? (
          <View style={s.methodSection}>
            {/* Section header */}
            <View style={s.methodHeader}>
              <View style={[s.methodIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="card-outline" size={20} color="#2563EB" />
              </View>
              <View style={s.methodHeaderText}>
                <Text style={s.methodTitle}>Chuyển khoản</Text>
                <Text style={s.methodSubtitle}>
                  {bankRecords.length} đơn · {formatVnd(bankTotal)}
                </Text>
              </View>
            </View>

            {/* Bank transfer breakdown card */}
            <View style={s.breakdownCard}>
              <BreakdownRow
                label={`Chờ xác nhận (${countByStatus(bankRecords, 'PENDING')})`}
                value={formatVnd(bankPending)}
                color="#F59E0B"
              />
              <View style={s.breakdownDivider} />
              <BreakdownRow
                label={`Đã xác nhận (${countByStatus(bankRecords, 'COLLECTED')})`}
                value={formatVnd(bankCollected)}
                color="#10B981"
              />
              <View style={s.breakdownDivider} />
              <BreakdownRow
                label={`Đã đối soát (${countByStatus(bankRecords, 'REMITTED')})`}
                value={formatVnd(bankRemitted)}
                color="#3B82F6"
              />
            </View>

            {bankRecords.length > 0 ? (
              <View style={s.bankInfoNote}>
                <Ionicons name="information-circle-outline" size={16} color="#6366F1" />
                <Text style={s.bankInfoNoteText}>
                  Tiền chuyển khoản đã vào tài khoản công ty, không cần nộp thêm.
                </Text>
              </View>
            ) : null}


          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ───────────────────────────────────────────── */

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.lg,
  },

  /* header */
  header: { gap: 2 },
  headerTitle: {
    ...theme.typography.title.md,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
  },

  /* loading */
  loadingBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  loadingText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },

  /* grand total banner */
  grandBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: 6,
    ...theme.shadow.md,
  },
  grandLabel: {
    ...theme.typography.body.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  grandAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  grandRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  grandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  grandChipText: {
    ...theme.typography.caption.sm,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* method section wrapper */
  methodSection: {
    gap: theme.spacing.sm,
  },

  /* method header */
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodHeaderText: {
    flex: 1,
  },
  methodTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  methodSubtitle: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },

  /* breakdown card */
  breakdownCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadow.card,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  breakdownLabel: {
    ...theme.typography.body.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  breakdownValue: {
    ...theme.typography.subtitle.md,
    fontWeight: '800',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* cash remit banner */
  remitBanner: {
    backgroundColor: '#DC2626',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  remitBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remitBannerTitle: {
    ...theme.typography.subtitle.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  remitBannerAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  remitBannerHint: {
    ...theme.typography.body.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  remitButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  remitButtonPressed: {
    opacity: 0.85,
  },
  remitButtonDisabled: {
    opacity: 0.6,
  },
  remitButtonText: {
    ...theme.typography.body.md,
    color: '#DC2626',
    fontWeight: '700',
  },
  qrContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  qrImage: {
    width: 220,
    height: 260,
  },
  pollingStatusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pollingStatusText: {
    ...theme.typography.caption.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  bankInfoBlock: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  bankInfoText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  bankInfoMemo: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
    marginTop: 4,
  },

  /* all-done */
  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: theme.spacing.md,
  },
  allDoneText: {
    ...theme.typography.body.md,
    color: '#059669',
    fontWeight: '600',
  },

  /* bank info note */
  bankInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: theme.spacing.md,
  },
  bankInfoNoteText: {
    ...theme.typography.body.sm,
    color: '#4338CA',
    flex: 1,
  },

  /* record list + card */
  recordList: {
    gap: theme.spacing.sm,
  },
  recordCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: 6,
  },
  recordShipmentCode: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordBody: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: 4,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 26,
  },
  recordLabel: {
    ...theme.typography.body.sm,
    color: theme.colors.textMuted,
  },
  recordAmount: {
    ...theme.typography.body.sm,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  pmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* empty */
  emptyBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
  },
});
