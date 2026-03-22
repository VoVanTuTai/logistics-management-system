import type { ViewStyle } from 'react-native';

type ShadowToken = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOpacity' | 'shadowOffset' | 'shadowRadius' | 'elevation'
>;

export const shadows = {
  none: {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  } satisfies ShadowToken,
  sm: {
    shadowColor: '#08213F',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  } satisfies ShadowToken,
  md: {
    shadowColor: '#08213F',
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  } satisfies ShadowToken,
  lg: {
    shadowColor: '#08213F',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  } satisfies ShadowToken,
  card: {
    shadowColor: '#08213F',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  } satisfies ShadowToken,
} as const;
