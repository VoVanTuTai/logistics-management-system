import type { TextStyle, ViewStyle } from 'react-native';

import { colors, semanticColors } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

export const componentTokens = {
  screenContainer: {
    flex: 1,
    backgroundColor: semanticColors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  } satisfies ViewStyle,

  sectionTitle: {
    ...typography.subtitle.lg,
    color: semanticColors.textPrimary,
    marginBottom: spacing.sm,
  } satisfies TextStyle,

  statCard: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  } satisfies ViewStyle,

  actionGridItem: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 96,
    ...shadows.sm,
  } satisfies ViewStyle,

  bottomTab: {
    height: 74,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: semanticColors.surface,
    borderTopWidth: 1,
    borderTopColor: semanticColors.borderSubtle,
  } satisfies ViewStyle,

  headerBanner: {
    backgroundColor: semanticColors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
  } satisfies ViewStyle,

  badge: {
    base: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radius.pill,
    } satisfies ViewStyle,
    success: {
      backgroundColor: semanticColors.successSoft,
    } satisfies ViewStyle,
    warning: {
      backgroundColor: semanticColors.warningSoft,
    } satisfies ViewStyle,
    danger: {
      backgroundColor: semanticColors.dangerSoft,
    } satisfies ViewStyle,
    info: {
      backgroundColor: semanticColors.infoSoft,
    } satisfies ViewStyle,
  },
} as const;

export const theme = {
  colors: {
    primary: semanticColors.primary,
    primarySoft: semanticColors.primarySoft,
    primaryMuted: semanticColors.primaryMuted,
    secondary: semanticColors.secondary,

    background: semanticColors.background,
    surface: semanticColors.surface,
    border: semanticColors.border,

    textPrimary: semanticColors.textPrimary,
    textSecondary: semanticColors.textSecondary,
    textMuted: semanticColors.textMuted,
    textInverse: semanticColors.textInverse,

    success: semanticColors.success,
    successSoft: semanticColors.successSoft,
    warning: semanticColors.warning,
    warningSoft: semanticColors.warningSoft,
    danger: semanticColors.danger,
    dangerSoft: semanticColors.dangerSoft,
    info: semanticColors.info,
    infoSurface: semanticColors.infoSoft,
  },
  palette: colors,
  spacing,
  radius,
  typography,
  shadow: shadows,
  components: componentTokens,
} as const;

export type AppTheme = typeof theme;

export { colors, semanticColors, spacing, radius, typography, shadows };
