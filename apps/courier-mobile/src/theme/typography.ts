import type { TextStyle } from 'react-native';

type TextToken = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'fontFamily'
>;

const FONT_FAMILY = 'System';
const FONT_WEIGHT_REGULAR = '500';
const FONT_WEIGHT_MEDIUM = '600';
const FONT_WEIGHT_BOLD = '700';

export const typography = {
  title: {
    lg: {
      fontFamily: FONT_FAMILY,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: FONT_WEIGHT_BOLD,
      letterSpacing: 0.1,
    } satisfies TextToken,
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: FONT_WEIGHT_BOLD,
      letterSpacing: 0.1,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: FONT_WEIGHT_BOLD,
      letterSpacing: 0.1,
    } satisfies TextToken,
  },
  subtitle: {
    lg: {
      fontFamily: FONT_FAMILY,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: FONT_WEIGHT_BOLD,
      letterSpacing: 0.1,
    } satisfies TextToken,
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: FONT_WEIGHT_MEDIUM,
      letterSpacing: 0.1,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: FONT_WEIGHT_MEDIUM,
      letterSpacing: 0.1,
    } satisfies TextToken,
  },
  body: {
    lg: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: FONT_WEIGHT_REGULAR,
      letterSpacing: 0,
    } satisfies TextToken,
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: FONT_WEIGHT_REGULAR,
      letterSpacing: 0,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: FONT_WEIGHT_REGULAR,
      letterSpacing: 0,
    } satisfies TextToken,
  },
  caption: {
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: FONT_WEIGHT_MEDIUM,
      letterSpacing: 0.1,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: FONT_WEIGHT_MEDIUM,
      letterSpacing: 0.1,
    } satisfies TextToken,
  },
  tabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: FONT_WEIGHT_MEDIUM,
    letterSpacing: 0.2,
  } satisfies TextToken,
} as const;
