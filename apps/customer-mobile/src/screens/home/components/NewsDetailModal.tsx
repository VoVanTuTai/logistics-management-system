import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing } from '../../../theme';

export interface NewsArticleItem {
  id: string;
  tag: string;
  tagBg: string;
  tagColor: string;
  title: string;
  desc: string;
  image: any;
  contentParagraphs?: string[];
  highlights?: { icon: string; title: string; text: string }[];
}

interface NewsDetailModalProps {
  visible: boolean;
  article: NewsArticleItem | null;
  onClose: () => void;
  onActionPress?: () => void;
}

export function NewsDetailModal({
  visible,
  article,
  onClose,
  onActionPress,
}: NewsDetailModalProps): React.JSX.Element {
  if (!article) return <React.Fragment />;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* TOP DRAG / CLOSE BAR */}
          <View style={styles.topHeaderBar}>
            <View style={styles.dragPill} />
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO ARTICLE IMAGE */}
            <View style={styles.imageWrapper}>
              <Image
                source={article.image}
                style={styles.articleImage}
                resizeMode="cover"
              />
              <View style={[styles.tagBadge, { backgroundColor: article.tagBg }]}>
                <Text style={[styles.tagText, { color: article.tagColor }]}>
                  {article.tag}
                </Text>
              </View>
            </View>

            {/* META ROW */}
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>15/08/2026</Text>
              <Text style={styles.metaDot}>•</Text>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>3 phút đọc</Text>
            </View>

            {/* TITLE & DESCRIPTION */}
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleIntro}>{article.desc}</Text>

            <View style={styles.divider} />

            {/* HIGHLIGHT FEATURES LIST */}
            <Text style={styles.sectionHeaderTitle}>Điểm nổi bật dịch vụ</Text>
            <View style={styles.highlightsContainer}>
              {(article.highlights || defaultHighlights).map((item, idx) => (
                <View key={idx} style={styles.highlightRow}>
                  <View style={styles.highlightIconCircle}>
                    <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.highlightTextCol}>
                    <Text style={styles.highlightTitle}>{item.title}</Text>
                    <Text style={styles.highlightText}>{item.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* ARTICLE CONTENT PARAGRAPHS */}
            <Text style={styles.sectionHeaderTitle}>Chi tiết dịch vụ & Ưu đãi</Text>
            {(article.contentParagraphs || defaultParagraphs).map((para, idx) => (
              <Text key={idx} style={styles.paragraphText}>
                {para}
              </Text>
            ))}

            {/* FOOTER CTA BUTTON */}
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.88}
              onPress={() => {
                onClose();
                if (onActionPress) onActionPress();
              }}
            >
              <Ionicons name="cube-outline" size={20} color={colors.surface} />
              <Text style={styles.ctaButtonText}>Tạo đơn trải nghiệm ngay</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const defaultHighlights = [
  {
    icon: 'flash-outline',
    title: 'Tốc độ ưu việt',
    text: 'Cam kết thời gian giao hàng chuẩn xác đến từng mốc giờ.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Bảo hiểm toàn diện',
    text: 'Đảm bảo an toàn hàng hóa 100%, bồi thường nhanh chóng.',
  },
  {
    icon: 'location-outline',
    title: 'Mạng lưới bao phủ 63 tỉnh thành',
    text: 'Hệ thống bưu cục và kho trung chuyển rộng khắp toàn quốc.',
  },
];

const defaultParagraphs = [
  'NEXUS Express không ngừng cải tiến công nghệ vận tải và hạ tầng kho bãi nhằm mang đến trải nghiệm giao nhận mượt mà, tiện lợi nhất cho quý khách hàng và các chủ shop online.',
  'Mọi hành trình đơn hàng đều được theo dõi trực tuyến qua GPS realtime. Đội ngũ tổng đài CSKH hỗ trợ 24/7 sẵn sàng giải đáp mọi thắc mắc của bạn.',
];

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  topHeaderBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  dragPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    position: 'relative',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  articleTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 25,
    marginBottom: 6,
  },
  articleIntro: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md + 2,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  highlightsContainer: {
    gap: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  highlightIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  highlightTextCol: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  highlightText: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
  },
  paragraphText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
    ...shadows.md,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.surface,
  },
});
