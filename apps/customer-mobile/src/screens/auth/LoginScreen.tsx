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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppErrorModal } from '../../components/common/AppErrorModal';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { authApi } from '../../services/api/auth.api';
import { ApiClientError } from '../../services/api/client';
import { authStore } from '../../store/authStore';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface ErrorModalState {
  visible: boolean;
  title: string;
  message: string;
}

function getErrorContent(error: unknown): { title: string; message: string } {
  if (error instanceof ApiClientError) {
    if (error.isNetworkError) {
      const lowerMsg = (error.message || '').toLowerCase();
      if (lowerMsg.includes('aborted') || lowerMsg.includes('timeout')) {
        return {
          title: 'Kết nối quá lâu',
          message: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.',
        };
      }
      return {
        title: 'Không thể kết nối',
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
      };
    }

    if (error.status === 401) {
      return {
        title: 'Đăng nhập thất bại',
        message: 'Số điện thoại hoặc mật khẩu không đúng. Vui lòng kiểm tra và thử lại.',
      };
    }

    if (error.status === 500) {
      return {
        title: 'Có lỗi xảy ra',
        message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
      };
    }
  }

  return {
    title: 'Đăng nhập thất bại',
    message: 'Số điện thoại hoặc mật khẩu không đúng. Vui lòng kiểm tra và thử lại.',
  };
}

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    visible: false,
    title: '',
    message: '',
  });

  const handleLogin = async () => {
    if (loading) return;

    if (!phone.trim()) {
      setErrorModal({
        visible: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập số điện thoại hoặc tên đăng nhập.',
      });
      return;
    }
    if (!password.trim()) {
      setErrorModal({
        visible: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập mật khẩu.',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login({
        username: phone.trim(),
        password: password.trim(),
      });

      const token = result.tokens?.accessToken || result.accessToken;
      if (!token) {
        throw new Error('Không nhận được token xác thực từ máy chủ.');
      }

      authStore.setSession({
        accessToken: token,
        user: {
          id: result.user.id,
          username: result.user.username,
          displayName: result.user.displayName || result.user.username,
          phone: result.user.phone || result.user.username,
          roles: result.user.roles || ['CUSTOMER'],
        },
      });

      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } catch (error) {
      const errContent = getErrorContent(error);
      setErrorModal({
        visible: true,
        title: errContent.title,
        message: errContent.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerArea}>
          <View style={styles.logoBadge}>
            <Ionicons name="cube" size={38} color={colors.surface} />
          </View>
          <Text style={styles.brandTitle}>NEXUS Express</Text>
          <Text style={styles.brandSub}>Ứng dụng Giao nhận Khách hàng Cá nhân</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>
          <Text style={styles.cardSub}>Nhập số điện thoại để tiếp tục</Text>

          <InputField
            label="Số điện thoại / Tên đăng nhập"
            placeholder="09xxxxxxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            iconName="call-outline"
            required
          />

          <InputField
            label="Mật khẩu"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            iconName="lock-closed-outline"
            rightIconName={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            required
          />

          <TouchableOpacity style={styles.forgotPassBtn}>
            <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Đăng nhập"
            loadingTitle="Đang đăng nhập..."
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AppErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPassText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
