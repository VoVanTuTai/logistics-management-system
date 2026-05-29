import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components/ui/Screen';
import {
  buildCourierChatWsUrl,
  createCourierChatWebSocketTicket,
  listCourierChatMessages,
  markCourierChatRead,
  sendCourierChatMessage,
} from '../../features/chat/chat.api';
import type {
  ChatConversationDto,
  ChatMessageDto,
  ChatRealtimeEvent,
} from '../../features/chat/chat.types';
import { useAuthStore } from '../../features/auth/auth.store';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierDisplayName, resolveCourierId } from '../../utils/courier';
import { appEnv } from '../../utils/env';

type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export function ChatScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const getValidAccessToken = useAuthStore((state) => state.getValidAccessToken);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const displayName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [conversation, setConversation] = React.useState<ChatConversationDto | null>(null);
  const [messages, setMessages] = React.useState<ChatMessageDto[]>([]);
  const [messagesNextCursor, setMessagesNextCursor] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] =
    React.useState<RealtimeStatus>('connecting');

  const loadMessages = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = await getValidAccessToken();
      const items = await listCourierChatMessages({
        accessToken: token,
        courierId,
      });
      setMessages(items.items);
      setMessagesNextCursor(items.nextCursor);
      const readConversation = await markCourierChatRead({
        accessToken: token,
        courierId,
      });
      setConversation(readConversation);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Không tải được hội thoại.'));
    } finally {
      setIsLoading(false);
    }
  }, [courierId, getValidAccessToken]);

  React.useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  React.useEffect(() => {
    let isClosed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;
    let attempt = 0;

    const connect = () => {
      void connectSocket();
    };

    const connectSocket = async () => {
      if (isClosed) {
        return;
      }

      setRealtimeStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      try {
        const token = await getValidAccessToken();
        const ticket = await createCourierChatWebSocketTicket({
          accessToken: token,
          courierId,
        });
        if (isClosed) {
          return;
        }
        socket = new WebSocket(
          buildCourierChatWsUrl({
            accessToken: token,
            courierId,
            ticket: ticket.ticket,
          }),
        );
      } catch {
        if (!isClosed) {
          attempt += 1;
          setRealtimeStatus('reconnecting');
          reconnectTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt));
        }
        return;
      }

      socket.onopen = () => {
        attempt = 0;
        setRealtimeStatus('connected');
      };

      socket.onmessage = (event) => {
        const payload = safeParseRealtimeEvent(String(event.data));
        if (payload?.type !== 'chat.message') {
          if (
            (payload?.type === 'chat.read' || payload?.type === 'chat.claim') &&
            payload.conversation.courierId === courierId
          ) {
            setConversation(payload.conversation);
            void getValidAccessToken()
              .then((token) => listCourierChatMessages({ accessToken: token, courierId }))
              .then((page) => {
                setMessages(page.items);
                setMessagesNextCursor(page.nextCursor);
              })
              .catch(() => undefined);
          }
          return;
        }

        if (payload.message.courierId === courierId) {
          setConversation(payload.conversation);
          setMessages((current) => appendMessageIfMissing(current, payload.message));
          void getValidAccessToken()
            .then((token) => markCourierChatRead({ accessToken: token, courierId }))
            .catch(() => undefined);
        }
      };

      socket.onerror = () => {
        if (!isClosed) {
          setRealtimeStatus('offline');
        }
      };

      socket.onclose = () => {
        if (isClosed) {
          return;
        }
        attempt += 1;
        setRealtimeStatus('reconnecting');
        reconnectTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt));
      };
    };

    connect();

    return () => {
      isClosed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [courierId, getValidAccessToken]);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    try {
      const token = await getValidAccessToken();
      const message = await sendCourierChatMessage({
        accessToken: token,
        courierId,
        text,
      });
      setDraft('');
      setMessages((current) => appendMessageIfMissing(current, message));
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Gửi tin nhắn thất bại.'));
    } finally {
      setIsSending(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!messagesNextCursor || isLoadingOlder) {
      return;
    }

    setIsLoadingOlder(true);
    setErrorMessage(null);
    try {
      const token = await getValidAccessToken();
      const page = await listCourierChatMessages({
        accessToken: token,
        courierId,
        before: messagesNextCursor,
      });
      setMessages((current) => prependMessagesIfMissing(current, page.items));
      setMessagesNextCursor(page.nextCursor);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Không tải được tin nhắn cũ.'));
    } finally {
      setIsLoadingOlder(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="headset-outline" size={22} color={theme.colors.textInverse} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Chat vận hành</Text>
            <Text style={styles.subtitle}>
              {displayName} · {courierId}
            </Text>
            <Text style={styles.assignmentText}>
              {conversation?.assignedOpsName
                ? `Đang xử lý bởi ${conversation.assignedOpsName}`
                : 'Ops cùng hub sẽ tiếp nhận'}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              realtimeStatus === 'connected' && styles.statusPillConnected,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                realtimeStatus === 'connected' && styles.statusTextConnected,
              ]}
            >
              {formatRealtimeStatus(realtimeStatus)}
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.centerStateText}>Đang tải hội thoại...</Text>
            </View>
          ) : null}

          {!isLoading && errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadMessages()}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !errorMessage && messagesNextCursor ? (
            <Pressable
              style={styles.loadOlderButton}
              disabled={isLoadingOlder}
              onPress={() => void loadOlderMessages()}
            >
              <Text style={styles.loadOlderText}>
                {isLoadingOlder ? 'Đang tải...' : 'Tải tin cũ hơn'}
              </Text>
            </Pressable>
          ) : null}

          {!isLoading && !errorMessage && messages.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="chatbubble-ellipses-outline" size={34} color={theme.colors.textMuted} />
              <Text style={styles.centerStateTitle}>Chưa có tin nhắn</Text>
              <Text style={styles.centerStateText}>
                Gửi tin đầu tiên để liên hệ điều phối.
              </Text>
            </View>
          ) : null}

          {messages.map((message) => {
            const isMine = message.senderRole === 'COURIER';
            return (
              <View
                key={message.id}
                style={[styles.bubble, isMine && styles.bubbleMine]}
              >
                <View style={styles.bubbleMeta}>
                  <Text style={[styles.bubbleSender, isMine && styles.bubbleTextMine]}>
                    {message.senderName}
                  </Text>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTextMine]}>
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                  {message.text}
                </Text>
                {message.senderRole === 'COURIER' && message.readByOpsAt ? (
                  <Text style={styles.readReceipt}>
                    Điều phối đã đọc {formatTime(message.readByOpsAt)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
          />
          <Pressable
            style={[
              styles.sendButton,
              (!draft.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            disabled={!draft.trim() || isSending}
            onPress={() => void sendMessage()}
          >
            {isSending ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Ionicons name="send" size={20} color={theme.colors.textInverse} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function safeParseRealtimeEvent(input: string): ChatRealtimeEvent | null {
  try {
    return JSON.parse(input) as ChatRealtimeEvent;
  } catch {
    return null;
  }
}

function appendMessageIfMissing(
  current: ChatMessageDto[],
  message: ChatMessageDto,
): ChatMessageDto[] {
  if (current.some((item) => item.id === message.id)) {
    return current;
  }

  return [...current, message];
}

function prependMessagesIfMissing(
  current: ChatMessageDto[],
  olderMessages: ChatMessageDto[],
): ChatMessageDto[] {
  const currentIds = new Set(current.map((item) => item.id));
  return [
    ...olderMessages.filter((item) => !currentIds.has(item.id)),
    ...current,
  ];
}

function formatRealtimeStatus(status: RealtimeStatus): string {
  if (status === 'connected') {
    return 'Realtime';
  }
  if (status === 'connecting') {
    return 'Đang nối';
  }
  if (status === 'reconnecting') {
    return 'Nối lại';
  }
  return 'Offline';
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    minHeight: 82,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  assignmentText: {
    ...theme.typography.caption.sm,
    color: theme.colors.primary,
    fontWeight: '800',
    marginTop: 4,
  },
  statusPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    backgroundColor: theme.colors.warningSoft,
  },
  statusPillConnected: {
    backgroundColor: theme.colors.successSoft,
  },
  statusText: {
    ...theme.typography.caption.sm,
    color: theme.colors.warning,
    fontWeight: '800',
  },
  statusTextConnected: {
    color: theme.colors.success,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  centerState: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  centerStateTitle: {
    ...theme.typography.subtitle.md,
    color: theme.colors.textPrimary,
  },
  centerStateText: {
    ...theme.typography.body.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  loadOlderButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  loadOlderText: {
    ...theme.typography.caption.md,
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  errorCard: {
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    ...theme.typography.body.md,
    color: theme.colors.danger,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  retryButtonText: {
    ...theme.typography.caption.md,
    color: theme.colors.textInverse,
    fontWeight: '800',
  },
  bubble: {
    maxWidth: '82%',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  bubbleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  bubbleSender: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
    fontWeight: '800',
  },
  bubbleTime: {
    ...theme.typography.caption.sm,
    color: theme.colors.textMuted,
  },
  bubbleText: {
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: theme.colors.textInverse,
  },
  readReceipt: {
    ...theme.typography.caption.sm,
    color: theme.colors.textInverse,
    opacity: 0.74,
    marginTop: 6,
    textAlign: 'right',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 112,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...theme.shadow.sm,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
});
