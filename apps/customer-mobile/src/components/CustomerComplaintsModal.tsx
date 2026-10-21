import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  cskhApi,
  CustomerCskhTicket,
  CskhTicketCategory,
} from '../services/api/cskh.api';
import { useAuthSession } from '../store/authStore';
import { colors, shadows, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  prefilledShipmentCode?: string;
}

const CATEGORY_MAP: Record<CskhTicketCategory, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  DELIVERY_EXPEDITE: { label: 'Giục giao khẩn cấp', icon: 'flash', color: '#0284C7' },
  ADDRESS_CHANGE: { label: 'Đổi địa chỉ / SĐT nhận', icon: 'location', color: '#9333EA' },
  DAMAGE_COMPLAINT: { label: 'Khiếu nại bể vỡ / Đền bù', icon: 'warning', color: '#DC2626' },
  COURIER_ATTITUDE: { label: 'Phản ánh thái độ shipper', icon: 'person-remove', color: '#D97706' },
  AI_HANDOVER: { label: 'Chuyển từ AI Bot', icon: 'chatbubbles', color: '#4F46E5' },
  COD_DISCREPANCY: { label: 'Khiếu nại tiền COD', icon: 'cash', color: '#059669' },
  GENERAL_INQUIRY: { label: 'Yêu cầu hỗ trợ khác', icon: 'help-circle', color: '#64748B' },
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  NEW: { label: 'Mới tiếp nhận', bg: '#E0F2FE', text: '#0369A1' },
  IN_PROGRESS: { label: 'Đang xử lý', bg: '#FEF3C7', text: '#B45309' },
  WAITING_CUSTOMER: { label: 'Chờ khách phản hồi', bg: '#F3E8FF', text: '#7E22CE' },
  ESCALATED_CLAIMS: { label: 'Đã chuyển Bồi thường CLM', bg: '#FEE2E2', text: '#B91C1C' },
  RESOLVED: { label: 'Đã giải quyết', bg: '#DCFCE7', text: '#15803D' },
  CLOSED: { label: 'Đã hoàn tất', bg: '#F1F5F9', text: '#475569' },
};

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSlaText(deadlineStr: string, isClosed: boolean): { text: string; isUrgent: boolean } {
  if (isClosed) return { text: 'Đã đóng đúng hạn', isUrgent: false };
  const diff = new Date(deadlineStr).getTime() - Date.now();
  if (diff <= 0) {
    const mins = Math.abs(Math.floor(diff / 60000));
    const h = Math.floor(mins / 60);
    return { text: `Quá hạn SLA ${h > 0 ? `${h}h ` : ''}${mins % 60}m`, isUrgent: true };
  }
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(mins / 60);
  return { text: `Còn ${h > 0 ? `${h}h ` : ''}${mins % 60}m`, isUrgent: h < 2 };
}

