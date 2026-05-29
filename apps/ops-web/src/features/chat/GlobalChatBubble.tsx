import { MessageCircle, Radio, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import {
  buildOpsChatWsUrl,
  createOpsChatWebSocketTicket,
  listChatConversations,
} from './chat.client';
import type { ChatConversationDto, ChatRealtimeEvent } from './chat.types';
import './GlobalChatBubble.css';

type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

const MAX_PREVIEW_CONVERSATIONS = 5;

export function GlobalChatBubble(): React.JSX.Element | null {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations],
  );
  const previewConversations = conversations.slice(0, MAX_PREVIEW_CONVERSATIONS);
  const isOnChatPage = location.pathname === routePaths.operationsPlatformChat;

  useEffect(() => {
    if (!isAuthenticated) {
      setConversations([]);
      setStatus('offline');
      return;
    }

    let isMounted = true;
    void listChatConversations(accessToken)
      .then((items) => {
        if (!isMounted) {
          return;
        }
        setConversations(sortConversations(items));
        setErrorMessage(null);
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(toErrorMessage(error, 'Không tải được chat courier.'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

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

      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      try {
        const ticket = await createOpsChatWebSocketTicket(accessToken);
        if (isClosed) {
          return;
        }
        socket = new WebSocket(buildOpsChatWsUrl(ticket.ticket));
      } catch {
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        attempt = 0;
        setStatus('connected');
      };

      socket.onmessage = (event) => {
        const payload = safeParseRealtimeEvent(event.data);
        if (
          payload?.type !== 'chat.message' &&
          payload?.type !== 'chat.read' &&
          payload?.type !== 'chat.claim'
        ) {
          return;
        }

        setConversations((current) => upsertConversation(current, payload.conversation));
        setErrorMessage(null);
      };

      socket.onerror = () => {
        if (!isClosed) {
          setStatus('offline');
        }
      };

      socket.onclose = () => {
        if (!isClosed) {
          scheduleReconnect();
        }
      };
    };

    const scheduleReconnect = () => {
      if (isClosed) {
        return;
      }

      attempt += 1;
      setStatus('reconnecting');
      reconnectTimer = window.setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt));
    };

    connect();

    return () => {
      isClosed = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [accessToken, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const openConversation = (courierId: string) => {
    setIsOpen(false);
    navigate(routePaths.operationsPlatformChatWithCourier(courierId));
  };

  const openChatPage = () => {
    setIsOpen(false);
    navigate(routePaths.operationsPlatformChat);
  };

  return (
    <aside className="ops-global-chat" aria-label="Chat courier nhanh">
      {isOpen ? (
        <div className="ops-global-chat__panel">
          <header className="ops-global-chat__header">
            <div>
              <h2>Chat courier</h2>
              <p>{formatStatus(status)}</p>
            </div>
            <button
              type="button"
              className="ops-global-chat__icon-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng chat nhanh"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {errorMessage ? (
            <div className="ops-global-chat__notice">{errorMessage}</div>
          ) : null}

          {!errorMessage && previewConversations.length === 0 ? (
            <div className="ops-global-chat__notice">Chưa có hội thoại courier.</div>
          ) : null}

          <div className="ops-global-chat__list">
            {previewConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className="ops-global-chat__item"
                onClick={() => openConversation(conversation.courierId)}
              >
                <span className="ops-global-chat__item-top">
                  <strong>{conversation.title}</strong>
                  <span>
                    {conversation.unreadCount > 0
                      ? `${conversation.unreadCount} mới`
                      : formatConversationTime(conversation.updatedAt)}
                  </span>
                </span>
                <span className="ops-global-chat__preview">
                  {conversation.lastMessage?.senderName
                    ? `${conversation.lastMessage.senderName}: ${conversation.lastMessage.text}`
                    : 'Chưa có tin nhắn'}
                </span>
                <span className="ops-global-chat__owner">
                  {conversation.assignedOpsName
                    ? `Đang xử lý bởi ${conversation.assignedOpsName}`
                    : 'Chưa có ops nhận xử lý'}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ops-global-chat__open-all"
            onClick={openChatPage}
            disabled={isOnChatPage}
          >
            {isOnChatPage ? 'Đang ở màn chat' : 'Mở trung tâm chat'}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="ops-global-chat__bubble"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Mở chat courier nhanh"
      >
        <MessageCircle size={24} aria-hidden="true" />
        <span className="ops-global-chat__pulse" aria-hidden="true">
          <Radio size={12} />
        </span>
        {unreadCount > 0 ? (
          <span className="ops-global-chat__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>
    </aside>
  );
}

function safeParseRealtimeEvent(input: unknown): ChatRealtimeEvent | null {
  if (typeof input !== 'string') {
    return null;
  }

  try {
    return JSON.parse(input) as ChatRealtimeEvent;
  } catch {
    return null;
  }
}

function upsertConversation(
  current: ChatConversationDto[],
  conversation: ChatConversationDto,
): ChatConversationDto[] {
  const withoutCurrent = current.filter((item) => item.id !== conversation.id);
  return sortConversations([conversation, ...withoutCurrent]);
}

function sortConversations(items: ChatConversationDto[]): ChatConversationDto[] {
  return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function formatStatus(status: RealtimeStatus): string {
  if (status === 'connected') {
    return 'Realtime đang kết nối';
  }
  if (status === 'connecting') {
    return 'Đang nối realtime';
  }
  if (status === 'reconnecting') {
    return 'Đang nối lại realtime';
  }
  return 'Realtime tạm ngắt';
}

function formatConversationTime(value: string): string {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time) || time <= 0) {
    return '0';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
