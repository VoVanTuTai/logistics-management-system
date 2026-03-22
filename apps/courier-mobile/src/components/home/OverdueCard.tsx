import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

interface OverdueCardProps {
  title?: string;
  overdueCount: number;
  subtitle: string;
  onPress?: () => void;
}

export function OverdueCard({
  title = 'Đơn sắp quá hạn',
  overdueCount,
  subtitle,
  onPress,
}: OverdueCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.leftBlock}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={20} color="#C25B12" />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.label}>{title}</Text>
          <Text numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Text style={styles.count}>{overdueCount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.warningSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#FFD5A8',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE7CD',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    ...theme.typography.subtitle.sm,
    color: '#A1460D',
  },
  subtitle: {
    ...theme.typography.caption.md,
    color: '#8A3D0D',
    marginTop: 2,
  },
  count: {
    ...theme.typography.title.sm,
    color: '#A1460D',
    minWidth: 28,
    textAlign: 'right',
  },
});
