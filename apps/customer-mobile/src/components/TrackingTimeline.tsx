import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, shadows, spacing } from '../theme';
import type { TrackingEvent } from '../types';

interface TrackingTimelineProps {
  timeline: TrackingEvent[];
}

export function TrackingTimeline({ timeline }: TrackingTimelineProps): React.JSX.Element {
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={36} color={colors.textMuted} />
        <Text style={styles.emptyText}>Chưa có lịch sử trạng thái quét cho vận đơn này.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {timeline.map((item, index) => {
        const isFirst = index === 0; // Newest event on top
        const isLast = index === timeline.length - 1;
        const isCurrent = item.isCurrent || isFirst;

        // STT calculation (Ops Staff Web index)
        const sttNumber = item.stt || (timeline.length - index);

        return (
          <View key={item.id || `tl-${index}`} style={styles.timelineRow}>
            {/* LEFT COLUMN: SCANNED TIME & DATE (Ops: THỜI GIAN QUÉT) */}
            <View style={styles.leftCol}>
              <Text style={[styles.timeText, isCurrent && styles.activeTimeText]}>
                {item.timeLabel || (item.scannedAt || item.timestamp || '').split(' ')[1] || (item.scannedAt || item.timestamp || '')}
              </Text>
              <Text style={styles.dateText}>
                {item.dateLabel || (item.scannedAt || item.timestamp || '').split(' ')[0] || ''}
              </Text>
              <View style={styles.sttBadge}>
                <Text style={styles.sttText}>#{sttNumber}</Text>
              </View>
            </View>

            {/* CENTER COLUMN: CONNECTOR LINE & DOT */}
            <View style={styles.centerCol}>
              <View
                style={[
                  styles.dotBadge,
                  isCurrent && styles.currentDotBadge,
                ]}
              >
                {isCurrent ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                )}
              </View>

              {!isLast ? <View style={styles.connectorLine} /> : null}
            </View>

            {/* RIGHT COLUMN: REAL API EVENT DETAILS (Ops Web Fields) */}
            <View style={styles.rightCol}>
              {/* THAO TÁC & TRẠNG THÁI */}
              <View style={styles.actionHeaderRow}>
                <Text style={[styles.actionText, isCurrent && styles.activeActionText]}>
                  {item.action || item.title || 'Cập nhật hành trình'}
                </Text>

                {item.statusText ? (
                  <View style={[styles.statusBadge, isCurrent && styles.activeStatusBadge]}>
                    <Text style={[styles.statusBadgeText, isCurrent && styles.activeStatusBadgeText]}>
                      {item.statusText}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* VỊ TRÍ QUÉT (Ops: VỊ TRÍ) */}
              {(item.locationText || item.location) ? (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.locationValText}>
                    <Text style={styles.fieldLabelText}>Vị trí: </Text>
                    {item.locationText || item.location}
                  </Text>
                </View>
              ) : null}

              {/* THÔNG BÁO HÀNH TRÌNH (CÂU THÔNG BÁO IN ĐẬM, ĐỊA CHỈ CHỮ THƯỜNG) */}
              {item.noteText ? (
                <View style={styles.detailRow}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.info} style={{ marginTop: 2 }} />
                  <Text style={styles.noteValText}>
                    {item.boldPrefix ? (
                      <>
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                          {item.boldPrefix}
                        </Text>
                        <Text style={{ fontWeight: '400', color: colors.textSecondary }}>
                          {item.addressSuffix || ''}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: colors.textPrimary }}>{item.noteText}</Text>
                    )}
                  </Text>
                </View>
              ) : null}

              {/* MINH CHỨNG / ẢNH THẬT TỪ API (Ops: MINH CHỨNG - XEM ẢNH) */}
              {item.proofImageUrl ? (
                <View style={styles.proofSection}>
                  <Text style={styles.proofTitle}>Minh chứng hình ảnh quét:</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.proofImgWrap}
                    onPress={() => setSelectedProofImage(item.proofImageUrl || null)}
                  >
                    <Image source={{ uri: item.proofImageUrl }} style={styles.proofThumbnail} resizeMode="cover" />
                    <View style={styles.viewProofBadge}>
                      <Ionicons name="eye-outline" size={13} color={colors.surface} />
                      <Text style={styles.viewProofText}>Xem ảnh minh chứng</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      {/* FULLSCREEN PROOF IMAGE PREVIEW MODAL */}
      <Modal visible={!!selectedProofImage} transparent animationType="fade" onRequestClose={() => setSelectedProofImage(null)}>
        <View style={styles.imagePreviewModalOverlay}>
          <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setSelectedProofImage(null)}>
            <Ionicons name="close" size={28} color={colors.surface} />
          </TouchableOpacity>
          {selectedProofImage ? (
            <Image source={{ uri: selectedProofImage }} style={styles.fullscreenImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    minHeight: 68,
  },
  leftCol: {
    width: 74,
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  dateText: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  sttBadge: {
    marginTop: 6,
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  sttText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  centerCol: {
    width: 26,
    alignItems: 'center',
  },
  dotBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    zIndex: 2,
  },
  currentDotBadge: {
    backgroundColor: colors.surface,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderSubtle,
    marginTop: 2,
  },
  rightCol: {
    flex: 1,
    paddingLeft: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  activeActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  statusBadge: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeStatusBadge: {
    backgroundColor: colors.primaryLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeStatusBadgeText: {
    color: colors.primary,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 4,
  },
  fieldLabelText: {
    fontWeight: '700',
    color: colors.textSecondary,
  },
  locationValText: {
    fontSize: 12.5,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  noteValText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  actorValText: {
    fontSize: 12,
    color: colors.info,
    flex: 1,
    lineHeight: 17,
  },
  metaUploadText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  proofSection: {
    marginTop: spacing.sm + 2,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  proofTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  proofImgWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  proofThumbnail: {
    width: 140,
    height: 90,
    borderRadius: 10,
    backgroundColor: colors.borderSubtle,
  },
  viewProofBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    gap: 4,
  },
  viewProofText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.surface,
  },
  imagePreviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImage: {
    width: '90%',
    height: '80%',
  },
});
