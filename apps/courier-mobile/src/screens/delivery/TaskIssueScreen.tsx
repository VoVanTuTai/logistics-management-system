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
import { reportShipmentException } from '../../features/delivery/shipment-exception.api';
import type { IssueAttachmentPayload } from '../../features/delivery/delivery.types';
import { SCAN_ISSUE_RETURN_REASONS } from '../../features/delivery/return-reasons';
import { useShipmentDetailQuery } from '../../features/shipment/shipment.queries';
import type { ShipmentMetadata } from '../../features/shipment/shipment.types';
import { useTaskDetailQuery } from '../../features/tasks/tasks.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { appEnv } from '../../utils/env';
import {
  buildShipmentIssueAuditNote,
  resolveCourierDisplayName,
  resolveCourierId,
} from '../../utils/courier';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'TaskIssue'>;

interface IssueOption {
  id: string;
  title: string;
  description: string;
  issueType: string;
  issueCategory: 'PHYSICAL' | 'INFORMATION' | 'SYSTEM';
}

const ISSUE_OPTIONS: IssueOption[] = SCAN_ISSUE_RETURN_REASONS.map((reason) => ({
  id: reason.id,
  title: reason.label,
  description: reason.description,
  issueType: reason.code,
  issueCategory: reason.issueCategory ?? 'INFORMATION',
}));

interface LocalAttachment {
  uri: string;
  type: string;
  name: string;
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
  const resolvedShipmentCode = route.params.shipmentCode ?? taskQuery.data?.shipmentCode ?? null;
  const shipmentQuery = useShipmentDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    shipmentCode: resolvedShipmentCode,
  });
  const [selectedIssueId, setSelectedIssueId] = React.useState(ISSUE_OPTIONS[0].id);
  const [note, setNote] = React.useState('');
  const [attachments, setAttachments] = React.useState<LocalAttachment[]>([]);
  const [cameraVisible, setCameraVisible] = React.useState(false);
  const [capturing, setCapturing] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedIssue =
    ISSUE_OPTIONS.find((option) => option.id === selectedIssueId) ?? ISSUE_OPTIONS[0];
  const shipmentMetadata = shipmentQuery.data?.metadata ?? null;
  const receiverName =
    readMetadataString(shipmentMetadata, ['receiverName', 'receiver.name']) ?? 'N/A';
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
  const isPhysicalIssue = selectedIssue.issueCategory === 'PHYSICAL';

  const openCamera = React.useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để chụp minh chứng.');
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
      });

      if (!picture.uri) {
        throw new Error('Không chụp được minh chứng.');
      }

      setAttachments((current) => [
        ...current,
        {
          uri: picture.uri,
          type: 'image',
          name: `issue-${Date.now()}.jpg`,
        },
      ]);
      setCameraVisible(false);
      setSubmitMessage(null);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Không chụp được minh chứng.');
    } finally {
      setCapturing(false);
    }
  }, []);

  const removeAttachment = (uri: string) => {
    setAttachments((current) => current.filter((item) => item.uri !== uri));
  };

  const handleSubmit = React.useCallback(async () => {
    if (!resolvedShipmentCode) {
      setSubmitMessage('Không có mã shipment cho nhiệm vụ này.');
      return;
    }

    if (!accessToken) {
      setGlobalError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!hubCode) {
      setSubmitMessage('Tài khoản chưa có mã hub nên không thể ghi nhận vấn đề.');
      return;
    }

    if (isPhysicalIssue && attachments.length === 0) {
      setSubmitMessage('Vấn đề ngoại quan bắt buộc có ít nhất một ảnh/video minh chứng.');
      return;
    }

    if (!isPhysicalIssue && note.trim().length === 0) {
      setSubmitMessage('Vấn đề thông tin/hệ thống bắt buộc có ghi chú.');
      return;
    }

    const rawNote = note.trim().length > 0 ? note.trim() : selectedIssue.description;
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

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const result = await reportShipmentException(accessToken, payload);
      setSubmitMessage(
        `Đã ghi nhận vấn đề ${result.id}. Đơn đã chuyển sang trạng thái kiện vấn đề và bị khóa luân chuyển.`,
      );

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (route.params.taskId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', 'detail', route.params.taskId],
        });
      }
      if (resolvedShipmentCode) {
        await queryClient.invalidateQueries({
          queryKey: ['shipment', 'detail', resolvedShipmentCode],
        });
      }

      setTimeout(() => {
        navigation.goBack();
      }, 600);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cập nhật vấn đề thất bại.';
      setSubmitMessage(message);
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accessToken,
    attachments,
    hubCode,
    isPhysicalIssue,
    courierId,
    employeeName,
    navigation,
    note,
    queryClient,
    resolvedShipmentCode,
    route.params.taskId,
    selectedIssue.title,
    selectedIssue.description,
    selectedIssue.issueCategory,
    selectedIssue.issueType,
    session?.user.username,
    setGlobalError,
  ]);

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
              Hệ thống sẽ kiểm tra vị trí hiện tại khớp hub thao tác, tạo hồ sơ vấn đề và khóa bưu kiện.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Task code</Text>
              <Text style={styles.infoValue}>
                {route.params.taskCode ?? taskQuery.data?.taskCode ?? 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shipment</Text>
              <Text style={styles.infoValue}>{resolvedShipmentCode ?? 'N/A'}</Text>
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
                <Text style={styles.inlineStateText}>Đang tải thông tin đơn hàng...</Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Lựa chọn vấn đề</Text>
            <View style={styles.optionList}>
              {ISSUE_OPTIONS.map((option) => {
                const selected = option.id === selectedIssueId;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedIssueId(option.id)}
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
              })}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Ghi chú bổ sung</Text>
            <Text style={styles.sectionHint}>
              Vấn đề ngoại quan bắt buộc có minh chứng. Vấn đề thông tin/hệ thống bắt buộc có ghi chú.
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
                  Ảnh/video ngoại quan dùng để điều phối xử lý hồ sơ.
                </Text>
              </View>
              <Pressable onPress={() => void openCamera()} style={styles.secondaryButton}>
                <Ionicons name="camera-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Chụp ảnh</Text>
              </Pressable>
            </View>
            {attachments.length === 0 ? (
              <Text style={styles.emptyEvidenceText}>Chưa có minh chứng.</Text>
            ) : (
              <View style={styles.attachmentGrid}>
                {attachments.map((attachment) => (
                  <View key={attachment.uri} style={styles.attachmentItem}>
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
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
            <Card style={styles.messageCard}>
              <Text style={styles.messageText}>{submitMessage}</Text>
            </Card>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
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
            <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
          ) : (
            <View style={styles.cameraPermissionBlock}>
              <Text style={styles.cameraPermissionText}>
                Chưa có quyền camera. Vui lòng cấp quyền để tiếp tục.
              </Text>
              <Pressable onPress={requestPermission} style={styles.secondaryButton}>
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
  },
  optionTitleSelected: {
    color: '#1D4ED8',
  },
  optionDescription: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
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
  messageText: {
    ...theme.typography.body.md,
    color: '#166534',
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
