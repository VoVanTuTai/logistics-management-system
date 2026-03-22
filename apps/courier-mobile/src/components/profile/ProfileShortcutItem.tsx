import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export type ProfileShortcutIconName = React.ComponentProps<typeof Ionicons>['name'];

export interface ProfileShortcutItemData {
  id: string;
  label: string;
  iconName: ProfileShortcutIconName;
  iconColor: string;
  iconBgColor: string;
}

interface ProfileShortcutItemProps {
  item: ProfileShortcutItemData;
  onPress?: (item: ProfileShortcutItemData) => void;
}

export function ProfileShortcutItem({
  item,
  onPress,
}: ProfileShortcutItemProps): React.JSX.Element {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          onPress(item);
        }
      }}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: item.iconBgColor }]}>
        <Ionicons name={item.iconName} size={20} color={item.iconColor} />
      </View>

      <Text numberOfLines={2} style={styles.label}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '30.5%',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE8F5',
  },
  label: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
