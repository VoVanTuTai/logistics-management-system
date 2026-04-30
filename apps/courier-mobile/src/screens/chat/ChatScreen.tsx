import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import type { MainTabParamList } from '../../navigation/navigation.types';
import { theme } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Chat'>;

export function ChatScreen(_: Props): React.JSX.Element {
  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Chat van hanh</Text>
          <Text style={styles.subtitle}>Lien lac nhanh voi dieu phoi/hub/ho tro</Text>
        </View>
        <Pressable style={styles.composeBtn}>
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <Card style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Trang thai tin nhan</Text>
        <Text style={styles.noticeText}>
          Chua co kenh chat tu server.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  composeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeCard: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: '#C7D2FE',
  },
  noticeTitle: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  noticeText: {
    color: '#1F3B63',
  },
});

