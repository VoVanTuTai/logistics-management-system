import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  required?: boolean;
}

export function InputField({
  label,
  error,
  iconName,
  rightIconName,
  onRightIconPress,
  required = false,
  style,
  ...rest
}: InputFieldProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View style={[styles.inputWrapper, Boolean(error) && styles.inputError]}>
        {iconName ? (
          <Ionicons
            name={iconName}
            size={20}
            color={colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          {...rest}
        />

        {rightIconName ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons name={rightIconName} size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  required: {
    color: colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});
