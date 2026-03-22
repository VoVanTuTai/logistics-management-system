import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  iconName: IconName;
  title: string;
  description: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPressPrimary?: () => void;
  onPressSecondary?: () => void;
}

export function EmptyState({
  iconName,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPressPrimary,
  onPressSecondary,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={34} color={theme.colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {(primaryLabel || secondaryLabel) ? (
        <View style={styles.actionsRow}>
          {secondaryLabel ? (
            <Pressable
              onPress={onPressSecondary}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
            </Pressable>
          ) : null}

          {primaryLabel ? (
            <Pressable
              onPress={onPressPrimary}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3FF',
    borderWidth: 1,
    borderColor: '#D6E6FA',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.title.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    maxWidth: 320,
  },
  actionsRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primaryButton: {
    minWidth: 126,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  primaryButtonText: {
    ...theme.typography.caption.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    minWidth: 110,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  secondaryButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
