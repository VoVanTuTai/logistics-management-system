import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface HomeHeaderProps {
  greeting: string;
  userName: string;
  hubName: string;
  onPressQr?: () => void;
  onPressNotification?: () => void;
}

function HeaderIconButton({
  icon,
  onPress,
}: {
  icon: IconName;
  onPress?: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
      hitSlop={8}
    >
      <Ionicons name={icon} size={20} color="#FFFFFF" />
    </Pressable>
  );
}

export function HomeHeader({
  greeting,
  userName,
  hubName,
  onPressQr,
  onPressNotification,
}: HomeHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.welcomeBlock}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text numberOfLines={1} style={styles.userName}>
              {userName}
            </Text>
            <Text numberOfLines={1} style={styles.hubName}>
              {hubName}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <HeaderIconButton icon="qr-code-outline" onPress={onPressQr} />
            <HeaderIconButton
              icon="notifications-outline"
              onPress={onPressNotification}
            />
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.statusPill}>
            <Ionicons name="navigate-outline" size={14} color="#B3D7FF" />
            <Text style={styles.statusText}>Sẵn sàng giao nhận</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: theme.colors.primary,
    overflow: 'hidden',
    minHeight: 180,
    ...theme.shadow.md,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  welcomeBlock: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  greeting: {
    ...theme.typography.body.md,
    color: '#DBEAFE',
  },
  userName: {
    ...theme.typography.title.sm,
    color: theme.colors.textInverse,
    marginTop: 2,
  },
  hubName: {
    ...theme.typography.caption.md,
    color: '#BFDBFE',
    marginTop: theme.spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  iconBtnPressed: {
    opacity: 0.85,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: theme.spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(12, 34, 64, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.45)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  statusText: {
    ...theme.typography.caption.md,
    color: '#DBEAFE',
  },
});

