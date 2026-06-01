import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LoginForm } from '../../features/auth/LoginForm';
import { useAuthStore } from '../../features/auth/auth.store';
import type { LoginFormValues } from '../../features/auth/auth.types';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';
import { ADMIN_LOGIN_HERO_IMAGE_URI } from '../../utils/branding';

export function LoginScreen(): React.JSX.Element {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.isLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      await login(values);
    } catch {
      // Error state is handled by auth store.
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      style={styles.container}
    >
      <ImageBackground
        source={{ uri: ADMIN_LOGIN_HERO_IMAGE_URI }}
        resizeMode="cover"
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageInner}
      >
        <View style={styles.scrim} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.brandKicker}>NEXUS Logistics</Text>
                <Text style={styles.brandName}>Courier Mobile</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Sẵn sàng cho ca giao nhận</Text>
            <Text style={styles.heroSubtitle}>
              Đăng nhập để nhận nhiệm vụ, quét mã và cập nhật trạng thái vận đơn.
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroPill}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#DBEAFE" />
                <Text style={styles.heroPillText}>Phiên an toàn</Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons name="scan-outline" size={14} color="#DBEAFE" />
                <Text style={styles.heroPillText}>Quét nhanh</Text>
              </View>
            </View>
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Đăng nhập shipper</Text>
            <Text style={styles.formDescription}>
              Nhập tài khoản được cấp để bắt đầu vận hành trong ngày.
            </Text>
            <LoginForm
              loading={loading}
              errorMessage={errorMessage}
              onSubmit={handleLogin}
            />
          </Card>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3D',
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageInner: {
    opacity: 0.82,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 23, 52, 0.58)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 56,
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  hero: {
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandKicker: {
    ...theme.typography.caption.md,
    color: '#BFDBFE',
    fontWeight: '700',
  },
  brandName: {
    ...theme.typography.subtitle.lg,
    color: '#FFFFFF',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    maxWidth: 310,
  },
  heroSubtitle: {
    ...theme.typography.body.md,
    color: '#DDE8FF',
    lineHeight: 21,
    maxWidth: 320,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.38)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  heroPillText: {
    ...theme.typography.caption.md,
    color: '#DBEAFE',
  },
  formCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(255,255,255,0.72)',
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  formDescription: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: 19,
  },
});
