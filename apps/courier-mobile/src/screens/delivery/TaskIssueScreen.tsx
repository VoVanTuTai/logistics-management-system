import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { submitDeliveryFailAction } from '../../features/delivery/delivery-fail.api';
import { enqueueDeliveryFailOffline } from '../../features/delivery/delivery-fail.offline';
import { reportShipmentException } from '../../features/delivery/shipment-exception.api';
import type {
  DeliveryFailPayload,
  IssueAttachmentPayload,
} from '../../features/delivery/delivery.types';
import {
  DELIVERY_FAIL_RETURN_REASONS,
  SCAN_ISSUE_RETURN_REASONS,
  type ReturnReasonSource,
} from '../../features/delivery/return-reasons';
import { useShipmentDetailQuery } from '../../features/shipment/shipment.queries';
import type { ShipmentMetadata } from '../../features/shipment/shipment.types';
import { tasksApi } from '../../features/tasks/tasks.api';
import { useTaskDetailQuery } from '../../features/tasks/tasks.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import {
  buildDeliveryFailAuditNote,
  buildShipmentIssueAuditNote,
  resolveCourierDisplayName,
  resolveCourierId,
} from '../../utils/courier';
import { appEnv } from '../../utils/env';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'TaskIssue'>;

interface IssueOption {
  id: string;
  title: string;
  description: string;
  issueType: string;
  source: ReturnReasonSource;
  issueCategory: 'PHYSICAL' | 'INFORMATION' | 'SYSTEM';
}

const DELIVERY_ISSUE_OPTIONS: IssueOption[] = DELIVERY_FAIL_RETURN_REASONS.map(
  (reason) => ({
    id: reason.id,
    title: reason.label,
    description: reason.description,
    issueType: reason.code,
    source: 'DELIVERY_FAIL',
    issueCategory: 'INFORMATION',
  }),
);

const SCAN_ISSUE_OPTIONS: IssueOption[] = SCAN_ISSUE_RETURN_REASONS.map(
  (reason) => ({
    id: reason.id,
    title: reason.label,
    description: reason.description,
    issueType: reason.code,
    source: 'SCAN_ISSUE',
    issueCategory: reason.issueCategory ?? 'INFORMATION',
  }),
);

const ISSUE_OPTIONS: IssueOption[] = [
  ...DELIVERY_ISSUE_OPTIONS,
  ...SCAN_ISSUE_OPTIONS,
];

const QUICK_RESCHEDULE_DAYS = [
  { offsetDays: 1, label: 'Ngày mai' },
  { offsetDays: 2, label: 'Ngày kia' },
  { offsetDays: 3, label: '+3 ngày' },
  { offsetDays: 4, label: '+4 ngày' },
  { offsetDays: 5, label: '+5 ngày' },
] as const;

const RESCHEDULE_TIME_SLOTS = [
  { value: '09:00', label: 'Ca sáng (09:00)' },
  { value: '14:00', label: 'Ca chiều (14:00)' },
  { value: '18:30', label: 'Ca tối (18:30)' },
] as const;

interface LocalAttachment {
  uri: string;
  type: string;
  name: string;
}

function formatYmdLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseYmdLocal(ymd: string): Date | null {
  const trimmed = ymd.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function addDaysToYmd(ymd: string, deltaDays: number): string {
  const base = parseYmdLocal(ymd) ?? new Date();
  const next = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + deltaDays,
  );
  return formatYmdLocal(next);
}

function getTodayYmd(): string {
  return formatYmdLocal(new Date());
}

