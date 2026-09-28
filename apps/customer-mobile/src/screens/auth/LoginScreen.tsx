import React, { useEffect, useState } from 'react';
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
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { authApi } from '../../services/api/auth.api';
import { ApiClientError } from '../../services/api/client';
import { authStore } from '../../store/authStore';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const REMEMBER_ME_STORAGE_KEY = 'NEXUS_REMEMBER_ME_CREDS_V1';

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
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    visible: false,
    title: '',
    message: '',
  });

  // Load saved "Ghi nhớ đăng nhập" credentials on screen mount
  useEffect(() => {
    let isMounted = true;
    const loadSavedCredentials = async () => {
      try {
        const raw = await AsyncStorage.getItem(REMEMBER_ME_STORAGE_KEY);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.rememberMe) {
            setPhone(parsed.username || '');
            setPassword(parsed.password || '');
            setRememberMe(true);
          }
        }
      } catch {
        // Ignore storage read error
      }
    };
    loadSavedCredentials();
    return () => {
      isMounted = false;
    };
  }, []);

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

      // Handle Remember Me persistence
      if (rememberMe) {
        await AsyncStorage.setItem(
          REMEMBER_ME_STORAGE_KEY,
          JSON.stringify({
            username: phone.trim(),
            password: password.trim(),
            rememberMe: true,
          }),
        ).catch(() => {});
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_STORAGE_KEY).catch(() => {});
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

          {/* OPTIONS ROW: REMEMBER ME CHECKBOX + FORGOT PASSWORD */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              activeOpacity={0.8}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Ionicons
                name={rememberMe ? 'checkbox' : 'square-outline'}
                size={20}
                color={rememberMe ? colors.primary : colors.textMuted}
              />
              <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassBtn}>
              <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title="Đăng nhập"
            loadingTitle="Đang đăng nhập..."
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />

          {/* QUICK DEMO ACCOUNTS HELPER */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Tài khoản thử nghiệm có sẵn:</Text>
            <View style={styles.demoChipsRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => {
                  setPhone('0909000001');
                  setPassword('password');
                }}
              >
                <Text style={styles.demoChipName}>Khách Hà Nội</Text>
                <Text style={styles.demoChipPhone}>0909000001</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => {
                  setPhone('0909000002');
                  setPassword('password');
                }}
              >
                <Text style={styles.demoChipName}>Khách TP.HCM</Text>
                <Text style={styles.demoChipPhone}>0909000002</Text>
              </TouchableOpacity>
            </View>
          </View>

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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  forgotPassBtn: {},
  forgotPassText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  demoBox: {
    marginTop: spacing.lg,
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'center',
  },
  demoChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  demoChipName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  demoChipPhone: {
    fontSize: 10,
    color: '#3B82F6',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
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
