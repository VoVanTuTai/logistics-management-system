import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import {
  ProfileHeader,
  type ProfileHeaderData,
} from '../../components/profile/ProfileHeader';
import { ProfileShortcutGrid } from '../../components/profile/ProfileShortcutGrid';
import type { ProfileShortcutItemData } from '../../components/profile/ProfileShortcutItem';
import { SettingsSection } from '../../components/profile/SettingsSection';
import type { SettingsItemData } from '../../components/profile/SettingsItem';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../features/auth/auth.store';
import { appEnv } from '../../utils/env';

const shortcutItems: ProfileShortcutItemData[] = [
  {
    id: 'shopping',
    label: 'Mua sắm',
    iconName: 'bag-handle-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'stats',
    label: 'Thống kê',
    iconName: 'stats-chart-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
  {
    id: 'qr-order',
    label: 'QR lên đơn',
    iconName: 'qr-code-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'extra-feature',
    label: 'Chức năng bổ sung',
    iconName: 'grid-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
  },
  {
    id: 'weight-change',
    label: 'Đăng ký đổi trọng lượng',
    iconName: 'barbell-outline',
    iconColor: '#24539E',
    iconBgColor: '#E6F0FF',
  },
  {
    id: 'learning-center',
    label: 'Trung tâm học tập',
    iconName: 'school-outline',
    iconColor: '#0A6E89',
    iconBgColor: '#E1F8FA',
  },
  {
    id: 'uniform-check',
    label: 'Kiểm tra đồng phục',
    iconName: 'shirt-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
];

const settingsItems: SettingsItemData[] = [
  {
    id: 'print-setup',
    label: 'Thiết lập in',
    iconName: 'print-outline',
  },
  {
    id: 'base-data',
    label: 'Dữ liệu cơ bản',
    iconName: 'file-tray-full-outline',
  },
  {
    id: 'help-center',
    label: 'Trung tâm trợ giúp',
    iconName: 'help-circle-outline',
  },
  {
    id: 'call-log-setup',
    label: 'Thiết lập call log',
    iconName: 'call-outline',
  },
  {
    id: 'about-jnt',
    label: 'Về J&T',
    iconName: 'information-circle-outline',
  },
];

export function ProfileScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const authLoading = useAuthStore((state) => state.isLoading);

  const roles = session?.user.roles ?? [];
  const userData: ProfileHeaderData = {
    fullName: session?.user.username ?? 'Courier',
    branchName: roles.length > 0 ? `Vai trò: ${roles.join(', ')}` : 'Vai trò: courier',
    employeeCode: session?.user.id ?? appEnv.courierId,
    phoneNumber: '---',
    starTierLabel: 'Đang cập nhật',
  };

  const handleLogout = () => {
    void logout();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ProfileHeader
            user={userData}
            onPressStarDetail={() => {
              Alert.alert('Hạng sao', 'Chi tiết hạng sao sẽ cập nhật theo API.');
            }}
          />

          <ProfileShortcutGrid
            items={shortcutItems}
            onPressItem={(item) => {
              Alert.alert('Tiện ích', item.label);
            }}
          />

          <SettingsSection
            title="Cài đặt và tiện ích"
            items={settingsItems}
            onPressItem={(item) => {
              Alert.alert('Cài đặt', item.label);
            }}
          />

          <Pressable
            onPress={handleLogout}
            disabled={authLoading}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
              authLoading && styles.logoutButtonDisabled,
            ]}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  logoutButton: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...theme.shadow.card,
  },
  logoutButtonPressed: {
    opacity: 0.9,
  },
  logoutButtonDisabled: {
    opacity: 0.65,
  },
  logoutButtonText: {
    ...theme.typography.subtitle.md,
    color: '#FFFFFF',
  },
});
