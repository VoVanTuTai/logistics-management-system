import { useEffect, useMemo, useRef, useState } from 'react';

import {
  buildOpsChatWsUrl,
  createOpsChatWebSocketTicket,
  listChatConversations,
  listChatMessages,
  markOpsChatRead,
  sendOpsChatMessage,
} from '../../features/chat/chat.client';
import type {
  ChatConversationDto,
  ChatMessageDto,
  ChatRealtimeEvent,
} from '../../features/chat/chat.types';
import { useAuthStore } from '../../store/authStore';
import './OpsCourierChatPage.css';

type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export function OpsCourierChatPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [manualCourierId, setManualCourierId] = useState('30000001');
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [messagesNextCursor, setMessagesNextCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.courierId === selectedCourierId) ?? null,
    [conversations, selectedCourierId],
  );

  useEffect(() => {
    let isMounted = true;

    void listChatConversations(accessToken)
      .then((items) => {
        if (!isMounted) {
          return;
        }
        setConversations(items);
        if (!selectedCourierId && items[0]) {
          setSelectedCourierId(items[0].courierId);
          setManualCourierId(items[0].courierId);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(toErrorMessage(error, 'Không tải được danh sách hội thoại.'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedCourierId]);

  useEffect(() => {
    if (!selectedCourierId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    void listChatMessages({ accessToken, courierId: selectedCourierId })
      .then((page) => {
        if (isMounted) {
          setMessages(page.items);
          setMessagesNextCursor(page.nextCursor);
          void markOpsChatRead({ accessToken, courierId: selectedCourierId })
            .then((conversation) => {
              if (isMounted) {
                setConversations((current) => upsertConversation(current, conversation));
              }
            })
            .catch(() => undefined);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(toErrorMessage(error, 'Không tải được tin nhắn.'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedCourierId]);

  useEffect(() => {
    let isClosed = false;
    let reconnectTimer: number | null = null;
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
        const ticket = await createOpsChatWebSocketTicket(accessToken);
        if (isClosed) {
          return;
        }
        socket = new WebSocket(buildOpsChatWsUrl(ticket.ticket));
      } catch {
        if (!isClosed) {
          attempt += 1;
          setRealtimeStatus('reconnecting');
          reconnectTimer = window.setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt));
        }
        return;
      }

      socket.onopen = () => {
        attempt = 0;
        setRealtimeStatus('connected');
      };

      socket.onmessage = (event) => {
        const payload = safeParseRealtimeEvent(event.data);
        if (payload?.type !== 'chat.message') {
          if (payload?.type === 'chat.read') {
            setConversations((current) => upsertConversation(current, payload.conversation));
            if (payload.conversation.courierId === selectedCourierId) {
              void listChatMessages({ accessToken, courierId: selectedCourierId })
                .then((page) => {
                  setMessages(page.items);
                  setMessagesNextCursor(page.nextCursor);
                })
                .catch(() => undefined);
            }
          }
          return;
        }

        setConversations((current) => upsertConversation(current, payload.conversation));
        if (payload.message.courierId === selectedCourierId) {
          setMessages((current) => appendMessageIfMissing(current, payload.message));
          void markOpsChatRead({ accessToken, courierId: selectedCourierId })
            .then((conversation) => {
              setConversations((current) => upsertConversation(current, conversation));
            })
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
        reconnectTimer = window.setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt));
      };
    };

    connect();

    return () => {
      isClosed = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [accessToken, selectedCourierId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const openManualConversation = () => {
    const courierId = manualCourierId.trim();
    if (!courierId) {
      return;
    }
    setSelectedCourierId(courierId);
    setConversations((current) =>
      upsertConversation(current, {
          id: `courier:${courierId}`,
          courierId,
          title: `Courier ${courierId}`,
          lastMessage: null,
          updatedAt: new Date(0).toISOString(),
          messageCount: 0,
          unreadCount: 0,
          lastReadAt: null,
        }),
    );
  };

  const sendMessage = async () => {
    const text = draft.trim();
    const courierId = selectedCourierId.trim();
    if (!text || !courierId) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    try {
      const message = await sendOpsChatMessage({ accessToken, courierId, text });
      setDraft('');
      setMessages((current) => appendMessageIfMissing(current, message));
      setConversations((current) =>
        upsertConversation(current, {
          id: message.conversationId,
          courierId: message.courierId,
          title: `Courier ${message.courierId}`,
          lastMessage: message,
          updatedAt: message.createdAt,
          messageCount:
            (current.find((item) => item.courierId === message.courierId)?.messageCount ?? 0) + 1,
          unreadCount: 0,
          lastReadAt: message.createdAt,
        }),
      );
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Gửi tin nhắn thất bại.'));
    } finally {
      setIsSending(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedCourierId || !messagesNextCursor || isLoadingOlder) {
      return;
    }

    setIsLoadingOlder(true);
    try {
      const page = await listChatMessages({
        accessToken,
        courierId: selectedCourierId,
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
    <section className="ops-chat">
      <aside className="ops-chat__sidebar">
        <div className="ops-chat__sidebar-header">
          <div>
            <h2 className="ops-chat__title">Chat courier</h2>
            <p className="ops-chat__muted">Trao đổi trực tiếp giữa điều phối và shipper.</p>
          </div>
          <span
            className={
              realtimeStatus === 'connected'
                ? 'ops-chat__status ops-chat__status--connected'
                : 'ops-chat__status'
            }
          >
            {formatRealtimeStatus(realtimeStatus)}
          </span>
        </div>

        <div className="ops-chat__quick-open">
          <input
            className="ops-chat__input"
            value={manualCourierId}
            onChange={(event) => setManualCourierId(event.target.value)}
            placeholder="Mã courier"
          />
          <button className="ops-chat__button" type="button" onClick={openManualConversation}>
            Mở
          </button>
        </div>

        <div className="ops-chat__conversation-list">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={
                conversation.courierId === selectedCourierId
                  ? 'ops-chat__conversation ops-chat__conversation--active'
                  : 'ops-chat__conversation'
              }
              onClick={() => {
                setSelectedCourierId(conversation.courierId);
                setManualCourierId(conversation.courierId);
              }}
            >
              <div className="ops-chat__conversation-top">
                <span>{conversation.title}</span>
                <span>
                  {conversation.unreadCount > 0
                    ? `${conversation.unreadCount} mới`
                    : conversation.messageCount}
                </span>
              </div>
              <div className="ops-chat__conversation-preview">
                {conversation.lastMessage?.text ?? 'Chưa có tin nhắn'}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="ops-chat__thread">
        <header className="ops-chat__thread-header">
          <div>
            <h2 className="ops-chat__title">
              {selectedConversation?.title ??
                (selectedCourierId ? `Courier ${selectedCourierId}` : 'Chọn courier')}
            </h2>
            <p className="ops-chat__muted">
              {selectedCourierId
                ? `Conversation courier:${selectedCourierId}`
                : 'Nhập mã courier để bắt đầu hội thoại.'}
            </p>
          </div>
        </header>

        <div className="ops-chat__messages">
          {errorMessage ? <div className="ops-chat__empty">{errorMessage}</div> : null}
          {!errorMessage && messagesNextCursor ? (
            <button
              className="ops-chat__load-older"
              type="button"
              disabled={isLoadingOlder}
              onClick={() => void loadOlderMessages()}
            >
              {isLoadingOlder ? 'Đang tải' : 'Tải tin cũ hơn'}
            </button>
          ) : null}
          {!errorMessage && messages.length === 0 ? (
            <div className="ops-chat__empty">
              Chưa có tin nhắn. Gửi nội dung đầu tiên để mở kênh realtime với courier.
            </div>
          ) : null}
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.senderRole === 'OPS'
                  ? 'ops-chat__bubble ops-chat__bubble--mine'
                  : 'ops-chat__bubble'
              }
            >
              <div className="ops-chat__bubble-meta">
                <span>{message.senderName}</span>
                <span>{formatTime(message.createdAt)}</span>
              </div>
              <div className="ops-chat__bubble-text">{message.text}</div>
              {message.senderRole === 'OPS' && message.readByCourierAt ? (
                <div className="ops-chat__read-receipt">
                  Courier đã đọc {formatTime(message.readByCourierAt)}
                </div>
              ) : null}
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <footer className="ops-chat__composer">
          <textarea
            className="ops-chat__message-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nhập tin nhắn cho courier"
            disabled={!selectedCourierId}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                void sendMessage();
              }
            }}
          />
          <button
            className="ops-chat__button"
            type="button"
            disabled={!selectedCourierId || !draft.trim() || isSending}
            onClick={() => void sendMessage()}
          >
            {isSending ? 'Đang gửi' : 'Gửi'}
          </button>
        </footer>
      </div>
    </section>
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

function upsertConversation(
  current: ChatConversationDto[],
  conversation: ChatConversationDto,
): ChatConversationDto[] {
  const withoutCurrent = current.filter((item) => item.id !== conversation.id);
  return [conversation, ...withoutCurrent].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
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
