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
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { enqueueDeliveryFailOffline } from '../../features/delivery/delivery-fail.offline';
import { useDeliveryFailActionMutation } from '../../features/delivery/delivery-fail.mutation';
import type { DeliveryFailPayload } from '../../features/delivery/delivery.types';
import { useShipmentDetailQuery } from '../../features/shipment/shipment.queries';
import type { ShipmentMetadata } from '../../features/shipment/shipment.types';
import { useTaskDetailQuery } from '../../features/tasks/tasks.queries';
import type { AppNavigatorParamList } from '../../navigation/types';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'TaskIssue'>;

interface IssueOption {
  id: string;
  title: string;
  description: string;
  reasonCode: string;
  createNdr: boolean;
  startReturn: boolean;
}

const ISSUE_OPTIONS: IssueOption[] = [
  {
    id: 'customer-unreachable',
    title: 'Khong goi duoc khach',
    description: 'Da lien he nhieu lan nhung khach khong nghe may.',
    reasonCode: 'CUSTOMER_UNREACHABLE',
    createNdr: true,
    startReturn: false,
  },
  {
    id: 'wrong-address',
    title: 'Thong tin Địa chỉ sai',
    description: 'Địa chỉ giao khong ton tai hoac sai thong tin Khu vực.',
    reasonCode: 'WRONG_ADDRESS',
    createNdr: true,
    startReturn: false,
  },
  {
    id: 'customer-refused',
    title: 'Khach tu choi nhan',
    description: 'Khach tu choi nhan hang khi courier giao den.',
    reasonCode: 'CUSTOMER_REFUSED',
    createNdr: true,
    startReturn: true,
  },
  {
    id: 'reschedule',
    title: 'Khach hen lai',
    description: 'Khach yeu cau giao lai vao thoi diem khac.',
    reasonCode: 'CUSTOMER_RESCHEDULE',
    createNdr: true,
    startReturn: false,
  },
];

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
  const mutation = useDeliveryFailActionMutation(
    session?.tokens.accessToken ?? null,
  );
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

  const handleSubmit = React.useCallback(async () => {
    if (!resolvedShipmentCode) {
      setSubmitMessage('Khong co ma shipment cho nhiem vu nay.');
      return;
    }

    const payload: DeliveryFailPayload = {
      shipmentCode: resolvedShipmentCode,
      taskId: route.params.taskId ?? null,
      courierId: null,
      locationCode: null,
      actor: session?.user.username ?? null,
      note: note.trim().length > 0 ? note.trim() : selectedIssue.description,
      occurredAt: new Date().toISOString(),
      idempotencyKey: createIdempotencyKey('delivery-fail'),
      failReasonCode: selectedIssue.reasonCode,
      createNdr: selectedIssue.createNdr,
      startReturn: selectedIssue.startReturn,
    };

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const result = await mutation.mutateAsync(payload);
      setSubmitMessage(
        result.source === 'DUPLICATE_REPLAY'
          ? 'Server da tra lai ket qua cu cho idempotencyKey trung lap.'
          : 'Da ghi nhan van de thanh cong va cap nhat trang thai don.',
      );

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (route.params.taskId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', 'detail', route.params.taskId],
        });
      }

      setTimeout(() => {
        navigation.goBack();
      }, 600);
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueDeliveryFailOffline(payload);
        setSubmitMessage('Mat mang: thao tac da duoc luu offline va se tu dong dong bo.');
      } else {
        const message =
          error instanceof Error ? error.message : 'Cap nhat van de that bai.';
        setSubmitMessage(message);
        setGlobalError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mutation,
    navigation,
    note,
    queryClient,
    resolvedShipmentCode,
    route.params.taskId,
    selectedIssue.createNdr,
    selectedIssue.description,
    selectedIssue.reasonCode,
    selectedIssue.startReturn,
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
            <Text style={styles.sectionTitle}>Xu ly van de don hang</Text>
            <Text style={styles.sectionHint}>
              Chon dung ly do de he thong tao NDR/tra hang theo quy trinh.
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
              <Text style={styles.infoLabel}>Nguoi nhan</Text>
              <Text style={styles.infoValue}>{receiverName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>So dien thoai</Text>
              <Text style={styles.infoValue}>{receiverPhone}</Text>
            </View>
            {shipmentQuery.isLoading ? (
              <View style={styles.inlineStateRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.inlineStateText}>Dang tai thong tin don hang...</Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Lua chon van de</Text>
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
            <Text style={styles.sectionTitle}>Ghi chu bo sung</Text>
            <TextInput
              placeholder="Nhap ghi chu neu can"
              placeholderTextColor="#94A3B8"
              style={styles.noteInput}
              multiline
              value={note}
              onChangeText={setNote}
            />
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
              <Text style={styles.submitButtonText}>Xac nhan van de</Text>
            )}
          </Pressable>
        </View>
      </View>
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
});

