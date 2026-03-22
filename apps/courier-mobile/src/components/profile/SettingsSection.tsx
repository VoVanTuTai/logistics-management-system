import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';
import { SettingsItem, type SettingsItemData } from './SettingsItem';

interface SettingsSectionProps {
  title: string;
  items: SettingsItemData[];
  onPressItem?: (item: SettingsItemData) => void;
}

export function SettingsSection({
  title,
  items,
  onPressItem,
}: SettingsSectionProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.card}>
        {items.map((item, index) => (
          <SettingsItem
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            onPress={onPressItem}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card,
  },
});
