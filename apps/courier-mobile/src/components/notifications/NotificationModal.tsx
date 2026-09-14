import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import type { TaskDto } from '../../features/tasks/tasks.types';

export interface CourierNotificationItem {
  id: string;
  taskId: string;
  type: 'TRANSFER' | 'NEW_ORDER' | 'SYSTEM';
  title: string;
  shipmentCode: string;
  taskType: 'PICKUP' | 'DELIVERY' | 'RETURN';
  fromCourierId?: string;
  message: string;
  time: string;
  timestamp: number;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: TaskDto[];
  onSelectTask: (taskId: string) => void;
}

export function NotificationModal({
  visible,
  onClose,
  tasks,
  onSelectTask,
}: NotificationModalProps): React.JSX.Element {
  const [filter, setFilter] = useState<'ALL' | 'NEW_ORDER' | 'TRANSFER'>('ALL');

  const notifications = useMemo((): CourierNotificationItem[] => {
    const list: CourierNotificationItem[] = [];

    tasks.forEach((task) => {
      const isReassigned =
        task.assignments &&
        task.assignments.length > 1;

      const noteText = task.note || '';
      const hasTransferNote =
        noteText.toLowerCase().includes('chuyển') ||
        noteText.toLowerCase().includes('reassign') ||
        noteText.toLowerCase().includes('điều phối lại');

      const isRecent = task.status === 'ASSIGNED';

      if (isReassigned || hasTransferNote) {
        let fromCourierId: string | undefined = undefined;
        if (task.assignments && task.assignments.length > 1) {
          fromCourierId = task.assignments[task.assignments.length - 2]?.courierId;
        }

        const date = new Date(task.updatedAt || task.createdAt);
        list.push({
          id: `transfer-${task.id}`,
          taskId: task.id,
          type: 'TRANSFER',
          title: fromCourierId
            ? `Chuyển đơn từ Shipper ${fromCourierId}`
            : 'Đơn hàng được chuyển qua bạn',
          shipmentCode: task.shipmentCode || task.taskCode,
          taskType: task.taskType,
          fromCourierId,
          message:
            noteText ||
            `Đơn hàng được điều phối lại sang tuyến của bạn để tiếp tục xử lý.`,
          time: formatNotificationTime(date),
          timestamp: date.getTime(),
        });
      } else if (isRecent) {
        const date = new Date(task.createdAt);
        list.push({
          id: `new-${task.id}`,
          taskId: task.id,
          type: 'NEW_ORDER',
          title:
            task.taskType === 'PICKUP'
              ? 'Nhiệm vụ lấy hàng mới'
              : 'Nhiệm vụ giao hàng mới',
          shipmentCode: task.shipmentCode || task.taskCode,
          taskType: task.taskType,
          message:
            noteText ||
            `Hệ thống vừa phân công nhiệm vụ mới vào tuyến làm việc hôm nay.`,
          time: formatNotificationTime(date),
          timestamp: date.getTime(),
        });
      }
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks]);

  const filteredList = useMemo(() => {
    if (filter === 'ALL') return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const newCount = useMemo(
    () => notifications.filter((n) => n.type === 'NEW_ORDER').length,
    [notifications],
  );
  const transferCount = useMemo(
    () => notifications.filter((n) => n.type === 'TRANSFER').length,
    [notifications],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* DRAG HANDLE */}
          <View style={styles.dragHandle} />

          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.bellIconWrap}>
                <Ionicons name="notifications" size={18} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Thông báo nhiệm vụ</Text>
                <Text style={styles.sheetSubtitle}>
                  {notifications.length > 0
                    ? `${notifications.length} thông báo điều phối ca hôm nay`
                    : 'Không có thông báo mới'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* FILTER TABS */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setFilter('ALL')}
              style={[styles.tabBtn, filter === 'ALL' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, filter === 'ALL' && styles.tabTextActive]}>
                Tất cả ({notifications.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFilter('NEW_ORDER')}
              style={[styles.tabBtn, filter === 'NEW_ORDER' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, filter === 'NEW_ORDER' && styles.tabTextActive]}>
                Đơn mới ({newCount})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFilter('TRANSFER')}
              style={[styles.tabBtn, filter === 'TRANSFER' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, filter === 'TRANSFER' && styles.tabTextActive]}>
                Đơn chuyển ({transferCount})
              </Text>
            </Pressable>
          </View>

          {/* CONTENT LIST */}
          <ScrollView
            style={styles.listScrollView}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                <Text style={styles.emptyText}>
                  {filter === 'TRANSFER'
                    ? 'Hiện tại không có đơn nào được chuyển từ courier khác sang bạn.'
                    : filter === 'NEW_ORDER'
                    ? 'Chưa có đơn mới được phân công thêm.'
                    : 'Các đơn hàng mới hoặc yêu cầu chuyển đơn sẽ xuất hiện tại đây.'}
                </Text>
              </View>
            ) : (
              filteredList.map((item) => {
                const isTransfer = item.type === 'TRANSFER';
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      onClose();
                      onSelectTask(item.taskId);
                    }}
                    style={({ pressed }) => [
                      styles.notificationCard,
                      isTransfer && styles.notificationCardTransfer,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTypeRow}>
                        <View
                          style={[
                            styles.badgeType,
                            isTransfer
                              ? styles.badgeTypeTransfer
                              : styles.badgeTypeNew,
                          ]}
                        >
                          <Ionicons
                            name={isTransfer ? 'swap-horizontal' : 'cube-outline'}
                            size={12}
                            color={isTransfer ? '#D97706' : '#2563EB'}
                          />
                          <Text
                            style={[
                              styles.badgeTypeText,
                              isTransfer
                                ? styles.badgeTypeTextTransfer
                                : styles.badgeTypeTextNew,
                            ]}
                          >
                            {isTransfer ? 'ĐƠN CHUYỂN' : 'ĐƠN MỚI'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.taskTypePill,
                            item.taskType === 'PICKUP'
                              ? styles.taskTypePickup
                              : styles.taskTypeDelivery,
                          ]}
                        >
                          <Text style={styles.taskTypePillText}>
                            {item.taskType === 'PICKUP' ? 'LẤY HÀNG' : 'GIAO HÀNG'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.cardTime}>{item.time}</Text>
                    </View>

                    <Text style={styles.cardTitle}>{item.title}</Text>

                    <View style={styles.shipmentCodeRow}>
                      <Ionicons name="barcode-outline" size={14} color="#64748B" />
                      <Text style={styles.shipmentCodeText}>{item.shipmentCode}</Text>
                    </View>

                    {item.message ? (
                      <Text style={styles.cardMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                    ) : null}

                    <View style={styles.cardActionRow}>
                      <Text style={styles.cardActionText}>Xem nhiệm vụ</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={theme.colors.primary}
                      />
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function formatNotificationTime(date: Date): string {
  if (isNaN(date.getTime())) return 'Vừa xong';
  const now = Date.now();
  const diffMinutes = Math.floor((now - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')} - ${date.getDate()}/${date.getMonth() + 1}`;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingBottom: 28,
    ...theme.shadow.lg,
  },
  dragHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.7,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listScrollView: {
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 6,
    ...theme.shadow.sm,
  },
  notificationCardTransfer: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeTypeNew: {
    backgroundColor: '#EFF6FF',
  },
  badgeTypeTransfer: {
    backgroundColor: '#FEF3C7',
  },
  badgeTypeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgeTypeTextNew: {
    color: '#2563EB',
  },
  badgeTypeTextTransfer: {
    color: '#B45309',
  },
  taskTypePill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  taskTypePickup: {
    backgroundColor: '#F3E8FF',
  },
  taskTypeDelivery: {
    backgroundColor: '#DCFCE7',
  },
  taskTypePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  shipmentCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shipmentCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
  cardMessage: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