export function CustomerComplaintsModal({
  visible,
  onClose,
  prefilledShipmentCode,
}: Props): React.JSX.Element {
  const session = useAuthSession();
  const user = session?.user;

  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [tickets, setTickets] = useState<CustomerCskhTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<CustomerCskhTicket | null>(null);

  // Note form for selected ticket
  const [replyText, setReplyText] = useState<string>('');
  const [sendingNote, setSendingNote] = useState<boolean>(false);

  // Create form state
  const [shipmentCodeInput, setShipmentCodeInput] = useState<string>(prefilledShipmentCode || '');
  const [categoryInput, setCategoryInput] = useState<CskhTicketCategory>('DAMAGE_COMPLAINT');
  const [titleInput, setTitleInput] = useState<string>('');
  const [descInput, setDescInput] = useState<string>('');
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await cskhApi.getTickets({
        customerPhone: user?.phone || undefined,
        shipmentCode: prefilledShipmentCode,
      });
      setTickets(data);
      if (selectedTicket) {
        const refreshed = data.find((t) => t.id === selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (prefilledShipmentCode) {
        setShipmentCodeInput(prefilledShipmentCode);
      }
      loadData();
    }
  }, [visible, prefilledShipmentCode]);

  const handleCreateSubmit = async () => {
    if (!shipmentCodeInput.trim() || !titleInput.trim() || !descInput.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Mã vận đơn, Tiêu đề và Mô tả chi tiết khiếu nại.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const created = await cskhApi.createTicket({
        shipmentCode: shipmentCodeInput.trim().toUpperCase(),
        customerName: user?.displayName || user?.username || 'Khách hàng',
        customerPhone: user?.phone || '0900000000',
        category: categoryInput,
        title: titleInput.trim(),
        description: descInput.trim(),
      });
      Alert.alert(
        'Tiếp nhận khiếu nại thành công',
        `Mã phiếu: ${created.ticketCode}\nChuyên viên CSKH đang được chỉ định để hỗ trợ bạn trong vòng ${created.slaLimitHours} giờ.`,
        [
          {
            text: 'Xem chi tiết',
            onPress: () => {
              setSelectedTicket(created);
              setActiveTab('LIST');
              loadData();
            },
          },
        ]
      );
      setTitleInput('');
      setDescInput('');
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo phiếu khiếu nại. Vui lòng thử lại!');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSendingNote(true);
    try {
      const updated = await cskhApi.addNote(
        selectedTicket.id,
        replyText.trim(),
        user?.displayName || user?.username || 'Khách hàng'
      );
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setReplyText('');
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi phản hồi.');
    } finally {
      setSendingNote(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark" size={22} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Trung tâm Khiếu nại & Hỗ trợ</Text>
                <Text style={styles.headerSubtitle}>
                  Theo dõi tiến độ xử lý và bồi thường bưu phẩm Nexus
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab selector */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'LIST' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('LIST');
                setSelectedTicket(null);
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={activeTab === 'LIST' ? '#0284C7' : '#64748B'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'LIST' && styles.tabBtnTextActive]}>
                Khiếu nại của tôi ({tickets.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'CREATE' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('CREATE');
                setSelectedTicket(null);
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={activeTab === 'CREATE' ? '#0284C7' : '#64748B'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'CREATE' && styles.tabBtnTextActive]}>
                + Tạo khiếu nại mới
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'CREATE' ? (
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.formSectionTitle}>Thông tin yêu cầu bồi thường / khiếu nại</Text>

              <Text style={styles.label}>Mã vận đơn bưu gửi (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: NX-88992211"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={shipmentCodeInput}
                onChangeText={setShipmentCodeInput}
              />

              <Text style={styles.label}>Lý do khiếu nại (*)</Text>
              <View style={styles.categoryGrid}>
                {(Object.keys(CATEGORY_MAP) as CskhTicketCategory[]).map((cat) => {
                  const cfg = CATEGORY_MAP[cat];
                  const selected = categoryInput === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                      onPress={() => setCategoryInput(cat)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={cfg.icon}
                        size={18}
                        color={selected ? '#FFFFFF' : cfg.color}
                      />
                      <Text
                        style={[
                          styles.categoryCardText,
                          selected && styles.categoryCardTextSelected,
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Tiêu đề vắn tắt (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Hộp hàng bị nứt vỡ, móp méo khi bóc seal"
                placeholderTextColor="#94A3B8"
                value={titleInput}
                onChangeText={setTitleInput}
              />

              <Text style={styles.label}>Mô tả chi tiết sự cố (*)</Text>
              <TextInput
                style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                placeholder="Mô tả cụ thể tình trạng hàng hóa, thái độ bưu tá, hoặc yêu cầu đền bù thiệt hại..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={descInput}
                onChangeText={setDescInput}
              />

              <View style={styles.slaCommitNotice}>
                <Ionicons name="time-outline" size={18} color="#D97706" />
                <Text style={styles.slaCommitText}>
                  Cam kết SLA bưu chính: Đội ngũ CSKH và Hội đồng Giám định sẽ kiểm tra biên bản đồng
                  kiểm, phản hồi trong 12h - 24h làm việc.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.createSubmitBtn, submittingCreate && { opacity: 0.7 }]}
                onPress={handleCreateSubmit}
                disabled={submittingCreate}
                activeOpacity={0.85}
              >
                {submittingCreate ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.createSubmitBtnText}>Gửi yêu cầu giải quyết</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : selectedTicket ? (
            /* Ticket Detail View */
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 24 }}>
              <TouchableOpacity
                style={styles.backToListBtn}
                onPress={() => setSelectedTicket(null)}
              >
                <Ionicons name="arrow-back" size={16} color="#0284C7" />
                <Text style={styles.backToListText}>Quay lại danh sách khiếu nại</Text>
              </TouchableOpacity>

              <View style={styles.ticketDetailHero}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.ticketDetailCode}>{selectedTicket.ticketCode}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: STATUS_MAP[selectedTicket.status]?.bg || '#F1F5F9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: STATUS_MAP[selectedTicket.status]?.text || '#475569' },
                      ]}
                    >
                      {STATUS_MAP[selectedTicket.status]?.label || selectedTicket.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ticketDetailTitle}>{selectedTicket.title}</Text>
                <Text style={styles.ticketDetailShipment}>
                  Vận đơn liên quan: <Text style={{ fontWeight: '700' }}>{selectedTicket.shipmentCode}</Text>
                </Text>

                {/* SLA Timer badge */}
                <View style={styles.slaRow}>
                  <Ionicons name="timer-outline" size={15} color="#D97706" />
                  <Text style={styles.slaTimerText}>
                    Hạn xử lý: {getSlaText(selectedTicket.slaDeadline, selectedTicket.status === 'CLOSED').text} (Cam kết {selectedTicket.slaLimitHours}h)
                  </Text>
                </View>
              </View>

              {/* Claim Escalation Badge if available */}
              {selectedTicket.claimCode ? (
                <View style={styles.claimAlertBox}>
                  <Ionicons name="ribbon-outline" size={20} color="#B91C1C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.claimAlertTitle}>Đã chuyển sang Hồ sơ Bồi thường (Claims)</Text>
                    <Text style={styles.claimAlertCode}>Mã bồi thường: {selectedTicket.claimCode}</Text>
                    <Text style={styles.claimAlertDesc}>
                      Ban Pháp chế & Thẩm định rủi ro đang phân định trách nhiệm bưu tá/bưu cục theo ma trận 4 ô.
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Handler box */}
              <View style={styles.handlerBox}>
                <Ionicons name="headset-outline" size={18} color="#0284C7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.handlerName}>
                    Chuyên viên phụ trách: {selectedTicket.assignedAgent || 'Đang chỉ định'}
                  </Text>
                  <Text style={styles.handlerHub}>{selectedTicket.assignedHubName}</Text>
                </View>
              </View>

              {/* Notes thread */}
              <Text style={styles.threadTitle}>Nhật ký trao đổi & Cập nhật ({selectedTicket.notes?.length || 0})</Text>
              <View style={styles.notesContainer}>
                {selectedTicket.notes?.map((n) => (
                  <View key={n.id} style={styles.noteCard}>
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteAuthor}>
                        {n.author} <Text style={styles.noteRole}>({n.authorRole})</Text>
                      </Text>
                      <Text style={styles.noteTime}>{formatDateTime(n.createdAt)}</Text>
                    </View>
                    <Text style={styles.noteBody}>{n.content}</Text>
                  </View>
                ))}
              </View>

              {/* Add Note Input */}
              <View style={styles.replyRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Gửi thêm thông tin, ảnh mở hộp, phản hồi..."
                  placeholderTextColor="#94A3B8"
                  value={replyText}
                  onChangeText={setReplyText}
                />
                <TouchableOpacity
                  style={[styles.replyBtn, (!replyText.trim() || sendingNote) && { opacity: 0.5 }]}
                  onPress={handleSendReply}
                  disabled={!replyText.trim() || sendingNote}
                >
                  {sendingNote ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Ticket List View */
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 24 }}>
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#0284C7" />
                  <Text style={styles.loadingText}>Đang tải danh sách khiếu nại...</Text>
                </View>
              ) : tickets.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color="#10B981" />
                  <Text style={styles.emptyTitle}>Chưa có khiếu nại nào</Text>
                  <Text style={styles.emptySubtitle}>
                    Mọi đơn hàng của bạn đang được vận chuyển an toàn. Nếu phát sinh sự cố bể vỡ hoặc giục giao, hãy bấm nút tạo khiếu nại bên trên.
                  </Text>
                </View>
              ) : (
                tickets.map((t) => {
                  const isClosed = t.status === 'CLOSED' || t.status === 'RESOLVED';
                  const sla = getSlaText(t.slaDeadline, isClosed);
                  const st = STATUS_MAP[t.status] || { label: t.status, bg: '#F1F5F9', text: '#475569' };
                  const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.GENERAL_INQUIRY;

                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.ticketCard}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTicket(t)}
                    >
                      <View style={styles.ticketCardTop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name={cat.icon} size={16} color={cat.color} />
                          <Text style={styles.ticketCardCode}>{t.ticketCode}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                          <Text style={[styles.statusPillText, { color: st.text }]}>{st.label}</Text>
                        </View>
                      </View>

                      <Text style={styles.ticketCardTitle} numberOfLines={2}>
                        {t.title}
                      </Text>

                      <View style={styles.ticketCardMeta}>
                        <Text style={styles.metaShipment}>Đơn: {t.shipmentCode}</Text>
                        <View style={styles.slaBadge}>
                          <Ionicons name="time-outline" size={12} color={sla.isUrgent ? '#DC2626' : '#64748B'} />
                          <Text style={[styles.slaBadgeText, sla.isUrgent && { color: '#DC2626', fontWeight: '700' }]}>
                            {sla.text}
                          </Text>
                        </View>
                      </View>

                      {t.claimCode ? (
                        <View style={styles.claimMiniBadge}>
                          <Ionicons name="ribbon" size={12} color="#DC2626" />
                          <Text style={styles.claimMiniText}>Hồ sơ Bồi thường: {t.claimCode}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    ...shadows.sm,
  },
  ticketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketCardCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  ticketCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaShipment: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slaBadgeText: {
    fontSize: 11,
    color: '#64748B',
  },
  claimMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  claimMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  categoryCardSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  categoryCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  categoryCardTextSelected: {
    color: '#FFFFFF',
  },
  slaCommitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 14,
    marginBottom: 14,
  },
  slaCommitText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  createSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    ...shadows.sm,
  },
  createSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backToListText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  ticketDetailHero: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  ticketDetailCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  ticketDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  ticketDetailShipment: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  slaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  slaTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  claimAlertBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  claimAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  claimAlertCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  claimAlertDesc: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 4,
    lineHeight: 15,
  },
  handlerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 14,
  },
  handlerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  handlerHub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  threadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  notesContainer: {
    gap: 8,
    marginBottom: 12,
  },
  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  noteRole: {
    fontWeight: '400',
    color: '#64748B',
  },
  noteTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  noteBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  replyRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#0F172A',
  },
  replyBtn: {
    backgroundColor: '#0284C7',
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
