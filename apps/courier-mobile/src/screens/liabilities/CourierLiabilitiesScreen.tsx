import React, { useEffect, useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useLiabilitiesStore } from '../../features/liabilities/liabilities.store';
import type { CourierLiabilityItem } from '../../features/liabilities/liabilities.types';
import { theme } from '../../theme';

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

const APPEAL_REASONS = [
  'Hàng hỏng / rò rỉ từ trước khi xuất kho',
  'Sự cố thời tiết bão lũ / bất khả kháng',
  'Bị phương tiện khác va quẹt (Có chứng cứ)',
  'Lỗi đóng gói của bưu cục gửi vi phạm SOP',
  'Khác (Trình bày chi tiết bên dưới)',
];

export function CourierLiabilitiesScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { items, hydrateLiabilities, submitAppeal, acceptLiability } = useLiabilitiesStore();

  const [selectedItemForAppeal, setSelectedItemForAppeal] = useState<CourierLiabilityItem | null>(
    null,
  );
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(APPEAL_REASONS[0]);
  const [appealNotes, setAppealNotes] = useState('');
  const [appealPhotoUrl, setAppealPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    void hydrateLiabilities();
  }, [hydrateLiabilities]);

  const totalPenalties = items.reduce((sum, item) => sum + item.penaltyAmount, 0);
  const activeDeductions = items
    .filter((i) => i.status === 'DEDUCTED' || i.status === 'ADJUDICATED')
    .reduce((sum, item) => sum + item.penaltyAmount, 0);
  const pendingAppealCount = items.filter((i) => i.status === 'APPEAL_SUBMITTED').length;
  const pendingActionCount = items.filter((i) => i.status === 'PENDING_EXPLANATION').length;

  const handleOpenAppealModal = (item: CourierLiabilityItem) => {
    setSelectedItemForAppeal(item);
    setSelectedReason(APPEAL_REASONS[0]);
    setAppealNotes('');
    setAppealPhotoUrl('');
    setAppealModalVisible(true);
  };

  const handleConfirmSubmitAppeal = async () => {
    if (!selectedItemForAppeal) return;
    if (!appealNotes.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập nội dung giải trình sự việc.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAppeal(selectedItemForAppeal.id, {
        appealReason: selectedReason,
        appealNotes: appealNotes.trim(),
        photoUrl: appealPhotoUrl.trim() || undefined,
      });
      setAppealModalVisible(false);
      setSelectedItemForAppeal(null);
      Alert.alert(
        'Đã gửi đơn kháng cáo!',
        'Đơn kháng cáo của bạn đã được chuyển tới Ban Giám Sát QA. Khoản phạt này sẽ được tạm hoãn trừ tiền trong lúc chờ phúc khảo.',
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi đơn kháng cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAcceptLiability = (item: CourierLiabilityItem) => {
    Alert.alert(
      'Xác nhận nhận lỗi',
      `Bạn đồng ý với kết luận sự cố và chấp nhận khấu trừ ${formatCurrency(item.penaltyAmount)} vào kỳ đối soát lương?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý khấu trừ',
          style: 'destructive',
          onPress: () => {
            void acceptLiability(item.id);
            Alert.alert('Đã ghi nhận', 'Hồ sơ đã được chuyển sang trạng thái đã khấu trừ.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </Pressable>
          <View style={styles.topBarTextWrap}>
            <Text style={styles.topBarTitle}>Đơn bồi thường & Khiếu nại</Text>
            <Text style={styles.topBarSubtitle}>Minh bạch chế tài & Bảo vệ quyền lợi bưu tá</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Overview Banner */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Tổng tiền phạt chỉ định</Text>
                <Text style={styles.summaryTotal}>{formatCurrency(totalPenalties)}</Text>
              </View>
              <View style={styles.summaryDeductedBadge}>
                <Text style={styles.summaryDeductedLabel}>Đã khấu trừ</Text>
                <Text style={styles.summaryDeductedVal}>{formatCurrency(activeDeductions)}</Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryGridItem}>
                <Text style={styles.summaryGridVal}>{items.length}</Text>
                <Text style={styles.summaryGridLabel}>Tổng vụ việc</Text>
              </View>
              <View style={styles.summaryGridItem}>
                <Text style={[styles.summaryGridVal, { color: '#EA580C' }]}>
                  {pendingActionCount}
                </Text>
                <Text style={styles.summaryGridLabel}>Chờ giải trình</Text>
              </View>
              <View style={styles.summaryGridItem}>
                <Text style={[styles.summaryGridVal, { color: '#2563EB' }]}>
                  {pendingAppealCount}
                </Text>
                <Text style={styles.summaryGridLabel}>Đang kháng cáo</Text>
              </View>
            </View>

            <View style={styles.policyNotice}>
              <Ionicons name="shield-checkmark" size={14} color="#047857" />
              <Text style={styles.policyNoticeText}>
                Các đơn đang nộp kháng cáo sẽ được tạm hoãn trừ tiền cho đến khi có phán quyết phúc khảo.
              </Text>
            </View>
          </View>

          {/* List of Claims */}
          <Text style={styles.sectionHeader}>Danh sách hồ sơ sự cố liên quan</Text>

          {items.map((item) => {
            const isPending = item.status === 'PENDING_EXPLANATION';
            const isAppealed = item.status === 'APPEAL_SUBMITTED';
            const isDeducted = item.status === 'DEDUCTED';

            return (
              <View key={item.id} style={styles.claimCard}>
                {/* Card Top */}
                <View style={styles.cardHeader}>
                  <View style={styles.codeWrap}>
                    <Text style={styles.claimCode}>{item.claimCode}</Text>
                    <Text style={styles.shipmentCode}>Vận đơn: {item.shipmentCode}</Text>
                  </View>

                  {isPending ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                      <View style={[styles.statusDot, { backgroundColor: '#EA580C' }]} />
                      <Text style={[styles.statusText, { color: '#C2410C' }]}>Chờ giải trình</Text>
                    </View>
                  ) : isAppealed ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                      <View style={[styles.statusDot, { backgroundColor: '#2563EB' }]} />
                      <Text style={[styles.statusText, { color: '#1D4ED8' }]}>Đang kháng cáo</Text>
                    </View>
                  ) : isDeducted ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
                      <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
                      <Text style={[styles.statusText, { color: '#B91C1C' }]}>Đã khấu trừ</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
                      <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                      <Text style={[styles.statusText, { color: '#047857' }]}>Đã giải quyết</Text>
                    </View>
                  )}
                </View>

                {/* Goods Info */}
                <View style={styles.goodsInfoRow}>
                  <Ionicons name="cube-outline" size={16} color="#64748B" />
                  <Text style={styles.goodsInfoText}>{item.itemDescription}</Text>
                </View>

                <View style={styles.damageBox}>
                  <Text style={styles.damageLabel}>Thiệt hại ghi nhận:</Text>
                  <Text style={styles.damageText}>{item.damageDescription}</Text>
                </View>

                {/* QA Finding Box */}
                <View style={styles.qaBox}>
                  <View style={styles.qaHeader}>
                    <Ionicons name="hammer-outline" size={14} color="#7C3AED" />
                    <Text style={styles.qaTitle}>Kết luận phân định từ Ban Giám Sát QA:</Text>
                  </View>
                  <Text style={styles.qaContent}>{item.qaFinding}</Text>
                  <Text style={styles.qaBy}>
                    Kết luận bởi: <strong>{item.adjudicatedBy}</strong> ({item.incidentDate})
                  </Text>
                </View>

                {/* Evidence Photos */}
                {item.evidencePhotos && item.evidencePhotos.length > 0 ? (
                  <View style={styles.photosSection}>
                    <Text style={styles.photosSectionTitle}>Ảnh bằng chứng hiện trường:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                      {item.evidencePhotos.map((photo) => (
                        <Pressable
                          key={photo.id}
                          style={styles.photoThumbWrap}
                          onPress={() => setPreviewPhotoUrl(photo.url)}
                        >
                          <Image source={{ uri: photo.url }} style={styles.photoThumb} />
                          <Text style={styles.photoLabel} numberOfLines={1}>
                            {photo.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {/* Submitted Appeal View */}
                {isAppealed && item.appealReason ? (
                  <View style={styles.appealResultBox}>
                    <View style={styles.appealResultHeader}>
                      <Ionicons name="document-text-outline" size={14} color="#2563EB" />
                      <Text style={styles.appealResultTitle}>Nội dung kháng cáo của bạn:</Text>
                    </View>
                    <Text style={styles.appealReasonText}>Lý do: {item.appealReason}</Text>
                    <Text style={styles.appealNotesText}>{item.appealNotes}</Text>
                    <Text style={styles.appealTimeText}>
                      Đã gửi lúc: {item.appealSubmittedAt ? new Date(item.appealSubmittedAt).toLocaleString('vi-VN') : 'Mới đây'}
                    </Text>
                  </View>
                ) : null}

                {/* Penalty Bar & Actions */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.penaltyLabel}>Số tiền bồi hoàn chỉ định:</Text>
                    <Text style={styles.penaltyVal}>{formatCurrency(item.penaltyAmount)}</Text>
                  </View>

                  {isPending ? (
                    <View style={styles.actionBtnRow}>
                      <Pressable
                        style={({ pressed }) => [styles.acceptBtn, pressed && styles.pressed]}
                        onPress={() => handleConfirmAcceptLiability(item)}
                      >
                        <Text style={styles.acceptBtnText}>Chấp nhận đền</Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [styles.appealBtn, pressed && styles.pressed]}
                        onPress={() => handleOpenAppealModal(item)}
                      >
                        <Ionicons name="alert-circle-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.appealBtnText}>Gửi kháng cáo</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Modal: Gửi kháng cáo */}
        <Modal
          visible={appealModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAppealModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Đơn giải trình & Kháng cáo sự cố</Text>
                  <Text style={styles.modalSub}>
                    Mã hồ sơ: {selectedItemForAppeal?.claimCode} • Vận đơn:{' '}
                    {selectedItemForAppeal?.shipmentCode}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setAppealModalVisible(false)}
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalLabel}>Chọn nguyên nhân giải trình chính:</Text>
                <View style={styles.reasonList}>
                  {APPEAL_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                        onPress={() => setSelectedReason(reason)}
                      >
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? theme.colors.primary : '#94A3B8'}
                        />
                        <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                          {reason}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.modalLabel, { marginTop: 14 }]}>
                  Nội dung tường trình chi tiết sự việc (*):
                </Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="Ghi rõ thời gian, địa điểm, nhân chứng hoặc đề nghị trích xuất camera bàn giao tại bưu cục..."
                  value={appealNotes}
                  onChangeText={setAppealNotes}
                  style={styles.modalTextarea}
                  placeholderTextColor="#94A3B8"
                />

                <Text style={[styles.modalLabel, { marginTop: 14 }]}>
                  Link ảnh bằng chứng đính kèm (nếu có):
                </Text>
                <TextInput
                  placeholder="https://..."
                  value={appealPhotoUrl}
                  onChangeText={setAppealPhotoUrl}
                  style={styles.modalInput}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.pressed]}
                  onPress={() => setAppealModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Hủy bỏ</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalSubmitBtn,
                    pressed && styles.pressed,
                    isSubmitting && styles.btnDisabled,
                  ]}
                  onPress={handleConfirmSubmitAppeal}
                  disabled={isSubmitting}
                >
                  <Text style={styles.modalSubmitText}>
                    {isSubmitting ? 'Đang gửi...' : 'Nộp đơn kháng cáo'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal xem ảnh phóng to */}
        <Modal
          visible={!!previewPhotoUrl}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewPhotoUrl(null)}
        >
          <View style={styles.photoPreviewOverlay}>
            <Pressable style={styles.photoCloseBtn} onPress={() => setPreviewPhotoUrl(null)}>
              <Ionicons name="close-circle" size={32} color="#FFFFFF" />
            </Pressable>
            {previewPhotoUrl ? (
              <Image
                source={{ uri: previewPhotoUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  topBarTextWrap: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  topBarSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  summaryBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  summaryDeductedBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'flex-end',
  },
  summaryDeductedLabel: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  summaryDeductedVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 12,
  },
  summaryGridItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  summaryGridVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryGridLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  policyNoticeText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 15,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  codeWrap: {
    flex: 1,
  },
  claimCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  shipmentCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  goodsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  goodsInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  damageBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  damageLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  damageText: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 16,
  },
  qaBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  qaTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
  qaContent: {
    fontSize: 12,
    color: '#4C1D95',
    lineHeight: 17,
  },
  qaBy: {
    fontSize: 10.5,
    color: '#7C3AED',
    marginTop: 6,
  },
  photosSection: {
    marginBottom: 12,
  },
  photosSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  photoList: {
    flexDirection: 'row',
  },
  photoThumbWrap: {
    marginRight: 8,
    width: 80,
  },
  photoThumb: {
    width: 80,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  photoLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 3,
  },
  appealResultBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  appealResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  appealResultTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  appealReasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  appealNotesText: {
    fontSize: 11.5,
    color: '#1E3A8A',
    marginTop: 2,
    lineHeight: 16,
  },
  appealTimeText: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 4,
  },
  penaltyLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  penaltyVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  acceptBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  appealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  appealBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  reasonList: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  reasonOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  reasonText: {
    fontSize: 12.5,
    color: '#475569',
    flex: 1,
  },
  reasonTextSelected: {
    fontWeight: '600',
    color: '#1D4ED8',
  },
  modalTextarea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: '95%',
    height: '75%',
  },
  pressed: {
    opacity: 0.75,
  },
});
