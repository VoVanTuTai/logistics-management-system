import { courierApiClient } from '../../services/api/client';
import { appEnv } from '../../utils/env';
import type {
  ChatConversationDto,
  ChatMessageDto,
  ChatMessagePageDto,
  ChatWebSocketTicketDto,
} from './chat.types';

export async function listCourierChatMessages(input: {
  accessToken: string;
  courierId: string;
  before?: string | null;
  limit?: number;
}): Promise<ChatMessagePageDto> {
  const params = new URLSearchParams({
    clientRole: 'COURIER',
    courierId: input.courierId,
  });
  if (input.before) {
    params.set('before', input.before);
  }
  if (input.limit) {
    params.set('limit', String(input.limit));
  }

  return courierApiClient.request<ChatMessagePageDto>(
    `/chat/messages?${params.toString()}`,
    {
      accessToken: input.accessToken,
    },
  );
}

export async function sendCourierChatMessage(input: {
  accessToken: string;
  courierId: string;
  text: string;
}): Promise<ChatMessageDto> {
  return courierApiClient.request<ChatMessageDto>('/chat/messages?clientRole=COURIER', {
    method: 'POST',
    accessToken: input.accessToken,
    body: {
      courierId: input.courierId,
      text: input.text,
    },
  });
}

export async function markCourierChatRead(input: {
  accessToken: string;
  courierId: string;
}): Promise<ChatConversationDto> {
  return courierApiClient.request<ChatConversationDto>('/chat/read?clientRole=COURIER', {
    method: 'POST',
    accessToken: input.accessToken,
    body: {
      courierId: input.courierId,
    },
  });
}

export async function createCourierChatWebSocketTicket(input: {
  accessToken: string;
  courierId: string;
}): Promise<ChatWebSocketTicketDto> {
  return courierApiClient.request<ChatWebSocketTicketDto>(
    '/chat/ws-ticket?clientRole=COURIER',
    {
      method: 'POST',
      accessToken: input.accessToken,
      body: {
        courierId: input.courierId,
      },
    },
  );
}

export function buildCourierChatWsUrl(input: {
  accessToken: string | null;
  courierId: string;
  ticket: string;
}): string {
  const url = new URL(appEnv.chatWsUrl);
  url.searchParams.set('ticket', input.ticket);
  return url.toString();
}
