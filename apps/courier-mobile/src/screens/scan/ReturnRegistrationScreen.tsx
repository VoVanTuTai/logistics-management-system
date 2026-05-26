import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BarcodeScanningResult } from 'expo-camera';
import { useQuery } from '@tanstack/react-query';

import { CameraScannerModal } from '../../components/scan/CameraScannerModal';
import { deliveryApi } from '../../features/delivery/delivery.api';
import {
  getReturnReasonSourceLabel,
  resolveReturnReasonFromNdrCases,
  resolveReturnReasonFromShipmentMetadata,
  RETURN_REASON_OPTIONS,
} from '../../features/delivery/return-reasons';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { useShipmentDetailQuery } from '../../features/shipment/shipment.queries';
import type { ShipmentDto, ShipmentMetadata } from '../../features/shipment/shipment.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierDisplayName, resolveCourierId } from '../../utils/courier';
import { appEnv } from '../../utils/env';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'ReturnRegistration'>;

interface PartyInfo {
  title: string;
  name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  address: string;
}

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readMetadataString(
  metadata: ShipmentMetadata | null,
  paths: string[],
): string | null {
  for (const path of paths) {
    const keys = path.split('.');
    let cursor: unknown = metadata;

    for (const key of keys) {
      if (!cursor || typeof cursor !== 'object' || !(key in cursor)) {
        cursor = null;
        break;
      }

      cursor = (cursor as Record<string, unknown>)[key];
    }

    const value = asString(cursor);
    if (value) {
      return value;
    }
  }

  return null;
}

function buildSenderInfo(shipment: ShipmentDto | null | undefined): PartyInfo {
  const metadata = shipment?.metadata ?? null;
  const sender = asRecord(metadata?.sender);

  return {
    title: 'Người gửi',
    name: asString(sender?.name) ?? readMetadataString(metadata, ['senderName']) ?? 'Chưa có',
    phone: asString(sender?.phone) ?? readMetadataString(metadata, ['senderPhone']) ?? 'Chưa có',
    province:
      asString(sender?.province) ??
      readMetadataString(metadata, ['senderProvince', 'routing.originProvince']) ??
      'Chưa có',
    district: asString(sender?.district) ?? readMetadataString(metadata, ['senderDistrict']) ?? 'Chưa có',
    ward: asString(sender?.ward) ?? readMetadataString(metadata, ['senderWard']) ?? 'Chưa có',
    address:
      asString(sender?.address) ??
      readMetadataString(metadata, ['senderAddress', 'pickup.address']) ??
      'Chưa có',
  };
}

function buildReceiverInfo(shipment: ShipmentDto | null | undefined): PartyInfo {
  const metadata = shipment?.metadata ?? null;
  const receiver = asRecord(metadata?.receiver);

  return {
    title: 'Người nhận',
    name: asString(receiver?.name) ?? readMetadataString(metadata, ['receiverName']) ?? 'Chưa có',
    phone: asString(receiver?.phone) ?? readMetadataString(metadata, ['receiverPhone']) ?? 'Chưa có',
    province:
      asString(receiver?.province) ??
      asString(receiver?.region) ??
      readMetadataString(metadata, ['receiverRegion', 'receiverProvince', 'routing.destinationProvince']) ??
      'Chưa có',
    district: asString(receiver?.district) ?? readMetadataString(metadata, ['receiverDistrict']) ?? 'Chưa có',
    ward: asString(receiver?.ward) ?? readMetadataString(metadata, ['receiverWard']) ?? 'Chưa có',
    address:
      asString(receiver?.address) ??
      readMetadataString(metadata, ['receiverAddress', 'delivery.address']) ??
      'Chưa có',
  };
}

function buildReturnAuditNote(input: {
  employeeName: string;
  employeeId: string;
  hubCode: string;
  reasonCode: string;
  reasonSource: string;
  reason: string;
  ndrCaseId?: string | null;
}): string {
  return [
    'Đăng ký chuyển hoàn',
    `Nguồn nguyên nhân: ${input.reasonSource}`,
    `Mã lý do: ${input.reasonCode}`,
    `Nhân viên: ${input.employeeName}`,
    `Mã NV: ${input.employeeId}`,
    `Mã hub: ${input.hubCode || 'N/A'}`,
    input.ndrCaseId ? `NDR: ${input.ndrCaseId}` : null,
    `Ghi chú: ${input.reason}`,
  ]
    .filter(Boolean)
    .join(' | ');
}

