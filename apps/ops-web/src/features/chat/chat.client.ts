import { opsApiClient } from '../../services/api/client';
import { appEnv } from '../../utils/env';
import type {
  ChatConversationDto,
  ChatMessageDto,
  ChatMessagePageDto,
  ChatWebSocketTicketDto,
} from './chat.types';

export async function listChatConversations(
  accessToken: string | null,
): Promise<ChatConversationDto[]> {
  return opsApiClient.request<ChatConversationDto[]>(
    '/chat/conversations?clientRole=OPS',
    {
      accessToken,
    },
  );
}

export async function listChatMessages(input: {
  accessToken: string | null;
  courierId: string;
  before?: string | null;
  limit?: number;
}): Promise<ChatMessagePageDto> {
  const params = new URLSearchParams({
    clientRole: 'OPS',
    courierId: input.courierId,
  });
  if (input.before) {
    params.set('before', input.before);
  }
  if (input.limit) {
    params.set('limit', String(input.limit));
  }

  return opsApiClient.request<ChatMessagePageDto>(
    `/chat/messages?${params.toString()}`,
    {
      accessToken: input.accessToken,
    },
  );
}

export async function sendOpsChatMessage(input: {
  accessToken: string | null;
  courierId: string;
  text: string;
}): Promise<ChatMessageDto> {
  return opsApiClient.request<ChatMessageDto>('/chat/messages?clientRole=OPS', {
    method: 'POST',
    accessToken: input.accessToken,
    body: {
      courierId: input.courierId,
      text: input.text,
    },
  });
}

export async function markOpsChatRead(input: {
  accessToken: string | null;
  courierId: string;
}): Promise<ChatConversationDto> {
  return opsApiClient.request<ChatConversationDto>('/chat/read?clientRole=OPS', {
    method: 'POST',
    accessToken: input.accessToken,
    body: {
      courierId: input.courierId,
    },
  });
}

export async function createOpsChatWebSocketTicket(
  accessToken: string | null,
): Promise<ChatWebSocketTicketDto> {
  return opsApiClient.request<ChatWebSocketTicketDto>('/chat/ws-ticket?clientRole=OPS', {
    method: 'POST',
    accessToken,
    body: {},
  });
}

export function buildOpsChatWsUrl(ticket: string): string {
  const url = new URL(appEnv.chatWsUrl);
  url.searchParams.set('ticket', ticket);
  return url.toString();
}
