import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import type { MainTabParamList } from '../../navigation/navigation.types';
import { theme } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Chat'>;

interface ChatPreviewItem {
  id: string;
  title: string;
  message: string;
  unread: number;
  updatedAtText: string;
}

const mockConversations: ChatPreviewItem[] = [
  {
    id: 'dispatch-room',
    title: 'Dieu phoi ca',
    message: 'Cap nhat route truoc 14:00.',
    unread: 2,
    updatedAtText: '2p',
  },
  {
    id: 'hub-team',
    title: 'Hub HCM-01',
    message: 'Inbound line 3 dang dong, chuyen qua line 1.',
    unread: 0,
    updatedAtText: '15p',
  },
  {
    id: 'support',
    title: 'Hotline ho tro',
    message: 'Neu app loi scan, gui ma shipment + screenshot.',
    unread: 1,
    updatedAtText: '1h',
  },
];

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
          TODO: tich hop realtime socket/push sau. Hien tai dung mock de scaffold UI.
        </Text>
      </Card>

      {mockConversations.map((item) => (
        <Card key={item.id} onPress={() => {}} style={styles.chatCard}>
          <View style={styles.chatTopRow}>
            <Text style={styles.chatTitle}>{item.title}</Text>
            <Text style={styles.timeText}>{item.updatedAtText}</Text>
          </View>
          <Text numberOfLines={2} style={styles.chatMessage}>
            {item.message}
          </Text>

          {item.unread > 0 ? (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadText}>{item.unread} moi</Text>
            </View>
          ) : null}
        </Card>
      ))}
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
    fontWeight: '800',
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
    borderColor: '#C7DAFF',
  },
  noticeTitle: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  noticeText: {
    color: '#1F3B63',
  },
  chatCard: {
    gap: theme.spacing.sm,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  timeText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  chatMessage: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  unreadPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
  },
});