function formatDdMm(ymd: string): string {
  const parsed = parseYmdLocal(ymd);
  if (!parsed) {
    return ymd;
  }
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function formatDdMmYyyy(ymd: string): string {
  const parsed = parseYmdLocal(ymd);
  if (!parsed) {
    return ymd;
  }
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function buildRescheduleIso(ymd: string, timeSlot: string): string | null {
  const datePart = parseYmdLocal(ymd);
  if (!datePart) {
    return null;
  }

  const [hhRaw, mmRaw] = timeSlot.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    return null;
  }

  const combined = new Date(
    datePart.getFullYear(),
    datePart.getMonth(),
    datePart.getDate(),
    hh,
    mm,
    0,
    0,
  );
  return Number.isNaN(combined.getTime()) ? null : combined.toISOString();
}

function readMetadataPath(
  metadata: ShipmentMetadata | null,
  path: string,
): unknown {
  if (!metadata) {
    return null;
  }

  const keys = path.split('.');
  let current: unknown = metadata;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function readMetadataString(
  metadata: ShipmentMetadata | null,
  paths: string[],
): string | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export function TaskIssueScreen({ navigation, route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView | null>(null);
  const taskQuery = useTaskDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    taskId: route.params.taskId ?? '',
  });
  const resolvedShipmentCode =
    route.params.shipmentCode ?? taskQuery.data?.shipmentCode ?? null;
  const shipmentQuery = useShipmentDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    shipmentCode: resolvedShipmentCode,
  });
  const [selectedIssueId, setSelectedIssueId] = React.useState(
    ISSUE_OPTIONS[0].id,
  );
  const [rescheduleDate, setRescheduleDate] = React.useState(() =>
    addDaysToYmd(getTodayYmd(), 1),
  );
  const [rescheduleSlot, setRescheduleSlot] = React.useState<string>(
    RESCHEDULE_TIME_SLOTS[0].value,
  );
  const [note, setNote] = React.useState('');
  const [attachments, setAttachments] = React.useState<LocalAttachment[]>([]);
  const [cameraVisible, setCameraVisible] = React.useState(false);
  const [capturing, setCapturing] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const [submitIsError, setSubmitIsError] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedIssue =
    ISSUE_OPTIONS.find((option) => option.id === selectedIssueId) ??
    ISSUE_OPTIONS[0];
  const shipmentMetadata = shipmentQuery.data?.metadata ?? null;
  const receiverName =
    readMetadataString(shipmentMetadata, ['receiverName', 'receiver.name']) ??
    'N/A';
  const receiverPhone =
    readMetadataString(shipmentMetadata, [
      'receiverPhone',
      'receiver.phone',
      'recipientPhone',
      'recipient.phone',
    ]) ?? 'N/A';
  const accessToken = session?.tokens.accessToken ?? null;
  const hubCode = session?.user.hubCodes?.[0]?.trim().toUpperCase() ?? '';
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const employeeName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const isDeliveryFailReason = selectedIssue.source === 'DELIVERY_FAIL';
  const isCustomerReschedule = selectedIssue.issueType === 'CUSTOMER_RESCHEDULE';
  const isPhysicalIssue =
    selectedIssue.source === 'SCAN_ISSUE' &&
    selectedIssue.issueCategory === 'PHYSICAL';
  const todayYmd = getTodayYmd();

  const openCamera = React.useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Cần quyền camera',
          'Vui lòng cấp quyền camera để chụp minh chứng.',
        );
        return;
      }
    }

    setCameraVisible(true);
  }, [permission?.granted, requestPermission]);

  const captureAttachment = React.useCallback(async () => {
    if (!cameraRef.current) {
      return;
    }

    setCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });

      const capturedUri = picture.base64
        ? `data:image/jpeg;base64,${picture.base64}`
        : picture.uri;

      if (!capturedUri) {
        throw new Error('Không chụp được minh chứng.');
      }

      setAttachments((current) => [
        ...current,
        {
          uri: capturedUri,
          type: 'image',
          name: `issue-${Date.now()}.jpg`,
        },
      ]);
      setCameraVisible(false);
      setSubmitMessage(null);
      setSubmitIsError(false);
    } catch (error) {
      setSubmitIsError(true);
      setSubmitMessage(
        error instanceof Error ? error.message : 'Không chụp được minh chứng.',
      );
    } finally {
      setCapturing(false);
    }
  }, []);

  const removeAttachment = (uri: string) => {
    setAttachments((current) => current.filter((item) => item.uri !== uri));
  };

  const exitAfterSuccess = React.useCallback(() => {
    setTimeout(() => {
      const routes = navigation.getState().routes;
      if (route.params.taskId && routes.length >= 3) {
        navigation.pop(2);
      } else if (routes.length >= 2) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', { screen: 'Tasks' });
      }
    }, 350);
  }, [navigation, route.params.taskId]);

  const closeTaskAndInvalidate = React.useCallback(
    async (token: string, shipmentCode: string) => {
      if (route.params.taskId) {
        await tasksApi
          .updateTaskStatus(token, route.params.taskId, 'CANCELLED')
          .catch(() => undefined);
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (route.params.taskId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', 'detail', route.params.taskId],
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ['shipment', 'detail', shipmentCode],
      });
    },
    [queryClient, route.params.taskId],
  );

  const handleSubmit = React.useCallback(async () => {
    if (!resolvedShipmentCode) {
      setSubmitIsError(true);
      setSubmitMessage('Không có mã shipment cho nhiệm vụ này.');
      return;
    }

    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!isDeliveryFailReason && !hubCode) {
      setSubmitIsError(true);
      setSubmitMessage(
        'Tài khoản chưa có mã hub nên không thể ghi nhận vấn đề.',
      );
      return;
    }

    if (isPhysicalIssue && attachments.length === 0) {
      setSubmitIsError(true);
      setSubmitMessage(
        'Vấn đề ngoại quan bắt buộc có ít nhất một ảnh/video minh chứng.',
      );
      return;
    }

    if (
      !isDeliveryFailReason &&
      !isPhysicalIssue &&
      note.trim().length === 0
    ) {
      setSubmitIsError(true);
      setSubmitMessage('Vấn đề thông tin/hệ thống bắt buộc có ghi chú.');
      return;
    }

    let rescheduleAtIso: string | null = null;
    if (isCustomerReschedule) {
      const parsedDate = parseYmdLocal(rescheduleDate);
      if (!parsedDate) {
        setSubmitIsError(true);
        setSubmitMessage(
          'Vui lòng nhập ngày hẹn giao hợp lệ theo định dạng YYYY-MM-DD.',
        );
        return;
      }

      const todayStart = parseYmdLocal(getTodayYmd());
      if (todayStart && parsedDate.getTime() < todayStart.getTime()) {
        setSubmitIsError(true);
        setSubmitMessage('Ngày hẹn giao lại không được nhỏ hơn ngày hôm nay.');
        return;
      }

      rescheduleAtIso = buildRescheduleIso(rescheduleDate, rescheduleSlot);
      if (!rescheduleAtIso) {
        setSubmitIsError(true);
        setSubmitMessage('Không thể tạo thời gian hẹn giao lại.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitIsError(false);

    if (isDeliveryFailReason) {
      const rawNote =
        note.trim().length > 0 ? note.trim() : selectedIssue.title;
      const rescheduleLabel = isCustomerReschedule
        ? ` | Hẹn giao lại: ${formatDdMmYyyy(rescheduleDate)} ${rescheduleSlot}`
        : '';
      const attachmentNote =
        attachments.length > 0 ? ` | Minh chứng ảnh: ${attachments.length}` : '';

      const payload: DeliveryFailPayload = {
        shipmentCode: resolvedShipmentCode,
        taskId: route.params.taskId ?? null,
        courierId,
        locationCode: hubCode || null,
        actor: session?.user.username ?? null,
        note:
          buildDeliveryFailAuditNote({
            displayName: session?.user.displayName,
            username: session?.user.username,
            courierId,
            hubCode: hubCode || null,
            reasonCode: selectedIssue.issueType,
            note: `${selectedIssue.title} - ${rawNote}${rescheduleLabel}${attachmentNote}`,
          }),
        occurredAt: new Date().toISOString(),
        idempotencyKey: createIdempotencyKey('delivery-fail'),
        failReasonCode: selectedIssue.issueType,
        createNdr: true,
        startReturn: false,
        rescheduleAt: rescheduleAtIso,
        nextDeliveryAt: rescheduleAtIso,
      };

      try {
        await submitDeliveryFailAction(accessToken, payload);
        await closeTaskAndInvalidate(accessToken, resolvedShipmentCode);

        setSubmitIsError(false);
        setSubmitMessage(
          isCustomerReschedule
            ? `Đã ghi nhận hẹn giao lại ngày ${formatDdMmYyyy(rescheduleDate)} (${rescheduleSlot}). Hệ thống sẽ tự phát lại nếu đã có tồn kho.`
            : `Đã ghi nhận "${selectedIssue.title}". Đơn đã được chuyển ra khỏi danh sách đợi phát.`,
        );
        exitAfterSuccess();
      } catch (error) {
        if (shouldQueueOffline(error)) {
          await enqueueDeliveryFailOffline(payload);
          await closeTaskAndInvalidate(accessToken, resolvedShipmentCode);
          setSubmitIsError(false);
          setSubmitMessage(
            'Mất mạng: thao tác đã được lưu offline và đơn đã rời danh sách đợi phát.',
          );
          exitAfterSuccess();
        } else {
          const message =
            error instanceof Error
              ? error.message
              : 'Cập nhật giao thất bại không thành công.';
          setSubmitIsError(true);
          setSubmitMessage(message);
          setGlobalError(message);
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const rawNote =
      note.trim().length > 0 ? note.trim() : selectedIssue.description;
    const payload = {
      shipmentCode: resolvedShipmentCode,
      currentHubCode: hubCode,
      issueType: selectedIssue.issueType,
      issueCategory: selectedIssue.issueCategory,
      attachments: attachments.map<IssueAttachmentPayload>((attachment) => ({
        uri: attachment.uri,
        type: attachment.type,
        name: attachment.name,
      })),
      actor: `${employeeName} (${courierId || session?.user.username || 'N/A'})`,
      note: buildShipmentIssueAuditNote({
        displayName: session?.user.displayName,
        username: session?.user.username,
        courierId,
        hubCode,
        issueType: selectedIssue.issueType,
        issueTitle: selectedIssue.title,
        note: rawNote,
      }),
      occurredAt: new Date().toISOString(),
    };

    try {
      const result = await reportShipmentException(accessToken, payload);
      await closeTaskAndInvalidate(accessToken, resolvedShipmentCode);

      setSubmitIsError(false);
      setSubmitMessage(
        `Đã ghi nhận vấn đề ${result.id}. Đơn đã rời danh sách đợi phát và bị khóa luân chuyển.`,
      );
      exitAfterSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cập nhật vấn đề thất bại.';
      setSubmitIsError(true);
      setSubmitMessage(message);
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accessToken,
    attachments,
    closeTaskAndInvalidate,
    courierId,
    employeeName,
    exitAfterSuccess,
    hubCode,
    isCustomerReschedule,
    isDeliveryFailReason,
    isPhysicalIssue,
    note,
    rescheduleDate,
    rescheduleSlot,
    resolvedShipmentCode,
    route.params.taskId,
    selectedIssue.description,
    selectedIssue.issueCategory,
    selectedIssue.issueType,
    selectedIssue.title,
    session?.user.displayName,
    session?.user.username,
    setGlobalError,
  ]);

  const handleSelectOption = (optionId: string) => {
    setSelectedIssueId(optionId);
    setSubmitMessage(null);
    setSubmitIsError(false);
  };

  const renderIssueOption = (option: IssueOption) => {
    const selected = option.id === selectedIssueId;
    return (
      <Pressable
        key={option.id}
        onPress={() => handleSelectOption(option.id)}
        style={[styles.optionItem, selected && styles.optionItemSelected]}
      >
        <View style={styles.optionTitleRow}>
          <Ionicons
            name={selected ? 'radio-button-on' : 'radio-button-off'}
            size={18}
            color={selected ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[styles.optionTitle, selected && styles.optionTitleSelected]}
          >
            {option.title}
          </Text>
        </View>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.layout}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <Text style={styles.sectionTitle}>Xử lý vấn đề đơn hàng</Text>
            <Text style={styles.sectionHint}>
              Chọn lý do khách từ chối lấy hàng, hẹn ngày giao lại hoặc vấn đề
              kiện hàng. Sau khi xác nhận, đơn sẽ rời khỏi mục Đợi phát.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Task code</Text>
              <Text style={styles.infoValue}>
                {route.params.taskCode ?? taskQuery.data?.taskCode ?? 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shipment</Text>
              <Text style={styles.infoValue}>
                {resolvedShipmentCode ?? 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người nhận</Text>
              <Text style={styles.infoValue}>{receiverName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{receiverPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hub thao tác</Text>
              <Text style={styles.infoValue}>{hubCode || 'N/A'}</Text>
            </View>
            {shipmentQuery.isLoading ? (
              <View style={styles.inlineStateRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.inlineStateText}>
                  Đang tải thông tin đơn hàng...
                </Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>
              Khách từ chối lấy hàng / Giao thất bại
            </Text>
            <View style={styles.optionList}>
              {DELIVERY_ISSUE_OPTIONS.map(renderIssueOption)}
            </View>
          </Card>

          {isCustomerReschedule ? (
            <Card style={styles.rescheduleCard}>
              <Text style={styles.sectionTitle}>Chọn ngày hẹn giao lại</Text>
              <Text style={styles.sectionHint}>
                Nếu đơn hàng đã có tồn kho trước đó tại bưu cục, hệ thống sẽ tự
                động phân bổ phát lại đúng ngày hẹn.
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickDateRow}
              >
                {QUICK_RESCHEDULE_DAYS.map((preset) => {
                  const targetYmd = addDaysToYmd(todayYmd, preset.offsetDays);
                  const active = rescheduleDate === targetYmd;
                  return (
                    <Pressable
                      key={preset.offsetDays}
                      onPress={() => setRescheduleDate(targetYmd)}
                      style={[
                        styles.quickDateChip,
                        active && styles.quickDateChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickDateLabel,
                          active && styles.quickDateTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                      <Text
                        style={[
                          styles.quickDateSub,
                          active && styles.quickDateTextActive,
                        ]}
                      >
                        {formatDdMm(targetYmd)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.dateStepperRow}>
                <Pressable
                  onPress={() => {
                    const prev = addDaysToYmd(rescheduleDate, -1);
                    if (prev >= todayYmd) {
                      setRescheduleDate(prev);
                    }
                  }}
                  style={styles.stepperButton}
                >
                  <Ionicons name="remove" size={16} color={theme.colors.primary} />
                  <Text style={styles.stepperButtonText}>1 ngày</Text>
                </Pressable>
                <TextInput
                  value={rescheduleDate}
                  onChangeText={setRescheduleDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  style={styles.dateInput}
                />
                <Pressable
                  onPress={() =>
                    setRescheduleDate(addDaysToYmd(rescheduleDate, 1))
                  }
                  style={styles.stepperButton}
                >
                  <Ionicons name="add" size={16} color={theme.colors.primary} />
                  <Text style={styles.stepperButtonText}>1 ngày</Text>
                </Pressable>
              </View>

              <Text style={styles.slotLabel}>Khung giờ dự kiến phát lại</Text>
              <View style={styles.slotRow}>
                {RESCHEDULE_TIME_SLOTS.map((slot) => {
                  const active = rescheduleSlot === slot.value;
                  return (
                    <Pressable
                      key={slot.value}
                      onPress={() => setRescheduleSlot(slot.value)}
                      style={[
                        styles.slotChip,
                        active && styles.slotChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotChipText,
                          active && styles.slotChipTextActive,
                        ]}
                      >
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ) : null}

          <Card>
            <Text style={styles.sectionTitle}>
              Vấn đề hàng hóa / Thông tin / Hệ thống
            </Text>
            <View style={styles.optionList}>
              {SCAN_ISSUE_OPTIONS.map(renderIssueOption)}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Ghi chú bổ sung</Text>
            <Text style={styles.sectionHint}>
              {isPhysicalIssue
                ? 'Vấn đề ngoại quan bắt buộc có minh chứng ảnh.'
                : !isDeliveryFailReason
                  ? 'Vấn đề thông tin/hệ thống bắt buộc có ghi chú.'
                  : 'Nhập thêm ghi chú chi tiết nếu có (không bắt buộc).'}
            </Text>
            <TextInput
              placeholder="Nhập ghi chú nếu cần"
              placeholderTextColor="#94A3B8"
              style={styles.noteInput}
              multiline
              value={note}
              onChangeText={setNote}
            />
          </Card>

          <Card>
            <View style={styles.evidenceHeader}>
              <View>
                <Text style={styles.sectionTitle}>Minh chứng</Text>
                <Text style={styles.sectionHint}>
                  Ảnh ngoại quan hoặc hiện trường giao hàng.
                </Text>
              </View>
              <Pressable
                onPress={() => void openCamera()}
                style={styles.secondaryButton}
              >
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.secondaryButtonText}>Chụp ảnh</Text>
              </Pressable>
            </View>
            {attachments.length === 0 ? (
              <Text style={styles.emptyEvidenceText}>Chưa có minh chứng.</Text>
            ) : (
              <View style={styles.attachmentGrid}>
                {attachments.map((attachment) => (
                  <View key={attachment.uri} style={styles.attachmentItem}>
                    <Image
                      source={{ uri: attachment.uri }}
                      style={styles.attachmentImage}
                    />
                    <Pressable
                      onPress={() => removeAttachment(attachment.uri)}
                      style={styles.removeAttachmentButton}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {submitMessage ? (
            <Card
              style={[
                styles.messageCard,
                submitIsError && styles.errorMessageCard,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  submitIsError && styles.errorMessageText,
                ]}
              >
                {submitMessage}
              </Text>
            </Card>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Xác nhận vấn đề</Text>
            )}
          </Pressable>
        </View>
      </View>

      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraModal}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.cameraPreview}
              facing="back"
            />
          ) : (
            <View style={styles.cameraPermissionBlock}>
              <Text style={styles.cameraPermissionText}>
                Chưa có quyền camera. Vui lòng cấp quyền để tiếp tục.
              </Text>
              <Pressable
                onPress={requestPermission}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cấp quyền</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.cameraFooter}>
            <Pressable
              onPress={() => setCameraVisible(false)}
              style={[styles.cameraActionButton, styles.cameraCancelButton]}
            >
              <Text style={styles.cameraActionText}>Đóng</Text>
            </Pressable>
            <Pressable
              onPress={() => void captureAttachment()}
              disabled={capturing || !permission?.granted}
              style={[styles.cameraActionButton, styles.cameraCaptureButton]}
            >
              {capturing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.cameraActionText}>Chụp</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 110,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  sectionHint: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    flex: 1,
  },
  infoValue: {
    ...theme.typography.body.sm,
    color: theme.colors.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  inlineStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  inlineStateText: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  optionList: {
    gap: theme.spacing.sm,
  },
  optionItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  optionItemSelected: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  optionTitle: {
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  optionTitleSelected: {
    color: '#1D4ED8',
  },
  optionDescription: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  rescheduleCard: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFF',
  },
  quickDateRow: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  quickDateChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    minWidth: 74,
  },
  quickDateChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  quickDateLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  quickDateSub: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
  },
  quickDateTextActive: {
    color: '#FFFFFF',
  },
  dateStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  stepperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 42,
  },
  stepperButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dateInput: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center',
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  slotLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  slotChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EFF6FF',
  },
  slotChipText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  slotChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    minHeight: 38,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  secondaryButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  emptyEvidenceText: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  attachmentItem: {
    width: 86,
    height: 86,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  messageCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  errorMessageCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  messageText: {
    ...theme.typography.body.md,
    color: '#166534',
  },
  errorMessageText: {
    color: '#B91C1C',
  },
  footer: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    ...theme.typography.body.lg,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cameraModal: {
    flex: 1,
    backgroundColor: '#020617',
  },
  cameraPreview: {
    flex: 1,
  },
  cameraPermissionBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cameraPermissionText: {
    ...theme.typography.body.md,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cameraFooter: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.xl,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cameraActionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCancelButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  cameraCaptureButton: {
    backgroundColor: theme.colors.primary,
  },
  cameraActionText: {
    ...theme.typography.body.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
