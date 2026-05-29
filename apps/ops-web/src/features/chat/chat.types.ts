export type ChatActorRole = 'OPS' | 'COURIER';

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  courierId: string;
  senderRole: ChatActorRole;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  readByOpsAt: string | null;
  readByCourierAt: string | null;
}

export interface ChatMessagePageDto {
  items: ChatMessageDto[];
  nextCursor: string | null;
}

export interface ChatConversationDto {
  id: string;
  courierId: string;
  hubCode: string | null;
  title: string;
  assignedOpsId: string | null;
  assignedOpsName: string | null;
  assignedOpsAt: string | null;
  lastMessage: ChatMessageDto | null;
  updatedAt: string;
  messageCount: number;
  unreadCount: number;
  lastReadAt: string | null;
}

export interface ChatRealtimeMessageEvent {
  type: 'chat.message';
  message: ChatMessageDto;
  conversation: ChatConversationDto;
}

export type ChatRealtimeEvent =
  | ChatRealtimeMessageEvent
  | {
      type: 'chat.read';
      conversation: ChatConversationDto;
    }
  | {
      type: 'chat.claim';
      conversation: ChatConversationDto;
    }
  | {
      type: 'chat.connected';
      actor?: unknown;
    };

export interface ChatWebSocketTicketDto {
  ticket: string;
  expiresAt: string;
}
