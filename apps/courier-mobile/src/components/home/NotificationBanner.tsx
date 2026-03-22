import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

interface NotificationBannerProps {
  title: string;
  message: string;
  onPress?: () => void;
}

export function NotificationBanner({
  title,
  message,
  onPress,
}: NotificationBannerProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="megaphone-outline" size={18} color="#0A6E89" />
      </View>

      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.message}>
          {message}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#5B7393" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EAF5FF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#CDE3F8',
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D8EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.primary,
  },
  message: {
    ...theme.typography.caption.md,
    color: '#3E587A',
    marginTop: 2,
  },
});
