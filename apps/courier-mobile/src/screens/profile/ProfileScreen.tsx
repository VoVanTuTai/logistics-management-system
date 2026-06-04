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
import { useChangePasswordMutation } from '../../features/auth/auth.api';
import { canAccessCourierFeature } from '../../features/permissions/courier-permissions';
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
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordLoading, setPasswordLoading] = React.useState(false);

  const changePasswordMutation = useChangePasswordMutation(
    session?.tokens.accessToken ?? null,
  );

  const handleClosePasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(false);
  };

  const handleSavePassword = async () => {
    const curPass = currentPassword.trim();
    const newPass = newPassword.trim();
    const confPass = confirmPassword.trim();

    if (!curPass || !newPass || !confPass) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tất cả các trường.');
      return;
    }

    if (newPass !== confPass) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (newPass.length < 8 || !/[A-Za-z]/.test(newPass) || !/\d/.test(newPass)) {
      Alert.alert(
        'Mật khẩu chưa hợp lệ',
        'Mật khẩu mới phải dài ít nhất 8 ký tự và bao gồm cả chữ cái và chữ số.',
      );
      return;
    }

    setPasswordLoading(true);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: curPass,
        newPassword: newPass,
      });
      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi thành công.');
      handleClosePasswordModal();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi đổi mật khẩu.';
      Alert.alert('Lỗi đổi mật khẩu', msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const courierName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });

  const permittedCatalog = React.useMemo(() => {
    return QUICK_APP_CATALOG.filter(
      (item) => !item.permission || canAccessCourierFeature(session?.user, item.permission),
    );
  }, [session?.user]);

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
            appItems={permittedCatalog}
            selectedAppIds={quickAppIds}
            onToggleApp={toggleQuickApp}
            onReset={resetQuickApps}
          />

          <Pressable
            onPress={() => setPasswordModalVisible(true)}
            style={({ pressed }) => [
              styles.changePasswordButton,
              pressed && styles.changePasswordButtonPressed,
            ]}
          >
            <Text style={styles.changePasswordButtonText}>Đổi mật khẩu</Text>
          </Pressable>

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

        <Modal
          transparent
          visible={passwordModalVisible}
          animationType="fade"
          onRequestClose={() => {
            if (!passwordLoading) {
              handleClosePasswordModal();
            }
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.passwordModalCard}>
              <Text style={styles.passwordModalTitle}>Đổi mật khẩu</Text>
              <Text style={styles.passwordModalText}>
                Mật khẩu phải dài ít nhất 8 ký tự, bao gồm cả chữ cái và chữ số.
              </Text>

              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
                editable={!passwordLoading}
              />

              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
                editable={!passwordLoading}
              />

              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Xác nhận mật khẩu mới"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
                editable={!passwordLoading}
              />

              <View style={styles.avatarModalActions}>
                <Pressable
                  onPress={handleClosePasswordModal}
                  disabled={passwordLoading}
                  style={({ pressed }) => [
                    styles.avatarSecondaryButton,
                    pressed && styles.modalButtonPressed,
                    passwordLoading && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.avatarSecondaryButtonText}>Hủy</Text>
                </Pressable>

                <Pressable
                  onPress={handleSavePassword}
                  disabled={passwordLoading}
                  style={({ pressed }) => [
                    styles.avatarPrimaryButton,
                    pressed && styles.modalButtonPressed,
                    passwordLoading && styles.disabledButton,
                  ]}
                >
                  {passwordLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.avatarPrimaryButtonText}>Cập nhật</Text>
                  )}
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
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <View style={styles.quickAppCard}>
      <View style={[styles.quickAppHeader, !isExpanded && { marginBottom: 0 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.quickAppTitle}>Ứng dụng nhanh</Text>
          <Text style={styles.quickAppCount}>{selectedAppIds.length} mục đang hiển thị</Text>
        </View>

        <View style={styles.quickAppHeaderActions}>
          <Pressable onPress={onReset} style={styles.quickAppResetButton}>
            <Text style={styles.quickAppResetText}>Mặc định</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.quickAppToggleButton}
          >
            <Text style={styles.quickAppToggleText}>
              {isExpanded ? 'Thu gọn' : 'Tùy chỉnh'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {isExpanded ? (
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
      ) : null}
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
  changePasswordButton: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...theme.shadow.card,
  },
  changePasswordButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  changePasswordButtonText: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  passwordModalCard: {
    width: '100%',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
    gap: theme.spacing.sm,
  },
  passwordModalTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  passwordModalText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  inputLabel: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  passwordInput: {
    minHeight: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  quickAppHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  quickAppToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
  },
  quickAppToggleText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
});
