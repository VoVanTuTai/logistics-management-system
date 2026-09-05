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
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
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
  const navigation = useNavigation<any>();
  const [avatarModalVisible, setAvatarModalVisible] = React.useState(false);
  const [avatarInputValue, setAvatarInputValue] = React.useState(courierAvatarUri ?? '');
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [assignedArea, setAssignedArea] = React.useState<{
    zoneName?: string | null;
    colorHex?: string | null;
    hubCode?: string;
    ward?: string;
    district?: string;
    province?: string;
  } | null>(null);

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

  React.useEffect(() => {
    if (!courierId || !session?.tokens.accessToken) return;
    courierApiClient
      .request<any[]>(
        courierEndpoints.masterdata.areaAssignments(courierId),
        { accessToken: session.tokens.accessToken },
      )
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAssignedArea(res[0]);
        }
      })
      .catch(() => undefined);
  }, [courierId, session?.tokens.accessToken]);

  const permittedCatalog = React.useMemo(() => {
    return QUICK_APP_CATALOG.filter(
      (item) => !item.permission || canAccessCourierFeature(session?.user, item.permission),
    );
  }, [session?.user]);

  const roles = session?.user.roles ?? [];
  const userData: ProfileHeaderData = {
    fullName: courierName,
    branchName: roles.length > 0 ? `Vai trò: ${roles.join(', ')}` : 'Nhân viên giao nhận Nexus',
    employeeCode: courierId,
    phoneNumber: session?.user.phone?.trim() || 'Chưa cập nhật',
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
          />

          {/* ASSIGNED ROUTE CARD */}
          <Pressable
            style={({ pressed }) => [
              styles.routeProfileCard,
              pressed && styles.routeProfileCardPressed,
            ]}
            onPress={() => navigation.navigate('MyRoute')}
          >
            <View style={styles.routeProfileHeader}>
              <View
                style={[
                  styles.routeProfileDot,
                  { backgroundColor: assignedArea?.colorHex || theme.colors.primary },
                ]}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.routeBadgeRow}>
                  <Text style={styles.routeProfileTitle} numberOfLines={1} ellipsizeMode="tail">
                    {assignedArea?.zoneName || 'Tuyến giao nhận của tôi'}
                  </Text>
                  {assignedArea?.hubCode ? (
                    <View style={styles.routeHubTag}>
                      <Text style={styles.routeHubTagText}>Hub {assignedArea.hubCode}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.routeProfileSub} numberOfLines={1} ellipsizeMode="tail">
                  {assignedArea
                    ? `${assignedArea.ward} • ${assignedArea.district}`
                    : 'Xem bản đồ ranh giới và thông tin phân bổ tuyến'}
                </Text>
              </View>
              <View style={styles.routeProfileArrowBtn}>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
              </View>
            </View>

            <View style={styles.routeProfileDivider} />

            <View style={styles.routeProfileFooter}>
              <View style={styles.routeProfileTag}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.routeProfileTagText} numberOfLines={1} ellipsizeMode="tail">
                  {assignedArea ? 'Tự động gán theo ranh giới' : 'Điều phối linh hoạt'}
                </Text>
              </View>
              <View style={styles.routeProfileViewAction}>
                <Ionicons name="map" size={13} color={theme.colors.primary} />
                <Text style={styles.routeProfileViewActionText}>Xem bản đồ tuyến</Text>
              </View>
            </View>
          </Pressable>

          {/* STATS & COD PERFORMANCE CARD */}
          <Pressable
            style={({ pressed }) => [
              styles.routeProfileCard,
              pressed && styles.routeProfileCardPressed,
            ]}
            onPress={() => navigation.navigate('Stats')}
          >
            <View style={styles.routeProfileHeader}>
              <View
                style={[
                  styles.routeProfileDot,
                  { backgroundColor: '#2563EB' },
                ]}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.routeBadgeRow}>
                  <Text style={styles.routeProfileTitle} numberOfLines={1} ellipsizeMode="tail">
                    Thống kê hiệu suất & COD
                  </Text>
                  <View style={[styles.routeHubTag, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <Text style={[styles.routeHubTagText, { color: '#2563EB' }]}>Báo cáo</Text>
                  </View>
                </View>
                <Text style={styles.routeProfileSub} numberOfLines={1} ellipsizeMode="tail">
                  Tỷ lệ giao hoàn tất, doanh thu COD và nhịp độ ca trực
                </Text>
              </View>
              <View style={styles.routeProfileArrowBtn}>
                <Ionicons name="chevron-forward" size={18} color="#2563EB" />
              </View>
            </View>

            <View style={styles.routeProfileDivider} />

            <View style={styles.routeProfileFooter}>
              <View style={[styles.routeProfileTag, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="stats-chart" size={13} color="#2563EB" />
                <Text style={[styles.routeProfileTagText, { color: '#1D4ED8' }]} numberOfLines={1} ellipsizeMode="tail">
                  Theo dõi chỉ số KPI
                </Text>
              </View>
              <View style={styles.routeProfileViewAction}>
                <Ionicons name="arrow-forward-circle" size={13} color="#2563EB" />
                <Text style={[styles.routeProfileViewActionText, { color: '#2563EB' }]}>Mở chi tiết</Text>
              </View>
            </View>
          </Pressable>

          <QuickAppCustomizeCard
            appItems={permittedCatalog}
            selectedAppIds={quickAppIds}
            onToggleApp={toggleQuickApp}
            onReset={resetQuickApps}
          />

          {/* ACCOUNT & SECURITY */}
          <View style={styles.accountCard}>
            <View style={styles.accountCardHeader}>
              <View style={styles.accountCardHeaderIcon}>
                <Ionicons name="shield-checkmark" size={15} color={theme.colors.primary} />
              </View>
              <Text style={styles.accountCardHeaderTitle}>Tài khoản & Bảo mật</Text>
            </View>

            <Pressable
              onPress={() => setPasswordModalVisible(true)}
              style={({ pressed }) => [
                styles.accountRow,
                pressed && styles.accountRowPressed,
              ]}
            >
              <View style={styles.accountRowIconWrap}>
                <Ionicons name="key-outline" size={16} color="#475569" />
              </View>
              <View style={styles.accountRowTextWrap}>
                <Text style={styles.accountRowTitle}>Đổi mật khẩu tài khoản</Text>
                <Text style={styles.accountRowSubtitle}>Cập nhật mật khẩu bảo mật định kỳ</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </Pressable>

            <View style={styles.accountRowDivider} />

            <View style={styles.accountRowStatic}>
              <View style={styles.accountRowIconWrap}>
                <Ionicons name="phone-portrait-outline" size={16} color="#475569" />
              </View>
              <View style={styles.accountRowTextWrap}>
                <Text style={styles.accountRowTitle}>Phiên bản ứng dụng</Text>
                <Text style={styles.accountRowSubtitle}>v1.0.0 (Nexus Courier Edition)</Text>
              </View>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>Ổn định</Text>
              </View>
            </View>

            <View style={styles.accountRowDivider} />

            <Pressable
              onPress={handleLogout}
              disabled={authLoading}
              style={({ pressed }) => [
                styles.accountRowLogout,
                pressed && styles.accountRowLogoutPressed,
                authLoading && styles.logoutButtonDisabled,
              ]}
            >
              {authLoading ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <>
                  <View style={[styles.accountRowIconWrap, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                    <Ionicons name="log-out-outline" size={16} color="#DC2626" />
                  </View>
                  <Text style={styles.logoutButtonText}>Đăng xuất tài khoản</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FCA5A5" style={{ marginLeft: 'auto' }} />
                </>
              )}
            </Pressable>
          </View>
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
        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <Text style={styles.quickAppTitle} numberOfLines={1}>Ứng dụng nhanh</Text>
          <Text style={styles.quickAppCount} numberOfLines={1}>
            {selectedAppIds.length} mục đang hiển thị
          </Text>
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
              size={13}
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
                    size={11}
                    color={isSelected ? '#FFFFFF' : theme.colors.textMuted}
                  />
                </View>

                <View style={[styles.quickAppIconWrap, { backgroundColor: item.iconBgColor }]}>
                  <Ionicons name={item.iconName} size={18} color={item.iconColor} />
                </View>

                <Text numberOfLines={2} ellipsizeMode="tail" style={styles.quickAppLabel}>
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
    paddingVertical: 4,
    backgroundColor: theme.colors.background,
  },
  quickAppResetText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  quickAppHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  quickAppToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.background,
  },
  quickAppToggleText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  quickAppGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAppTile: {
    width: '31.3%',
    minHeight: 90,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
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
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
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
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  accountCardHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCardHeaderTitle: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  accountRowPressed: {
    opacity: 0.8,
  },
  accountRowStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  accountRowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accountRowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  accountRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  accountRowSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  accountRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  accountRowLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  accountRowLogoutPressed: {
    opacity: 0.85,
  },
  logoutButtonDisabled: {
    opacity: 0.65,
  },
  logoutButtonText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '700',
  },
  versionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexShrink: 0,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
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
  routeProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    ...theme.shadow.card,
    gap: 10,
  },
  routeProfileCardPressed: {
    opacity: 0.92,
    backgroundColor: '#F8FAFC',
  },
  routeProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  routeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeProfileDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  routeProfileTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  routeHubTag: {
    backgroundColor: '#EEF4FF',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#D0E1FD',
    flexShrink: 0,
  },
  routeHubTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  routeProfileSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  routeProfileArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeProfileDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  routeProfileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routeProfileTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  routeProfileTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    flexShrink: 1,
  },
  routeProfileViewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  routeProfileViewActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
