import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

interface NotificationBannerProps {
  title: string;
  message: string;
  badgeCount?: number;
  onPress?: () => void;
}

export function NotificationBanner({
  title,
  message,
  badgeCount,
  onPress,
}: NotificationBannerProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="megaphone-outline" size={18} color="#1D4ED8" />
      </View>

      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {typeof badgeCount === 'number' && badgeCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
            </View>
          ) : null}
        </View>
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
    backgroundColor: '#EFF6FF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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