function PartyCard({ party }: { party: PartyInfo }): React.JSX.Element {
  return (
    <View style={styles.partyCard}>
      <Text style={styles.partyTitle}>{party.title}</Text>
      <View style={styles.infoGrid}>
        <InfoRow label="Tên" value={party.name} />
        <InfoRow label="SĐT" value={party.phone} />
        <InfoRow label="Tỉnh/TP" value={party.province} />
        <InfoRow label="Quận/Huyện" value={party.district} />
        <InfoRow label="Phường/Xã" value={party.ward} />
        <InfoRow label="Địa chỉ" value={party.address} wide />
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}): React.JSX.Element {
  return (
    <View style={[styles.infoRow, wide && styles.infoRowWide]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function ReturnRegistrationScreen({ route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const accessToken = session?.tokens.accessToken ?? null;
  const initialShipmentCode = normalizeCode(route.params?.shipmentCode);
  const [inputCode, setInputCode] = React.useState(initialShipmentCode);
  const [queryCode, setQueryCode] = React.useState(initialShipmentCode);
  const [selectedReasonId, setSelectedReasonId] = React.useState<string>(
    RETURN_REASON_OPTIONS[0].id,
  );
  const [reasonText, setReasonText] = React.useState<string>(
    RETURN_REASON_OPTIONS[0].label,
  );
  const [linkedNdrCaseId, setLinkedNdrCaseId] = React.useState<string | null>(null);
  const [hasWorkflowReason, setHasWorkflowReason] = React.useState(false);
  const [scannerVisible, setScannerVisible] = React.useState(false);
  const [scannerError, setScannerError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const shipmentQuery = useShipmentDetailQuery({
    accessToken,
    shipmentCode: queryCode || null,
  });
  const ndrCasesQuery = useQuery({
    enabled: Boolean(accessToken && queryCode && shipmentQuery.data),
    queryKey: ['return-registration-ndr-cases', queryCode],
    queryFn: () => deliveryApi.listNdrCases(accessToken as string, queryCode),
  });
  const sender = buildSenderInfo(shipmentQuery.data);
  const receiver = buildReceiverInfo(shipmentQuery.data);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const employeeName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const employeeId = session?.user.username ?? courierId ?? 'N/A';
  const hubCode = session?.user.hubCodes?.[0]?.trim().toUpperCase() ?? '';
  const selectedReason =
    RETURN_REASON_OPTIONS.find((reason) => reason.id === selectedReasonId) ??
    RETURN_REASON_OPTIONS[0];
  const isCheckingWorkflowReason = ndrCasesQuery.isFetching;
  const canSubmitReturnRegistration =
    Boolean(shipmentQuery.data) &&
    hasWorkflowReason &&
    !ndrCasesQuery.isError &&
    !isCheckingWorkflowReason &&
    !isSubmitting;

  React.useEffect(() => {
    if (!shipmentQuery.data) {
      return;
    }

    const resolvedReason =
      resolveReturnReasonFromNdrCases(ndrCasesQuery.data) ??
      resolveReturnReasonFromShipmentMetadata(shipmentQuery.data.metadata);
    const nextReason = resolvedReason?.option ?? RETURN_REASON_OPTIONS[0];

    setSelectedReasonId(nextReason.id);
    setReasonText(resolvedReason?.note ?? nextReason.label);
    setLinkedNdrCaseId(resolvedReason?.ndrCaseId ?? null);
    setHasWorkflowReason(Boolean(resolvedReason));
  }, [ndrCasesQuery.data, shipmentQuery.data]);

  const handleSearch = () => {
    const normalizedCode = normalizeCode(inputCode);
    if (!normalizedCode) {
      setMessage('Vui lòng nhập mã vận đơn.');
      return;
    }

    setInputCode(normalizedCode);
    setQueryCode(normalizedCode);
    setLinkedNdrCaseId(null);
    setHasWorkflowReason(false);
    setMessage(null);
  };

  const handleScanned = (result: BarcodeScanningResult) => {
    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      setScannerError('Không đọc được mã hợp lệ. Vui lòng thử lại.');
      return;
    }

    const normalizedCode = normalizeCode(parsed.value);
    setInputCode(normalizedCode);
    setQueryCode(normalizedCode);
    setLinkedNdrCaseId(null);
    setHasWorkflowReason(false);
    setScannerError(null);
    setScannerVisible(false);
    setMessage(`Đã quét vận đơn ${normalizedCode}.`);
  };

  const resetForm = () => {
    setInputCode('');
    setQueryCode('');
    setSelectedReasonId(RETURN_REASON_OPTIONS[0].id);
    setReasonText(RETURN_REASON_OPTIONS[0].label);
    setLinkedNdrCaseId(null);
    setHasWorkflowReason(false);
    setScannerError(null);
    setMessage(null);
  };

  const submitReturnRegistration = async () => {
    const normalizedCode = normalizeCode(queryCode || inputCode);
    const finalReason = reasonText.trim() || selectedReason.label;

    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!normalizedCode || !shipmentQuery.data) {
      setMessage('Vui lòng tìm kiếm mã vận đơn trước khi đăng ký chuyển hoàn.');
      return;
    }

    if (!finalReason) {
      setMessage('Vui lòng chọn hoặc nhập nguyên nhân chuyển hoàn.');
      return;
    }

    if (isCheckingWorkflowReason) {
      setMessage('Đang kiểm tra NDR/vấn đề của vận đơn. Vui lòng chờ hoàn tất.');
      return;
    }

    if (ndrCasesQuery.isError) {
      setMessage('Không kiểm tra được NDR/vấn đề của vận đơn. Vui lòng thử lại.');
      return;
    }

    if (!hasWorkflowReason) {
      setMessage('Vận đơn chưa có NDR/vấn đề hoặc ghi nhận giao thất bại. Vui lòng tạo trước khi đăng ký chuyển hoàn.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await deliveryApi.createReturnCase(accessToken, {
        shipmentCode: normalizedCode,
        ndrCaseId: linkedNdrCaseId,
        note: buildReturnAuditNote({
          employeeName,
          employeeId,
          hubCode,
          reasonCode: selectedReason.code,
          reasonSource: getReturnReasonSourceLabel(selectedReason.source),
          reason: finalReason,
          ndrCaseId: linkedNdrCaseId,
        }),
      });
      setMessage(`Đã đăng ký chuyển hoàn cho vận đơn ${normalizedCode}.`);
      setInputCode('');
      setQueryCode('');
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'Đăng ký chuyển hoàn thất bại.';
      setMessage(nextMessage);
      setGlobalError(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraScannerModal
        visible={scannerVisible}
        title="Quét mã đăng ký chuyển hoàn"
        helperText="Quét QR/barcode mã vận đơn cần đăng ký chuyển hoàn."
        onClose={() => setScannerVisible(false)}
        onScanned={handleScanned}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="return-up-back-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.screenTitle}>Đăng ký chuyển hoàn</Text>
            <Text style={styles.screenSubtitle}>
              Tìm vận đơn, kiểm tra thông tin gốc và tạo hồ sơ chuyển hoàn.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin đề xuất</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={inputCode}
              onChangeText={setInputCode}
              placeholder="Nhập mã vận đơn"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              style={styles.input}
            />
            <Pressable onPress={() => setScannerVisible(true)} style={styles.iconButton}>
              <Ionicons name="scan-outline" size={18} color={theme.colors.primary} />
            </Pressable>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              disabled={shipmentQuery.isFetching}
              onPress={handleSearch}
              style={[styles.secondaryButton, shipmentQuery.isFetching && styles.buttonDisabled]}
            >
              {shipmentQuery.isFetching ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="search-outline" size={16} color={theme.colors.primary} />
              )}
              <Text style={styles.secondaryButtonText}>
                {shipmentQuery.isFetching ? 'Đang tìm' : 'Tìm kiếm'}
              </Text>
            </Pressable>
            <Pressable onPress={resetForm} style={styles.resetButton}>
              <Ionicons name="refresh-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.resetButtonText}>Làm mới</Text>
            </Pressable>
          </View>
          {shipmentQuery.isError ? (
            <Text style={styles.errorText}>
              {shipmentQuery.error instanceof Error
                ? shipmentQuery.error.message
                : 'Không tìm thấy vận đơn.'}
            </Text>
          ) : null}
          {scannerError ? <Text style={styles.errorText}>{scannerError}</Text> : null}
        </View>

        {shipmentQuery.data ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Thông tin người gửi - nhận hóa đơn gốc</Text>
              <PartyCard party={sender} />
              <PartyCard party={receiver} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Thông tin người gửi/người nhận đơn hàng mới</Text>
              <PartyCard party={{ ...receiver, title: 'Người gửi mới' }} />
              <PartyCard party={{ ...sender, title: 'Người nhận mới' }} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Nội dung yêu cầu chuyển hoàn</Text>
              <Text style={styles.fieldLabel}>Nguyên nhân từ giao thất bại / vấn đề</Text>
              <View style={styles.reasonList}>
                {RETURN_REASON_OPTIONS.map((reason) => {
                  const selected = selectedReasonId === reason.id;
                  return (
                    <Pressable
                      key={reason.id}
                      disabled
                      style={[styles.reasonItem, selected && styles.reasonItemSelected]}
                    >
                      <View style={styles.reasonTextBlock}>
                        <Text
                          style={[
                            styles.reasonText,
                            selected && styles.reasonTextSelected,
                          ]}
                        >
                          {reason.label}
                        </Text>
                        <Text style={styles.reasonMeta}>
                          {getReturnReasonSourceLabel(reason.source)} · {reason.code}
                        </Text>
                      </View>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              {ndrCasesQuery.isFetching ? (
                <Text style={styles.reasonHint}>Đang kiểm tra NDR/vấn đề gần nhất...</Text>
              ) : ndrCasesQuery.isError ? (
                <Text style={styles.reasonHint}>
                  Không kiểm tra được NDR/vấn đề. Vui lòng tìm kiếm lại vận đơn.
                </Text>
              ) : linkedNdrCaseId ? (
                <Text style={styles.reasonHint}>
                  Đã lấy nguyên nhân từ NDR {linkedNdrCaseId}.
                </Text>
              ) : hasWorkflowReason ? (
                <Text style={styles.reasonHint}>
                  Đã lấy nguyên nhân từ dữ liệu giao thất bại/vấn đề của vận đơn.
                </Text>
              ) : (
                <Text style={styles.reasonHint}>
                  Chưa tìm thấy NDR/vấn đề. Vui lòng tạo “Vấn đề” hoặc ghi nhận giao thất bại trước khi đăng ký chuyển hoàn.
                </Text>
              )}

              <Text style={styles.fieldLabel}>Ghi chú nguyên nhân</Text>
              <TextInput
                value={reasonText}
                onChangeText={setReasonText}
                multiline
                placeholder="Nhập ghi chú nguyên nhân chuyển hoàn"
                placeholderTextColor="#9CA3AF"
                style={styles.textArea}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={28} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Nhập hoặc quét mã vận đơn để bắt đầu.</Text>
          </View>
        )}

        {message ? <Text style={styles.infoText}>{message}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!canSubmitReturnRegistration}
          onPress={submitReturnRegistration}
          style={[
            styles.submitButton,
            !canSubmitReturnRegistration && styles.buttonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.submitButtonText}>Lưu đăng ký</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  headerCard: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
    ...theme.shadow.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTextBlock: {
    flex: 1,
  },
  screenTitle: {
    ...theme.typography.title.sm,
    color: theme.colors.textInverse,
  },
  screenSubtitle: {
    ...theme.typography.body.sm,
    color: '#DBEAFE',
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  sectionTitle: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.infoSurface,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  secondaryButton: {
    minHeight: 40,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.infoSurface,
  },
  secondaryButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.primary,
  },
  resetButton: {
    minHeight: 40,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: '#F1F5F9',
  },
  resetButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  partyCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    marginTop: theme.spacing.sm,
  },
  partyTitle: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  infoGrid: {
    gap: theme.spacing.xs,
  },
  infoRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  infoRowWide: {
    minHeight: 48,
  },
  infoLabel: {
    width: 90,
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  infoValue: {
    flex: 1,
    ...theme.typography.body.sm,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  fieldLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  reasonList: {
    gap: theme.spacing.xs,
  },
  reasonItem: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  reasonItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.infoSurface,
  },
  reasonTextBlock: {
    flex: 1,
    gap: 2,
  },
  reasonText: {
    ...theme.typography.body.sm,
    color: theme.colors.textSecondary,
  },
  reasonTextSelected: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  reasonMeta: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
  },
  reasonHint: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  textArea: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  emptyCard: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  emptyText: {
    ...theme.typography.body.sm,
    color: theme.colors.textMuted,
  },
  infoText: {
    ...theme.typography.caption.md,
    color: theme.colors.info,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.caption.md,
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  submitButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  submitButtonText: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.textInverse,
  },
});
