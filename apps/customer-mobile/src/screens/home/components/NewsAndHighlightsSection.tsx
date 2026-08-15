import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, shadows, spacing } from '../../../theme';
import { NewsDetailModal, type NewsArticleItem } from './NewsDetailModal';

const newsTruckImg = require('../../../../assets/news-truck.png');
const newsTrackingImg = require('../../../../assets/news-tracking.png');
const newsProfileImg = require('../../../../assets/news-profile.png');
const newsSecurityImg = require('../../../../assets/news-security.png');
const newsHandoverImg = require('../../../../assets/news-handover.png');

interface NewsAndHighlightsSectionProps {
  onPressCreateOrder?: () => void;
}

export function NewsAndHighlightsSection({
  onPressCreateOrder,
}: NewsAndHighlightsSectionProps): React.JSX.Element {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticleItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const newsItems: NewsArticleItem[] = [
    {
      id: 'n1',
      tag: 'VẬN CHUYỂN',
      tagBg: '#EFF6FF',
      tagColor: '#1D4ED8',
      title: 'Vận chuyển hàng lớn & gom hàng toàn quốc',
      desc: 'Giải pháp tối ưu cước phí dành riêng cho doanh nghiệp & shop online lớn',
      image: newsTruckImg,
      highlights: [
        {
          icon: 'pricetags-outline',
          title: 'Chiết khấu cước lên đến 25%',
          text: 'Áp dụng cho các hợp đồng vận chuyển nguyên chuyến và gửi hàng thường xuyên.',
        },
        {
          icon: 'storefront-outline',
          title: 'Miễn phí lưu kho 7 ngày',
          text: 'Hệ thống kho bãi rộng rãi tại TP.HCM, Hà Nội & Đà Nẵng.',
        },
        {
          icon: 'barcode-outline',
          title: 'Đánh mã hàng tự động',
          text: 'Công nghệ quét mã vạch và phân loại tự động 100%.',
        },
      ],
      contentParagraphs: [
        'Dịch vụ vận chuyển hàng lớn của NEXUS Express giúp doanh nghiệp tối ưu chi phí hậu cần tối đa. Chúng tôi cung cấp các gói dịch vụ gom hàng linh hoạt, giao hàng liên tỉnh siêu tốc với mức cước ưu đãi nhất thị trường.',
        'Tất cả các chuyến xe đều được gắn thiết bị giám sát hành trình GPS và kiểm soát khoang hàng nghiêm ngặt, đảm bảo hàng hóa của quý khách luôn an toàn tuyệt đối.',
      ],
    },
    {
      id: 'n2',
      tag: 'CÔNG NGHỆ',
      tagBg: '#FEF3C7',
      tagColor: '#D97706',
      title: 'Theo dõi hành trình thời gian thực 24/7',
      desc: 'Công nghệ định vị GPS tích hợp AI cập nhật vị trí đơn hàng chi tiết từng phút',
      image: newsTrackingImg,
      highlights: [
        {
          icon: 'navigate-outline',
          title: 'Cập nhật trực tiếp GPS',
          text: 'Theo dõi chính xác vị trí Shipper và xe tải trên bản đồ.',
        },
        {
          icon: 'notifications-active-outline',
          title: 'Thông báo đẩy tức thì',
          text: 'Nhận notification tự động khi đơn hàng thay đổi trạng thái.',
        },
        {
          icon: 'document-text-outline',
          title: 'Đối soát COD tự động',
          text: 'Quản lý báo cáo doanh số và tiền COD tự động hàng ngày.',
        },
      ],
      contentParagraphs: [
        'NEXUS Express tiên phong ứng dụng công nghệ trí tuệ nhân tạo (AI) vào việc tối ưu tuyến đường giao hàng và dự báo thời gian giao nhận chính xác đến từng phút.',
        'Khách hàng có thể tra cứu mã vận đơn nhanh chóng ngay trên ứng dụng di động hoặc website mà không cần thao tác phức tạp.',
      ],
    },
    {
      id: 'n3',
      tag: 'DỊCH VỤ',
      tagBg: '#ECFDF5',
      tagColor: '#059669',
      title: 'Giao hàng tận tay – Tận tâm phục vụ',
      desc: 'NEXUS Express cam kết giao đúng hẹn, bảo vệ nguyên vẹn từng bưu gửi',
      image: newsHandoverImg,
      highlights: [
        {
          icon: 'people-outline',
          title: 'Shipper thân thiện & Chu đáo',
          text: 'Đội ngũ giao hàng được đào tạo bài bản, lịch sự và chu đáo.',
        },
        {
          icon: 'camera-outline',
          title: 'Chụp ảnh xác nhận giao hàng',
          text: 'Minh bạch hình ảnh người nhận và chữ ký số.',
        },
        {
          icon: 'alarm-outline',
          title: 'Hẹn giờ giao linh hoạt',
          text: 'Cho phép người nhận chủ động chọn khung giờ nhận hàng.',
        },
      ],
      contentParagraphs: [
        'Mỗi bưu gửi đều gửi gắm sự tin tưởng của quý khách. NEXUS Express cam kết mang tới trải nghiệm dịch vụ giao nhận tận tay vượt trội với thái độ phục vụ chuyên nghiệp.',
        'Nếu người nhận vắng nhà, Shipper sẽ chủ động liên hệ hẹn lại lịch giao tối đa 3 lần hoàn toàn miễn phí.',
      ],
    },
    {
      id: 'n4',
      tag: 'AN TOÀN',
      tagBg: '#F3E8FF',
      tagColor: '#7C3AED',
      title: 'Bảo mật & Bảo hiểm hàng hóa 100%',
      desc: 'Cam kết đền bù 100% giá trị hàng hóa khi xảy ra sự cố hư hỏng hoặc thất lạc',
      image: newsSecurityImg,
      highlights: [
        {
          icon: 'shield-checkmark-outline',
          title: 'Bảo hiểm 100% giá trị',
          text: 'Khai giá hàng hóa minh bạch và đền bù tức thì trong 24h.',
        },
        {
          icon: 'lock-closed-outline',
          title: 'Bảo mật thông tin khách hàng',
          text: 'Chuẩn mã hóa dữ liệu an toàn cao nhất.',
        },
        {
          icon: 'cube-outline',
          title: 'Đóng gói bọc xốp miễn phí',
          text: 'Hỗ trợ đóng gói hàng dễ vỡ tại các bưu cục.',
        },
      ],
      contentParagraphs: [
        'Chính sách bảo hiểm hàng hóa của NEXUS Express giúp khách hàng hoàn toàn yên tâm khi gửi các sản phẩm có giá trị cao.',
        'Quy trình xử lý khiếu nại minh bạch, giải quyết dứt điểm trong vòng 24 giờ làm việc.',
      ],
    },
  ];

  const handleCardPress = (item: NewsArticleItem) => {
    setSelectedArticle(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tin tức & Ưu đãi</Text>
        <Text style={styles.sectionSub}>Khám phá dịch vụ & giải pháp từ NEXUS</Text>
      </View>

      {/* COMPACT 2-COLUMN GRID OF CARDS (MỖI DÒNG 2 CÁI) */}
      <View style={styles.grid}>
        {newsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            style={styles.newsCard}
            onPress={() => handleCardPress(item)}
          >
            {/* TOP 3D ILLUSTRATION IMAGE */}
            <View style={styles.imageContainer}>
              <Image
                source={item.image}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={[styles.tagBadge, { backgroundColor: item.tagBg }]}>
                <Text style={[styles.tagBadgeText, { color: item.tagColor }]}>
                  {item.tag}
                </Text>
              </View>
            </View>

            {/* CARD CONTENT */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.desc}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ARTICLE DETAIL MODAL */}
      <NewsDetailModal
        visible={modalVisible}
        article={selectedArticle}
        onClose={() => setModalVisible(false)}
        onActionPress={onPressCreateOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  newsCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardContent: {
    padding: spacing.sm + 2,
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 17,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 10.5,
    color: colors.textMuted,
    lineHeight: 14,
  },
});
