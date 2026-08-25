import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppErrorModal } from '../../components/common/AppErrorModal';
import { AppModal } from '../../components/common/AppModal';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { authApi } from '../../services/api/auth.api';
import { authStore, useAuthSession } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetail'>;

const REMEMBER_ME_STORAGE_KEY = 'NEXUS_REMEMBER_ME_CREDS_V1';

export function AccountDetailScreen({ navigation }: Props): React.JSX.Element {
  const session = useAuthSession();
  const user = session?.user;

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);

  // Modals
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const handleChangePassword = async () => {
    if (loading) return;

    if (!currentPassword.trim()) {
      setErrorModal({
        visible: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập mật khẩu hiện tại.',
      });
      return;
    }

    if (!newPassword.trim()) {
      setErrorModal({
        visible: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập mật khẩu mới.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setErrorModal({
        visible: true,
        title: 'Mật khẩu quá ngắn',
        message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorModal({
        visible: true,
        title: 'Mật khẩu không khớp',
        message: 'Xác nhận mật khẩu mới không trùng khớp với mật khẩu mới. Vui lòng kiểm tra lại.',
      });
      return;
    }

    const token = session?.accessToken;
    if (!token) {
      setErrorModal({
        visible: true,
        title: 'Phiên làm việc hết hạn',
        message: 'Vui lòng đăng nhập lại để tiếp tục.',
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(token, {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      // Remove stored old credentials from AsyncStorage so remember-me is cleared
      await AsyncStorage.removeItem(REMEMBER_ME_STORAGE_KEY).catch(() => {});

      // Show success modal
      setSuccessModalVisible(true);
    } catch (error: any) {
      const errMsg =
        error?.message ||
        (typeof error === 'string' ? error : 'Mật khẩu hiện tại không đúng hoặc hệ thống gặp sự cố.');

      setErrorModal({
        visible: true,
        title: 'Đổi mật khẩu thất bại',
        message: errMsg.includes('Current password')
          ? 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra và thử lại.'
          : errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessLogout = () => {
    setSuccessModalVisible(false);
    authStore.logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin tài khoản</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE OVERVIEW CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.displayName
                  ? user.displayName.charAt(0).toUpperCase()
                  : user?.username
                  ? user.username.charAt(0).toUpperCase()
                  : 'K'}
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.badgeText}>Đã xác thực</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          {/* DETAIL ROWS */}
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ và tên:</Text>
              <Text style={styles.infoValBold}>{user?.displayName || 'Chưa cập nhật'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên đăng nhập:</Text>
              <Text style={styles.infoVal}>{user?.username || '—'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoVal}>{user?.phone || user?.username || '—'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vai trò tài khoản:</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{user?.roles?.join(', ') || 'CUSTOMER'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <View style={styles.statusTag}>
                <View style={styles.statusDot} />
                <Text style={styles.statusTagText}>Đang hoạt động (ACTIVE)</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã định danh ID:</Text>
              <Text style={styles.infoValMuted} numberOfLines={1}>
                {user?.id || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* CHANGE PASSWORD CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="lock-closed" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Đổi mật khẩu tài khoản</Text>
          </View>

          <Text style={styles.cardSub}>
            Mật khẩu mới sẽ được cập nhật trực tiếp vào cơ sở dữ liệu hệ thống. Sau khi cập nhật, bạn cần đăng nhập lại với mật khẩu mới.
          </Text>

          <InputField
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            secureTextEntry={!showCurrentPass}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            iconName="key-outline"
            rightIconName={showCurrentPass ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowCurrentPass(!showCurrentPass)}
            required
          />

          <InputField
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
            secureTextEntry={!showNewPass}
            value={newPassword}
            onChangeText={setNewPassword}
            iconName="lock-closed-outline"
            rightIconName={showNewPass ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowNewPass(!showNewPass)}
            required
          />

          <InputField
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry={!showConfirmPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            iconName="shield-checkmark-outline"
            rightIconName={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowConfirmPass(!showConfirmPass)}
            required
          />

          <PrimaryButton
            title="Cập nhật mật khẩu mới"
            loadingTitle="Đang cập nhật vào Database..."
            onPress={handleChangePassword}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>

      {/* ERROR MODAL */}
      <AppErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* SUCCESS MODAL */}
      <AppModal
        visible={successModalVisible}
        variant="info"
        title="🎉 Đổi mật khẩu thành công!"
        message="Mật khẩu mới đã được cập nhật chính thức vào cơ sở dữ liệu hệ thống Nexus Express. Bạn sẽ được tự động đăng xuất để đăng nhập lại với mật khẩu mới."
        confirmText="Đăng nhập lại ngay"
        onConfirm={handleSuccessLogout}
        onCancel={handleSuccessLogout}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingTop: spacing.xl + 14,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.surface,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  infoList: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13.5,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValBold: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoValMuted: {
    fontSize: 11.5,
    color: colors.textMuted,
    maxWidth: 160,
  },
  roleTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#047857',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
