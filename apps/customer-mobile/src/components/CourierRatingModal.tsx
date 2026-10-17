import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ratingsApi } from '../services/api/ratings.api';
import { colors, shadows, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  shipmentCode: string;
  courierName: string;
  courierPhone: string;
  customerPhone?: string;
  onRatingSubmitted?: () => void;
}

interface RatingTag {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const POSITIVE_TAGS: RatingTag[] = [
  { id: 'fast_delivery', label: 'Giao hàng nhanh', icon: 'flash-outline' },
  { id: 'friendly_courier', label: 'Bưu tá thân thiện', icon: 'happy-outline' },
  { id: 'intact_package', label: 'Hàng hóa nguyên vẹn', icon: 'cube-outline' },
  { id: 'call_before_arrival', label: 'Gọi điện trước khi phát', icon: 'call-outline' },
  { id: 'on_time', label: 'Đúng khung giờ hẹn', icon: 'time-outline' },
];

const NEGATIVE_TAGS: RatingTag[] = [
  { id: 'late_delivery', label: 'Giao trễ hẹn', icon: 'hourglass-outline' },
  { id: 'poor_attitude', label: 'Thái độ chưa chuẩn mực', icon: 'alert-circle-outline' },
  { id: 'dented_box', label: 'Kiện hàng bị móp méo', icon: 'warning-outline' },
  { id: 'no_call', label: 'Không liên hệ trước', icon: 'notifications-off-outline' },
  { id: 'wrong_cod', label: 'Sai lệch số tiền COD', icon: 'cash-outline' },
];

export function CourierRatingModal({
  visible,
  onClose,
  shipmentCode,
  courierName,
  courierPhone,
  customerPhone,
  onRatingSubmitted,
}: Props): React.JSX.Element {
  const [stars, setStars] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Giao hàng nhanh', 'Bưu tá thân thiện']);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const availableTags = stars >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS;

  const toggleTag = (tagLabel: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagLabel) ? prev.filter((t) => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const handleStarPress = (val: number) => {
    setStars(val);
    if (val >= 4) {
      setSelectedTags(['Giao hàng nhanh', 'Bưu tá thân thiện']);
    } else {
      setSelectedTags([]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ratingsApi.submitRating({
        shipmentCode,
        courierName,
        customerPhone,
        stars,
        tags: selectedTags,
        comment: comment.trim(),
      });
      Alert.alert(
        'Ghi nhận đánh giá',
        'Đánh giá của bạn đã được tiếp nhận và gửi đến Ban Giám sát Chất lượng Dịch vụ Nexus Logistics.',
        [
          {
            text: 'Đóng',
            onPress: () => {
              onRatingSubmitted?.();
              onClose();
            },
          },
        ]
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá lúc này. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="star" size={24} color="#EAB308" />
            </View>
            <Text style={styles.title}>Đánh giá giao hàng</Text>
            <Text style={styles.subtitle}>Mã vận đơn: {shipmentCode}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Courier Card */}
          <View style={styles.courierBox}>
            <View style={styles.courierAvatar}>
              <Ionicons name="person" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courierName}>{courierName || 'Bưu tá phụ trách'}</Text>
              <Text style={styles.courierSub}>Hotline: {courierPhone || 'Tổng đài phát'}</Text>
            </View>
            <View style={styles.shipperBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
              <Text style={styles.shipperBadgeText}>Đã xác minh</Text>
            </View>
          </View>

          {/* Star selector */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                activeOpacity={0.7}
                onPress={() => handleStarPress(num)}
                style={styles.starButton}
              >
                <Ionicons
                  name={num <= stars ? 'star' : 'star-outline'}
                  size={36}
                  color={num <= stars ? '#EAB308' : '#CBD5E1'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.starRatingText}>
            {stars === 5
              ? 'Rất hài lòng! Dịch vụ tuyệt vời'
              : stars === 4
              ? 'Hài lòng với chuyến phát'
              : stars === 3
              ? 'Bình thường, cần cải thiện'
              : stars === 2
              ? 'Chưa hài lòng với dịch vụ'
              : 'Rất thất vọng, dịch vụ kém'}
          </Text>

          {/* Quick tags */}
          <View style={styles.tagWrap}>
            {availableTags.map((tag) => {
              const active = selectedTags.includes(tag.label);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                  onPress={() => toggleTag(tag.label)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tag.icon}
                    size={14}
                    color={active ? '#0052CC' : '#64748B'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Comment text area */}
          <TextInput
            style={styles.input}
            placeholder="Chia sẻ thêm nhận xét của bạn để Nexus nâng cao chất lượng phục vụ..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={comment}
            onChangeText={setComment}
          />

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Bỏ qua</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: spacing.xl,
    ...shadows.lg,
  },
  header: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 6,
  },
  courierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  courierSub: {
    fontSize: 12,
    color: '#64748B',
  },
  shipperBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shipperBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  starRatingText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: spacing.md,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0052CC',
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#0052CC',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    ...shadows.sm,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
