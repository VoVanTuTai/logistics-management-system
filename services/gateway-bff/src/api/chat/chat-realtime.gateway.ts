import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { IncomingMessage, Server } from 'http';
import type { Socket } from 'net';

import { ChatMetricsService } from './chat.metrics';
import { ChatPubSubService } from './chat.pubsub';
import { ChatService } from './chat.service';
import type { ChatActor, ChatRealtimeEvent } from './chat.types';

type ChatSocket = {
  actor: ChatActor;
  socket: Socket;
  buffer: Buffer;
};

@Injectable()
export class ChatRealtimeGateway {
  private readonly logger = new Logger(ChatRealtimeGateway.name);
  private readonly clients = new Set<ChatSocket>();
  private isRegistered = false;
  private unsubscribePubSub: (() => void) | null = null;

  constructor(
    private readonly chatService: ChatService,
    private readonly chatPubSubService: ChatPubSubService,
    private readonly chatMetricsService: ChatMetricsService,
  ) {
    this.unsubscribePubSub = this.chatPubSubService.subscribe((event) => {
      this.broadcastLocal(event);
    });
  }

  registerHttpServer(server: Server): void {
    if (this.isRegistered) {
      return;
    }

    this.isRegistered = true;
    server.on('upgrade', (request, socket) => {
      void this.handleUpgrade(request, socket as Socket);
    });
    this.logger.log('Chat realtime WebSocket is listening on /ws/chat');
  }

  async publish(event: ChatRealtimeEvent): Promise<void> {
    await this.chatPubSubService.publish(event);
  }

  broadcastLocal(event: ChatRealtimeEvent): void {
    const payload = JSON.stringify(event);

    for (const client of this.clients) {
      const canReceive = this.chatService.canReceiveConversation(
        client.actor,
        event.conversation,
      );
      if (!canReceive) {
        continue;
      }

      const didSend = this.sendText(client.socket, payload);
      if (didSend) {
        this.chatMetricsService.increment('chat_ws_events_sent_total');
      } else {
        this.chatMetricsService.increment('chat_ws_send_failures_total');
      }
    }
  }

  private async handleUpgrade(
    request: IncomingMessage,
    socket: Socket,
  ): Promise<void> {
    const url = new URL(request.url ?? '/', 'http://gateway-bff.local');
    if (url.pathname !== '/ws/chat') {
      return;
    }

    try {
      const actor = await this.resolveUpgradeActor(request, url);

      this.acceptSocket(request, socket, actor);
    } catch (error) {
      this.chatMetricsService.increment('chat_ws_rejections_total');
      this.logger.warn(`Reject chat WebSocket: ${toErrorMessage(error)}`);
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
    }
  }

  private acceptSocket(
    request: IncomingMessage,
    socket: Socket,
    actor: ChatActor,
  ): void {
    const websocketKey = request.headers['sec-websocket-key'];
    if (!websocketKey || Array.isArray(websocketKey)) {
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const acceptKey = createHash('sha1')
      .update(`${websocketKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '',
        '',
      ].join('\r\n'),
    );

    const client: ChatSocket = {
      actor,
      socket,
      buffer: Buffer.alloc(0),
    };
    this.clients.add(client);
    this.chatMetricsService.increment('chat_ws_connections_total');
    this.chatMetricsService.set('chat_ws_connections_active', this.clients.size);

    this.sendText(
      socket,
      JSON.stringify({
        type: 'chat.connected',
        actor,
      }),
    );

    socket.on('data', (chunk) => {
      client.buffer = Buffer.concat([client.buffer, chunk]);
      client.buffer = this.consumeFrames(client, client.buffer);
    });

    socket.on('close', () => {
      this.clients.delete(client);
      this.chatMetricsService.set('chat_ws_connections_active', this.clients.size);
    });

    socket.on('error', (error) => {
      this.clients.delete(client);
      this.chatMetricsService.set('chat_ws_connections_active', this.clients.size);
      this.logger.warn(`Chat WebSocket error: ${toErrorMessage(error)}`);
    });
  }

  private async resolveUpgradeActor(
    request: IncomingMessage,
    url: URL,
  ): Promise<ChatActor> {
    const ticket = url.searchParams.get('ticket');
    if (ticket) {
      return this.chatService.resolveActorFromWebSocketTicket(ticket);
    }

    if (process.env.CHAT_REQUIRE_WS_TICKET === 'true') {
      throw new Error('Chat WebSocket ticket is required.');
    }

    return this.chatService.resolveActor({
      authorizationHeader:
        request.headers.authorization ??
        readAccessTokenFromQuery(url),
      roleHint: url.searchParams.get('clientRole'),
      courierIdHint: url.searchParams.get('courierId'),
    });
  }

  private consumeFrames(client: ChatSocket, buffer: Buffer): Buffer {
    let offset = 0;

    while (offset + 2 <= buffer.length) {
      const firstByte = buffer[offset];
      const secondByte = buffer[offset + 1];
      const opcode = firstByte & 0x0f;
      const isMasked = (secondByte & 0x80) === 0x80;
      let payloadLength = secondByte & 0x7f;
      let headerLength = 2;

      if (payloadLength === 126) {
        if (offset + 4 > buffer.length) {
          break;
        }
        payloadLength = buffer.readUInt16BE(offset + 2);
        headerLength = 4;
      } else if (payloadLength === 127) {
        if (offset + 10 > buffer.length) {
          break;
        }
        const largePayloadLength = buffer.readBigUInt64BE(offset + 2);
        if (largePayloadLength > BigInt(Number.MAX_SAFE_INTEGER)) {
          client.socket.destroy();
          return Buffer.alloc(0);
        }
        payloadLength = Number(largePayloadLength);
        headerLength = 10;
      }

      const maskLength = isMasked ? 4 : 0;
      const frameLength = headerLength + maskLength + payloadLength;
      if (offset + frameLength > buffer.length) {
        break;
      }

      if (opcode === 0x8) {
        client.socket.end();
        this.clients.delete(client);
        return buffer.subarray(offset + frameLength);
      }

      if (opcode === 0x9) {
        this.sendPong(client.socket);
        offset += frameLength;
        continue;
      }

      offset += frameLength;
    }

    return buffer.subarray(offset);
  }

  private sendText(socket: Socket, text: string): boolean {
    if (socket.destroyed || !socket.writable) {
      return false;
    }

    socket.write(encodeWebSocketFrame(Buffer.from(text, 'utf8'), 0x1));
    return true;
  }

  private sendPong(socket: Socket): void {
    if (!socket.destroyed && socket.writable) {
      socket.write(encodeWebSocketFrame(Buffer.alloc(0), 0xA));
    }
  }
}

function encodeWebSocketFrame(payload: Buffer, opcode: number): Buffer {
  const payloadLength = payload.length;
  let header: Buffer;

  if (payloadLength < 126) {
    header = Buffer.from([0x80 | opcode, payloadLength]);
  } else if (payloadLength <= 0xffff) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payloadLength), 2);
  }

  return Buffer.concat([header, payload]);
}

function readAccessTokenFromQuery(url: URL): string | null {
  const accessToken = url.searchParams.get('accessToken')?.trim();
  return accessToken ? `Bearer ${accessToken}` : null;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
