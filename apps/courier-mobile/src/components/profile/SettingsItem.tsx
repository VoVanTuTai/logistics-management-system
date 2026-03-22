import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export type SettingsIconName = React.ComponentProps<typeof Ionicons>['name'];

export interface SettingsItemData {
  id: string;
  label: string;
  iconName: SettingsIconName;
}

interface SettingsItemProps {
  item: SettingsItemData;
  isLast?: boolean;
  onPress?: (item: SettingsItemData) => void;
}

export function SettingsItem({
  item,
  isLast = false,
  onPress,
}: SettingsItemProps): React.JSX.Element {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          onPress(item);
        }
      }}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.leftWrap}>
        <View style={styles.iconWrap}>
          <Ionicons name={item.iconName} size={17} color="#375C89" />
        </View>
        <Text style={styles.label}>{item.label}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#64748B" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF8',
  },
  pressed: {
    opacity: 0.88,
  },
  leftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#EDF4FF',
    borderWidth: 1,
    borderColor: '#D8E5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
  },
});
