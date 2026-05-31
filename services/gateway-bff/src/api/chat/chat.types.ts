export type ChatActorRole = 'OPS' | 'COURIER';

export interface ChatActor {
  role: ChatActorRole;
  id: string;
  displayName: string;
  courierId: string | null;
  hubCodes: string[];
  canAccessAllHubs: boolean;
}

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

export interface ChatRealtimeEvent {
  type: 'chat.message' | 'chat.read' | 'chat.claim';
  message?: ChatMessageDto;
  conversation: ChatConversationDto;
}

export interface ChatWebSocketTicketDto {
  ticket: string;
  expiresAt: string;
}
