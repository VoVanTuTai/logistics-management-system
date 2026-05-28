import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
import type { AppNavigatorParamList } from '../../navigation/types';
import { appEnv } from '../../utils/env';
import { resolveCourierId, resolveCourierDisplayName } from '../../utils/courier';

const shortcutItems: ProfileShortcutItemData[] = [
  {
    id: 'stats',
    label: 'Thống kê',
    iconName: 'stats-chart-outline',
    iconColor: '#1D4ED8',
    iconBgColor: '#EFF6FF',
  },
  {
    id: 'scan',
    label: 'Quét mã',
    iconName: 'qr-code-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'cod',
    label: 'Tiền hàng COD',
    iconName: 'wallet-outline',
    iconColor: '#1D4ED8',
    iconBgColor: '#EFF6FF',
  },
  {
    id: 'pickup',
    label: 'Nhận hàng',
    iconName: 'cube-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'delivery',
    label: 'Phát hàng',
    iconName: 'paper-plane-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
  },
  {
    id: 'tracking',
    label: 'Theo dõi đơn',
    iconName: 'locate-outline',
    iconColor: '#1D4ED8',
    iconBgColor: '#EFF6FF',
  },
  {
    id: 'issue',
    label: 'Báo vấn đề',
    iconName: 'alert-circle-outline',
    iconColor: '#C25B12',
    iconBgColor: '#FFEDD5',
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
  const navigation = useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const authLoading = useAuthStore((state) => state.isLoading);

  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const courierName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });

  const roles = session?.user.roles ?? [];
  const userData: ProfileHeaderData = {
    fullName: courierName,
    branchName: roles.length > 0 ? `Vai trò: ${roles.join(', ')}` : 'Vai trò: courier',
    employeeCode: courierId,
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
              if (item.id === 'stats') {
                navigation.navigate('MainTabs', { screen: 'Stats' });
                return;
              }

              if (item.id === 'scan') {
                navigation.navigate('MainTabs', { screen: 'Scan' });
                return;
              }

              if (item.id === 'cod') {
                navigation.navigate('CodStats');
                return;
              }

              if (item.id === 'pickup') {
                navigation.navigate('PickupScan', {});
                return;
              }

              if (item.id === 'delivery') {
                navigation.navigate('DeliveryDispatch');
                return;
              }

              if (item.id === 'tracking') {
                navigation.navigate('TrackingLookup');
                return;
              }

              if (item.id === 'issue') {
                navigation.navigate('ScanIssue');
              }
            }}
          />

          <SettingsSection
            title="Cài đặt và tiện ích"
            items={settingsItems}
            onPressItem={(item) => {
              if (item.id === 'help-center') {
                navigation.navigate('MainTabs', { screen: 'Chat' });
                return;
              }

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
