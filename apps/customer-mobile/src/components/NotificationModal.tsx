import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing } from '../theme';
import type { ShipmentResponse } from '../services/api/shipment.api';
import { resolveCourierForOrder } from '../utils/courierResolver';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  receivedShipments: ShipmentResponse[];
  onSelectShipment: (shipment: ShipmentResponse) => void;
}

export function NotificationModal({
  visible,
  onClose,
  receivedShipments,
  onSelectShipment,
}: NotificationModalProps): React.JSX.Element {
  const getStatusText = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'DELIVERING':
        return 'Shipper đang trên đường giao hàng';
      case 'ARRIVED_HUB':
      case 'SCAN_INBOUND':
        return 'Kiện hàng đã đến bưu cục phát';
      case 'IN_TRANSIT':
      case 'OUTBOUND':
        return 'Kiện hàng đang trung chuyển';
      case 'DELIVERED':
        return 'Kiện hàng đã giao thành công';
      default:
        return 'Có kiện hàng mới gửi đến bạn';
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'DELIVERING':
        return colors.warning;
      case 'DELIVERED':
        return colors.success;
      default:
        return colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="notifications" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.title}>Hộp thư thông báo</Text>
                    <Text style={styles.subtitle}>
                      {receivedShipments.length > 0
                        ? `Bạn có ${receivedShipments.length} bưu gửi gửi đến SĐT của bạn`
                        : 'Không có thông báo bưu gửi mới'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* LIST OF NOTIFICATIONS */}
              <ScrollView
                style={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {receivedShipments.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="mail-open-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
                    <Text style={styles.emptySubtitle}>
                      Khi có người gửi hàng đến số điện thoại của bạn, thông báo và thông tin bưu tá sẽ xuất hiện ngay tại đây.
                    </Text>
                  </View>
                ) : (
                  receivedShipments.map((s) => {
                    const meta = (s.metadata as Record<string, any>) || {};
                    const sender = meta.sender || {};
                    const receiver = meta.receiver || {};
                    const courier = resolveCourierForOrder({
                      courierId: meta.courierId,
                      courierName: meta.courierName,
                      courierPhone: meta.courierPhone,
                      receiverHubCode: receiver.hubCode || meta.receiverHubCode,
                    });
                    const statusColor = getStatusColor(s.currentStatus);

                    return (
                      <TouchableOpacity
                        key={s.id || s.code}
                        style={styles.notifCard}
                        activeOpacity={0.8}
                        onPress={() => {
                          onClose();
                          onSelectShipment(s);
                        }}
                      >
                        <View style={styles.notifCardHeader}>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {getStatusText(s.currentStatus)}
                          </Text>
                          <Text style={styles.orderCode}>#{s.code}</Text>
                        </View>

                        <View style={styles.senderReceiverRow}>
                          <Text style={styles.personLabel}>Người gửi: </Text>
                          <Text style={styles.personName}>{sender.name || 'Người gửi'}</Text>
                          {sender.phone ? <Text style={styles.personPhone}> ({sender.phone})</Text> : null}
                        </View>

                        <View style={styles.courierBanner}>
                          <Ionicons name="bicycle-outline" size={16} color={colors.primary} />
                          <Text style={styles.courierBannerText}>
                            Bưu tá: <Text style={{ fontWeight: '700' }}>{courier.name}</Text> • {courier.phone}
                          </Text>
                        </View>

                        <View style={styles.notifFooter}>
                          <Text style={styles.timeText}>
                            {new Date(s.createdAt).toLocaleDateString('vi-VN')} {new Date(s.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          <View style={styles.viewDetailLink}>
                            <Text style={styles.viewDetailText}>Xem hành trình</Text>
                            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  notifCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  notifCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  orderCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  senderReceiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  personName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  personPhone: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  courierBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  courierBannerText: {
    fontSize: 12,
    color: colors.primary,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  viewDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
