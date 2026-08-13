import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppModal } from '../../components/common/AppModal';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { authStore, useAuthSession } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const PROFILE_MENUS = [
  { id: 'account', title: 'Thông tin tài khoản', icon: 'person-outline' },
  { id: 'addresses', title: 'Địa chỉ của tôi', icon: 'location-outline' },
  { id: 'orders', title: 'Đơn hàng của tôi', icon: 'cube-outline' },
  { id: 'notifs', title: 'Thông báo & Khuyến mãi', icon: 'notifications-outline' },
  { id: 'settings', title: 'Cài đặt ứng dụng', icon: 'settings-outline' },
  { id: 'help', title: 'Trợ giúp & Hỗ trợ', icon: 'help-circle-outline' },
];

export function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const session = useAuthSession();
  const user = session?.user;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    authStore.logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.flex}>
      {/* HEADER */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Tài khoản cá nhân</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* USER CARD */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.userInfoCol}>
            <Text style={styles.userName}>{user?.displayName || user?.username || 'Khách hàng'}</Text>
            <Text style={styles.userPhone}>{user?.phone || user?.username || 'Chưa cập nhật SĐT'}</Text>
            <Text style={styles.userEmail}>Vai trò: {user?.roles?.join(', ') || 'CUSTOMER'}</Text>
          </View>
        </View>

        {/* POINTS & VOUCHERS BANNER */}
        <View style={styles.statBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>786</Text>
            <Text style={styles.statLabel}>Điểm tích lũy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>4</Text>
            <Text style={styles.statLabel}>Voucher ưu đãi</Text>
          </View>
        </View>

        {/* MENU ITEMS */}
        <View style={styles.menuCard}>
          {PROFILE_MENUS.map((menu) => (
            <TouchableOpacity
              key={menu.id}
              activeOpacity={0.7}
              style={styles.menuRow}
              onPress={() => {
                if (menu.id === 'orders') navigation.navigate('OrdersTab');
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={menu.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuTitle}>{menu.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity activeOpacity={0.8} style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* LOGOUT CONFIRM MODAL */}
      <AppModal
        visible={showLogoutModal}
        variant="confirm"
        title="Đăng xuất tài khoản"
        message="Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng Nexus Express?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerArea: {
    backgroundColor: colors.surface,
    paddingTop: spacing.xl + 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statBanner: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderSubtle,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
});
