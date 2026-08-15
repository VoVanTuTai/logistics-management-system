import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing } from '../../../theme';

const nexusHeroBannerImg = require('../../../../assets/nexus-hero-banner.jpg');

interface HomeHeaderProps {
  userName: string;
  onPressNotification?: () => void;
  onPressSearch?: () => void;
  onPressCreateOrder?: () => void;
}

export function HomeHeader({
  userName,
  onPressNotification,
  onPressSearch,
  onPressCreateOrder,
}: HomeHeaderProps): React.JSX.Element {
  return (
    <View style={styles.headerContainer}>
      {/* BACKGROUND HERO CONTAINER WITH MATCHING BLUE */}
      <View style={styles.heroBackground}>
        {/* TOP ROW: AVATAR + GREETING & NOTIFICATION */}
        <View style={styles.topRow}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {userName ? userName.charAt(0).toUpperCase() : 'K'}
              </Text>
            </View>
            <View style={styles.greetingCol}>
              <Text style={styles.greetingLabel}>Xin chào,</Text>
              <View style={styles.userNameRow}>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {userName}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color="#38BDF8"
                  style={styles.verifiedBadge}
                />
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
              <Ionicons name="gift-outline" size={22} color={colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={onPressNotification}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.surface} />
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>9+</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO BANNER IMAGE (FULL-WIDTH 100% EDGE-TO-EDGE) */}
        <TouchableOpacity
          activeOpacity={0.95}
          style={styles.bannerWrapper}
          onPress={onPressCreateOrder}
        >
          <Image
            source={nexusHeroBannerImg}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {/* FLOATING SEARCH & ROUTE CARD */}
      <View style={styles.floatingCardContainer}>
        <View style={styles.floatingCard}>
          {/* SEARCH BAR ROW */}
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.9}
            onPress={onPressSearch}
          >
            <Ionicons name="search-outline" size={22} color={colors.textMuted} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Tra cứu mã vận đơn / bưu cục...</Text>
            <View style={styles.searchRightActions}>
              <TouchableOpacity activeOpacity={0.7} style={styles.searchSubIconBtn}>
                <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.searchSubIconBtn}>
                <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <View style={styles.searchDivider} />

          {/* ROUTE PICKER ROW */}
          <TouchableOpacity
            style={styles.routeBox}
            activeOpacity={0.85}
            onPress={onPressCreateOrder}
          >
            <View style={styles.routeLineColumn}>
              <View style={styles.senderDot} />
              <View style={styles.dashedLine} />
              <Ionicons name="location" size={16} color={colors.primary} />
            </View>
            <View style={styles.routeTextColumn}>
              <View style={styles.routeItemRow}>
                <Text style={styles.routeLabel}>Người gửi</Text>
                <Text style={styles.routeValPlaceholder}>Chọn địa chỉ gửi hàng</Text>
              </View>
              <View style={styles.routeItemRow}>
                <Text style={styles.routeLabel}>Chuyển tới?</Text>
                <Text style={styles.routeValHighlight}>Nhập địa chỉ nhận hàng...</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: spacing.md,
  },
  heroBackground: {
    backgroundColor: '#0B4AB8',
    paddingTop: spacing.xl + 20,
    paddingHorizontal: 0,
    paddingBottom: spacing.xxl + 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.surface,
  },
  greetingCol: {
    justifyContent: 'center',
  },
  greetingLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.surface,
  },
  verifiedBadge: {
    marginLeft: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.surface,
  },
  bannerWrapper: {
    width: '110%',
    alignSelf: 'center',
    aspectRatio: 1.9,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '120%',
    height: '110%',
    transform: [{ scale: 1.12 }],
  },
  floatingCardContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: -60,
    zIndex: 10,
  },
  floatingCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textMuted,
  },
  searchRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchSubIconBtn: {
    padding: 4,
  },
  searchDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm + 2,
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  routeLineColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 20,
    height: 42,
    marginRight: spacing.sm,
  },
  senderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textPrimary,
    marginTop: 2,
  },
  dashedLine: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    borderStyle: 'dashed',
  },
  routeTextColumn: {
    flex: 1,
    gap: 6,
  },
  routeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 82,
  },
  routeValPlaceholder: {
    fontSize: 12.5,
    color: colors.textMuted,
    flex: 1,
  },
  routeValHighlight: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
});
