import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';

interface AppHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  subtitle?: string;
  transparent?: boolean;
}

export function AppHeader({
  title,
  onBackPress,
  rightAction,
  subtitle,
  transparent = false,
}: AppHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.header, transparent && styles.transparentHeader]}>
      <View style={styles.leftContainer}>
        {onBackPress ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBackPress}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.centerContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightContainer}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  backBtn: {
    padding: spacing.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
});
