import React, { useState } from 'react';
import {
  Alert,
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

import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { authApi } from '../../services/api/auth.api';
import { ApiClientError } from '../../services/api/client';
import { authStore } from '../../store/authStore';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const [phone, setPhone] = useState('0901234567');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại hoặc tên đăng nhập.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu.');
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
          roles: result.user.roles || ['MERCHANT'],
        },
      });

      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } catch (error) {
      const msg = error instanceof ApiClientError ? error.message : 'Tài khoản hoặc mật khẩu không chính xác.';
      Alert.alert('Đăng nhập thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
