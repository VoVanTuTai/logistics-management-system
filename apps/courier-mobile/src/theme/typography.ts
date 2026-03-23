import type { TextStyle } from 'react-native';

type TextToken = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'fontFamily'
>;

const FONT_FAMILY = 'System';

export const typography = {
  title: {
    lg: {
      fontFamily: FONT_FAMILY,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
      letterSpacing: 0.1,
    } satisfies TextToken,
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '800',
      letterSpacing: 0.1,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      letterSpacing: 0.1,
    } satisfies TextToken,
  },
  subtitle: {
    lg: {
      fontFamily: FONT_FAMILY,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700',
      letterSpacing: 0.1,
    } satisfies TextToken,
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
      letterSpacing: 0.1,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      letterSpacing: 0.1,
    } satisfies TextToken,
  },
  body: {
    lg: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0,
    } satisfies TextToken,
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '400',
      letterSpacing: 0,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '400',
      letterSpacing: 0,
    } satisfies TextToken,
  },
  caption: {
    md: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.1,
    } satisfies TextToken,
    sm: {
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500',
      letterSpacing: 0.1,
    } satisfies TextToken,
  },
  tabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  } satisfies TextToken,
} as const;
