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

import { AppHeader } from '../../components/AppHeader';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { authApi } from '../../services/api/auth.api';
import { ApiClientError } from '../../services/api/client';
import { authStore } from '../../store/authStore';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      // 1. Register new user
      await authApi.register({
        username: phone.trim(),
        password: password.trim(),
        displayName: fullName.trim(),
        phone: phone.trim(),
      });

      // 2. Auto login
      const loginRes = await authApi.login({
        username: phone.trim(),
        password: password.trim(),
      });

      const token = loginRes.tokens?.accessToken || loginRes.accessToken;
      if (!token) {
        throw new Error('Không nhận được token xác thực từ máy chủ.');
      }

      authStore.setSession({
        accessToken: token,
        user: {
          id: loginRes.user.id,
          username: loginRes.user.username,
          displayName: loginRes.user.displayName || fullName.trim(),
          phone: loginRes.user.phone || phone.trim(),
          roles: loginRes.user.roles || ['MERCHANT'],
        },
      });

      Alert.alert('Thành công', 'Tạo tài khoản thành công!', [
        { text: 'Bắt đầu', onPress: () => navigation.replace('MainTabs', { screen: 'HomeTab' }) },
      ]);
    } catch (error) {
      const msg = error instanceof ApiClientError ? error.message : 'Đăng ký tài khoản thất bại.';
      Alert.alert('Lỗi đăng ký', msg);
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
      <AppHeader title="Đăng ký tài khoản" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tạo tài khoản mới</Text>
          <Text style={styles.cardSub}>Trở thành thành viên NEXUS Express ngay hôm nay</Text>

          <InputField
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChangeText={setFullName}
            iconName="person-outline"
            required
          />

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
            label="Email (Không bắt buộc)"
            placeholder="example@email.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            iconName="mail-outline"
          />

          <InputField
            label="Mật khẩu"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            iconName="lock-closed-outline"
            required
          />

          <InputField
            label="Xác nhận mật khẩu"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            iconName="checkmark-circle-outline"
            required
          />

          <PrimaryButton
            title="Đăng ký tài khoản"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
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
    padding: spacing.lg,
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
  submitBtn: {
    marginTop: spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
