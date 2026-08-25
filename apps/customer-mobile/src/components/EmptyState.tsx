import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({
  title,
  subtitle,
  buttonTitle,
  onButtonPress,
  iconName = 'cube-outline',
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={48} color={colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {buttonTitle && onButtonPress ? (
        <View style={styles.btnWrapper}>
          <PrimaryButton
            title={buttonTitle}
            onPress={onButtonPress}
            size="md"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginVertical: spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  btnWrapper: {
    marginTop: spacing.xl,
    width: 180,
  },
});
