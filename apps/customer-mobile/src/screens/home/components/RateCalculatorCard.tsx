import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing } from '../../../theme';

interface RateCalculatorCardProps {
  onPressCalculate: () => void;
}

export function RateCalculatorCard({ onPressCalculate }: RateCalculatorCardProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Tra cứu cước nhanh</Text>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeCol}>
            <Text style={styles.routeLabel}>Người gửi</Text>
            <Text style={styles.routeCity}>Hồ Chí Minh</Text>
          </View>

          <View style={styles.arrowBox}>
            <Ionicons name="arrow-forward-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.routeCol}>
            <Text style={styles.routeLabel}>Người nhận</Text>
            <Text style={styles.routeCity}>Hà Nội</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.calcBtn}
          onPress={onPressCalculate}
        >
          <Ionicons name="search" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.calcBtnText}>Tính cước & tạo đơn ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs + 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  routeCol: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  routeCity: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  arrowBox: {
    paddingHorizontal: spacing.sm,
  },
  calcBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md - 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  calcBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
