import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';
import {
  ProfileShortcutItem,
  type ProfileShortcutItemData,
} from './ProfileShortcutItem';

interface ProfileShortcutGridProps {
  items: ProfileShortcutItemData[];
  onPressItem?: (item: ProfileShortcutItemData) => void;
}

export function ProfileShortcutGrid({
  items,
  onPressItem,
}: ProfileShortcutGridProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tiện ích nhanh</Text>

      <View style={styles.gridWrap}>
        {items.map((item) => (
          <ProfileShortcutItem
            key={item.id}
            item={item}
            onPress={onPressItem}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    ...theme.shadow.card,
  },
  title: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
