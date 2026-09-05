import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export interface ProfileHeaderData {
  fullName: string;
  branchName: string;
  employeeCode: string;
  phoneNumber: string;
}

interface ProfileHeaderProps {
  user: ProfileHeaderData;
  avatarUri?: string | null;
  onPressAvatar?: () => void;
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
  avatarUri,
  onPressAvatar,
}: ProfileHeaderProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onPressAvatar}
          style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={12} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.userInfoWrap}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang trực tuyến</Text>
          </View>

          <Text style={styles.fullName} numberOfLines={1} ellipsizeMode="tail">
            {user.fullName}
          </Text>
          <Text style={styles.branchName} numberOfLines={1} ellipsizeMode="tail">
            {user.branchName}
          </Text>
        </View>
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.metaChip}>
          <View style={styles.metaIconWrap}>
            <Ionicons name="id-card-outline" size={15} color="#2563EB" />
          </View>
          <View style={styles.metaTextWrap}>
            <Text style={styles.metaLabel} numberOfLines={1}>Mã nhân viên</Text>
            <Text style={styles.metaValue} numberOfLines={1} ellipsizeMode="tail">
              {user.employeeCode}
            </Text>
          </View>
        </View>

        <View style={styles.metaChip}>
          <View style={[styles.metaIconWrap, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Ionicons name="call-outline" size={15} color="#059669" />
          </View>
          <View style={styles.metaTextWrap}>
            <Text style={styles.metaLabel} numberOfLines={1}>Số điện thoại</Text>
            <Text style={styles.metaValue} numberOfLines={1} ellipsizeMode="tail">
              {user.phoneNumber}
            </Text>
          </View>
        </View>
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  userInfoWrap: {
    flex: 1,
    minWidth: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  fullName: {
    ...theme.typography.title.sm,
    color: theme.colors.textPrimary,
  },
  branchName: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
