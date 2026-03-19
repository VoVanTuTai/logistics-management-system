import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export interface ProfileHeaderData {
  fullName: string;
  branchName: string;
  employeeCode: string;
  phoneNumber: string;
  starTierLabel: string;
}

interface ProfileHeaderProps {
  user: ProfileHeaderData;
  onPressStarDetail?: () => void;
}

function getInitials(fullName: string): string {
  const segments = fullName
    .split(' ')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return 'CU';
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase();
  }

  return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
}

export function ProfileHeader({
  user,
  onPressStarDetail,
}: ProfileHeaderProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
        </View>

        <View style={styles.userInfoWrap}>
          <Text style={styles.fullName}>{user.fullName}</Text>
          <Text style={styles.branchName}>{user.branchName}</Text>
        </View>
      </View>

      <View style={styles.metaList}>
        <View style={styles.metaRow}>
          <Ionicons name="card-outline" size={16} color="#4E6789" />
          <Text style={styles.metaText}>Mã nhân viên: {user.employeeCode}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="call-outline" size={16} color="#4E6789" />
          <Text style={styles.metaText}>Số điện thoại: {user.phoneNumber}</Text>
        </View>
      </View>

      <Pressable
        onPress={onPressStarDetail}
        style={({ pressed }) => [styles.starLink, pressed && styles.pressed]}
      >
        <View style={styles.starPill}>
          <Ionicons name="star-outline" size={14} color="#24539E" />
          <Text style={styles.starTierText}>{user.starTierLabel}</Text>
        </View>

        <Text style={styles.starLinkText}>Chi tiết hạng sao</Text>
        <Ionicons name="chevron-forward" size={16} color="#4E6789" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E6F0FF',
    borderWidth: 1,
    borderColor: '#CFE0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  userInfoWrap: {
    flex: 1,
  },
  fullName: {
    ...theme.typography.title.sm,
    color: theme.colors.textPrimary,
  },
  branchName: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  metaList: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...theme.typography.caption.md,
    color: '#4E6789',
  },
  starLink: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#D6E6FA',
    backgroundColor: '#F4F8FF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  starPill: {
    borderRadius: theme.radius.pill,
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#CFE0F7',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starTierText: {
    ...theme.typography.caption.sm,
    color: '#24539E',
    fontWeight: '700',
  },
  starLinkText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    marginLeft: 'auto',
  },
});
