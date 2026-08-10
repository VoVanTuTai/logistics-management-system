import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';

import { colors, spacing } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  icon,
}: PrimaryButtonProps): React.JSX.Element {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    if (isOutline) return 'transparent';
    if (isSecondary) return colors.primaryLight;
    if (isDanger) return colors.danger;
    return colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (isOutline) return colors.primary;
    if (isSecondary) return colors.primary;
    return colors.surface;
  };

  const height = size === 'sm' ? 38 : size === 'lg' ? 52 : 44;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height,
          borderColor: isOutline ? colors.primary : 'transparent',
          borderWidth: isOutline ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 13 : 15,
                marginLeft: icon ? spacing.sm : 0,
              },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    width: '100%',
  },
  text: {
    fontWeight: '700',
  },
});
