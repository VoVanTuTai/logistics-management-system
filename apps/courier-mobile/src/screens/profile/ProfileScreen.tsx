import React from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { theme } from '../../theme';
import {
  ProfileHeader,
  type ProfileHeaderData,
} from '../../components/profile/ProfileHeader';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../features/auth/auth.store';
import { appEnv } from '../../utils/env';
import { resolveCourierId, resolveCourierDisplayName } from '../../utils/courier';
import {
  QUICK_APP_CATALOG,
  type QuickAppItem,
} from '../../features/quick-apps/quickApps';

export function ProfileScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const quickAppIds = useAppStore((state) => state.quickAppIds);
  const toggleQuickApp = useAppStore((state) => state.toggleQuickApp);
  const resetQuickApps = useAppStore((state) => state.resetQuickApps);
  const courierAvatarUri = useAppStore((state) => state.courierAvatarUri);
  const setCourierAvatarUri = useAppStore((state) => state.setCourierAvatarUri);
  const logout = useAuthStore((state) => state.logout);
  const authLoading = useAuthStore((state) => state.isLoading);
  const [avatarModalVisible, setAvatarModalVisible] = React.useState(false);
  const [avatarInputValue, setAvatarInputValue] = React.useState(courierAvatarUri ?? '');

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
    phoneNumber: session?.user.phone?.trim() || 'Chưa cập nhật',
    starTierLabel: 'Đang cập nhật',
  };

  const handleLogout = () => {
    void logout();
  };

  const openAvatarModal = () => {
    setAvatarInputValue(courierAvatarUri ?? '');
    setAvatarModalVisible(true);
  };

  const saveAvatarUri = () => {
    const normalizedValue = avatarInputValue.trim();

    if (
      normalizedValue.length > 0 &&
      !normalizedValue.startsWith('http://') &&
      !normalizedValue.startsWith('https://')
    ) {
      Alert.alert('URL ảnh chưa hợp lệ', 'Vui lòng nhập URL bắt đầu bằng http:// hoặc https://.');
      return;
    }

    setCourierAvatarUri(normalizedValue || null);
    setAvatarModalVisible(false);
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
            avatarUri={courierAvatarUri}
            onPressAvatar={openAvatarModal}
            onPressStarDetail={() => {
              Alert.alert('Hạng sao', 'Chi tiết hạng sao sẽ cập nhật theo API.');
            }}
          />

          <QuickAppCustomizeCard
            appItems={QUICK_APP_CATALOG}
            selectedAppIds={quickAppIds}
            onToggleApp={toggleQuickApp}
            onReset={resetQuickApps}
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

        <Modal
          transparent
          visible={avatarModalVisible}
          animationType="fade"
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.avatarModalCard}>
              <Text style={styles.avatarModalTitle}>Đổi ảnh đại diện</Text>
              <Text style={styles.avatarModalText}>
                Nhập URL ảnh đại diện để lưu trên thiết bị này.
              </Text>

              <TextInput
                value={avatarInputValue}
                onChangeText={setAvatarInputValue}
                placeholder="https://..."
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.avatarInput}
              />

              <View style={styles.avatarModalActions}>
                <Pressable
                  onPress={() => setAvatarModalVisible(false)}
                  style={({ pressed }) => [
                    styles.avatarSecondaryButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                >
                  <Text style={styles.avatarSecondaryButtonText}>Hủy</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setAvatarInputValue('');
                    setCourierAvatarUri(null);
                    setAvatarModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.avatarSecondaryButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                >
                  <Text style={styles.avatarSecondaryButtonText}>Xóa</Text>
                </Pressable>

                <Pressable
                  onPress={saveAvatarUri}
                  style={({ pressed }) => [
                    styles.avatarPrimaryButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                >
                  <Text style={styles.avatarPrimaryButtonText}>Lưu</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

interface QuickAppCustomizeCardProps {
  appItems: QuickAppItem[];
  selectedAppIds: string[];
  onToggleApp: (appId: string) => void;
  onReset: () => void;
}

function QuickAppCustomizeCard({
  appItems,
  selectedAppIds,
  onToggleApp,
  onReset,
}: QuickAppCustomizeCardProps): React.JSX.Element {
  return (
    <View style={styles.quickAppCard}>
      <View style={styles.quickAppHeader}>
        <View>
          <Text style={styles.quickAppTitle}>Ứng dụng nhanh</Text>
          <Text style={styles.quickAppCount}>{selectedAppIds.length} mục đang hiển thị</Text>
        </View>

        <Pressable onPress={onReset} style={styles.quickAppResetButton}>
          <Text style={styles.quickAppResetText}>Mặc định</Text>
        </Pressable>
      </View>

      <View style={styles.quickAppGrid}>
        {appItems.map((item) => {
          const isSelected = selectedAppIds.includes(item.id);
          const isOnlySelected = isSelected && selectedAppIds.length <= 1;

          return (
            <Pressable
              key={item.id}
              disabled={isOnlySelected}
              onPress={() => onToggleApp(item.id)}
              style={({ pressed }) => [
                styles.quickAppTile,
                isSelected && styles.quickAppTileSelected,
                pressed && styles.quickAppTilePressed,
                isOnlySelected && styles.quickAppTileDisabled,
              ]}
            >
              <View
                style={[
                  styles.quickAppTileMark,
                  isSelected && styles.quickAppTileMarkSelected,
                ]}
              >
                <Ionicons
                  name={isSelected ? 'checkmark' : 'add'}
                  size={12}
                  color={isSelected ? '#FFFFFF' : theme.colors.textMuted}
                />
              </View>

              <View style={[styles.quickAppIconWrap, { backgroundColor: item.iconBgColor }]}>
                <Ionicons name={item.iconName} size={18} color={item.iconColor} />
              </View>

              <Text numberOfLines={2} style={styles.quickAppLabel}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  quickAppCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  quickAppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  quickAppTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  quickAppCount: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  quickAppResetButton: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
  },
  quickAppResetText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  quickAppGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.sm,
  },
  quickAppTile: {
    width: '31.5%',
    minHeight: 94,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    position: 'relative',
  },
  quickAppTileSelected: {
    borderColor: theme.colors.primaryMuted,
    backgroundColor: '#F7FBFF',
  },
  quickAppTilePressed: {
    opacity: 0.88,
  },
  quickAppTileDisabled: {
    opacity: 0.72,
  },
  quickAppTileMark: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAppTileMarkSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  quickAppIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE8F5',
  },
  quickAppLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  avatarModalCard: {
    width: '100%',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  avatarModalTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  avatarModalText: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  avatarInput: {
    minHeight: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  avatarModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  avatarSecondaryButton: {
    minHeight: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarSecondaryButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  avatarPrimaryButton: {
    minHeight: 40,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  avatarPrimaryButtonText: {
    ...theme.typography.caption.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalButtonPressed: {
    opacity: 0.86,
  },
});
