import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createClient } from 'redis';

import type { ChatRealtimeEvent } from './chat.types';
import { ChatMetricsService } from './chat.metrics';

type RedisClient = ReturnType<typeof createClient>;
type ChatEventListener = (event: ChatRealtimeEvent) => void;

interface ChatPubSubEnvelope {
  nodeId: string;
  event: ChatRealtimeEvent;
}

@Injectable()
export class ChatPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatPubSubService.name);
  private readonly nodeId = randomUUID();
  private readonly listeners = new Set<ChatEventListener>();
  private readonly channel = process.env.CHAT_REDIS_CHANNEL ?? 'gateway-bff:chat';
  private publisher: RedisClient | null = null;
  private subscriber: RedisClient | null = null;

  constructor(private readonly metrics: ChatMetricsService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = process.env.CHAT_REDIS_URL?.trim();
    if (!redisUrl) {
      this.logger.warn('Chat Redis pub/sub disabled. Set CHAT_REDIS_URL for multi-instance realtime.');
      return;
    }

    this.publisher = createClient({ url: redisUrl });
    this.subscriber = this.publisher.duplicate();
    this.publisher.on('error', (error) => {
      this.logger.error(`Chat Redis publisher error: ${toErrorMessage(error)}`);
    });
    this.subscriber.on('error', (error) => {
      this.logger.error(`Chat Redis subscriber error: ${toErrorMessage(error)}`);
    });

    await this.publisher.connect();
    await this.subscriber.connect();
    await this.subscriber.subscribe(this.channel, (rawMessage) => {
      const event = parseEnvelope(rawMessage)?.event;
      if (!event) {
        return;
      }

      this.metrics.increment('chat_pubsub_events_received_total');
      this.emitLocal(event);
    });
    this.logger.log(`Chat Redis pub/sub subscribed to ${this.channel}`);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.subscriber?.quit().catch(() => undefined),
      this.publisher?.quit().catch(() => undefined),
    ]);
  }

  subscribe(listener: ChatEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async publish(event: ChatRealtimeEvent): Promise<void> {
    if (!this.publisher?.isOpen) {
      this.emitLocal(event);
      return;
    }

    const envelope: ChatPubSubEnvelope = {
      nodeId: this.nodeId,
      event,
    };

    try {
      await this.publisher.publish(this.channel, JSON.stringify(envelope));
      this.metrics.increment('chat_pubsub_events_published_total');
    } catch (error) {
      this.metrics.increment('chat_pubsub_publish_failures_total');
      this.logger.error(`Chat Redis publish failed: ${toErrorMessage(error)}`);
      this.emitLocal(event);
    }
  }

  private emitLocal(event: ChatRealtimeEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

function parseEnvelope(rawMessage: string): ChatPubSubEnvelope | null {
  try {
    const parsed = JSON.parse(rawMessage) as Partial<ChatPubSubEnvelope>;
    if (
      parsed.event?.type === 'chat.message' ||
      parsed.event?.type === 'chat.read' ||
      parsed.event?.type === 'chat.claim'
    ) {
      return parsed as ChatPubSubEnvelope;
    }
  } catch {
    return null;
  }

  return null;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
