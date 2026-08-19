import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, shadows, spacing } from '../../theme';

export type ModalVariant = 'error' | 'success' | 'info' | 'confirm' | 'warning';

export interface AppModalProps {
  visible: boolean;
  variant?: ModalVariant;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function AppModal({
  visible,
  variant = 'error',
  title = 'Thông báo',
  message = '',
  confirmText,
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  iconName,
}: AppModalProps): React.JSX.Element | null {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  const isConfirm = variant === 'confirm';

  // Config style by variant
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.successLight,
          color: colors.success,
          defaultIcon: 'checkmark-circle-outline' as const,
          defaultBtn: confirmText || 'Đồng ý',
          btnBg: colors.success,
        };
      case 'warning':
        return {
          bg: colors.warningLight,
          color: colors.warning,
          defaultIcon: 'warning-outline' as const,
          defaultBtn: confirmText || 'Đồng ý',
          btnBg: colors.warning,
        };
      case 'info':
        return {
          bg: colors.infoLight,
          color: colors.primary,
          defaultIcon: 'information-circle-outline' as const,
          defaultBtn: confirmText || 'Đóng',
          btnBg: colors.primary,
        };
      case 'confirm':
        return {
          bg: colors.dangerLight,
          color: colors.danger,
          defaultIcon: 'log-out-outline' as const,
          defaultBtn: confirmText || 'Xác nhận',
          btnBg: colors.danger,
        };
      case 'error':
      default:
        return {
          bg: colors.dangerLight,
          color: colors.danger,
          defaultIcon: 'alert-circle-outline' as const,
          defaultBtn: confirmText || 'Thử lại',
          btnBg: colors.primary,
        };
    }
  };

  const config = getVariantConfig();
  const activeIcon = iconName || config.defaultIcon;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel || onConfirm}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel || onConfirm}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* ICON BADGE */}
              <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
                <Ionicons name={activeIcon} size={36} color={config.color} />
              </View>

              {/* TITLE & MESSAGE */}
              {title ? <Text style={styles.titleText}>{title}</Text> : null}
              {message ? <Text style={styles.messageText}>{message}</Text> : null}

              {/* ACTION BUTTONS */}
              {isConfirm ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.btnHalf, styles.cancelBtn]}
                    activeOpacity={0.8}
                    onPress={onCancel || onConfirm}
                  >
                    <Text style={styles.cancelBtnText}>{cancelText}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnHalf, { backgroundColor: config.btnBg }]}
                    activeOpacity={0.85}
                    onPress={onConfirm}
                  >
                    <Text style={styles.actionBtnText}>{config.defaultBtn}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtnFull, { backgroundColor: config.btnBg }]}
                  activeOpacity={0.85}
                  onPress={onConfirm}
                >
                  <Text style={styles.actionBtnText}>{config.defaultBtn}</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
  },
  messageText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  actionBtnFull: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  btnHalf: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
});
