export const colors = {
  primary: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryDark: '#1E40AF',
  accent: '#3B82F6',
  background: '#F8FBFF',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FBFF',
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderFocus: '#1D4ED8',
  success: '#10B981',
  successLight: '#E6F4EA',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
