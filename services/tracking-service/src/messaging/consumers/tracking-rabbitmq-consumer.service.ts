import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  connect,
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
  type Options,
} from 'amqplib';

import { isTrackingBusinessEventType } from '../../application/mappers/tracking-display.mapper';
import type { TrackingEventEnvelope } from '../../domain/entities/timeline-event.entity';
import { TrackingEventsConsumer } from './tracking-events.consumer';

const RETRY_ROUTING_KEY = 'tracking.retry';

@Injectable()
export class TrackingRabbitmqConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TrackingRabbitmqConsumerService.name);
  private readonly rabbitmqUrl =
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  private readonly exchangeName =
    process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';

  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(private readonly trackingEventsConsumer: TrackingEventsConsumer) {}

  async onModuleInit(): Promise<void> {
    await this.connectAndConsume();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      await this.channel.close().catch(() => undefined);
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close().catch(() => undefined);
      this.connection = null;
    }
  }

  private async connectAndConsume(): Promise<void> {
    if (this.isShuttingDown || this.channel) {
      return;
    }

    try {
      const connection = await connect(this.rabbitmqUrl);
      const channel = await connection.createChannel();
      await this.configureTopology(channel);

      await channel.consume(
        this.trackingEventsConsumer.queueName,
        (message) => {
          void this.handleMessage(message);
        },
        { noAck: false },
      );

      connection.on('close', () => {
        if (this.isShuttingDown) {
          return;
        }

        this.logger.warn('RabbitMQ connection closed, scheduling reconnect.');
        this.connection = null;
        this.channel = null;
        this.scheduleReconnect();
      });

      connection.on('error', (error) => {
        if (this.isShuttingDown) {
          return;
        }

        this.logger.error(`RabbitMQ connection error: ${this.toErrorMessage(error)}`);
      });

      this.connection = connection;
      this.channel = channel;
      this.logger.log(
        `Tracking consumer is listening queue "${this.trackingEventsConsumer.queueName}".`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to connect RabbitMQ consumer: ${this.toErrorMessage(error)}`,
      );
      this.scheduleReconnect();
    }
  }

  private async configureTopology(channel: Channel): Promise<void> {
    const mainQueue = this.trackingEventsConsumer.queueName;
    const retryQueue10s = this.trackingEventsConsumer.retryQueue10s;
    const retryQueue1m = this.trackingEventsConsumer.retryQueue1m;
    const deadLetterQueue = this.trackingEventsConsumer.dlqName;

    await channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    await channel.assertQueue(mainQueue, { durable: true });
    await channel.bindQueue(mainQueue, this.exchangeName, RETRY_ROUTING_KEY);

    for (const pattern of this.trackingEventsConsumer.routingPatterns) {
      await channel.bindQueue(mainQueue, this.exchangeName, pattern);
    }

    await channel.assertQueue(retryQueue10s, {
      durable: true,
      arguments: {
        'x-message-ttl': 10000,
        'x-dead-letter-exchange': this.exchangeName,
        'x-dead-letter-routing-key': RETRY_ROUTING_KEY,
      },
    });

    await channel.assertQueue(retryQueue1m, {
      durable: true,
      arguments: {
        'x-message-ttl': 60000,
        'x-dead-letter-exchange': this.exchangeName,
        'x-dead-letter-routing-key': RETRY_ROUTING_KEY,
      },
    });

    await channel.assertQueue(deadLetterQueue, { durable: true });
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectAndConsume();
    }, 3000);
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }

    const channel = this.channel;
    if (!channel) {
      return;
    }

    const event = this.parseEventEnvelope(message.content);
    if (!event) {
      this.logger.warn('Skipping malformed tracking event payload.');
      channel.ack(message);
      return;
    }

    try {
      await this.trackingEventsConsumer.handle(event);
      channel.ack(message);
    } catch (error) {
      this.moveToRetryOrDlq(channel, message, error);
    }
  }

  private moveToRetryOrDlq(
    channel: Channel,
    message: ConsumeMessage,
    error: unknown,
  ): void {
    const retryCount = this.readRetryCount(message.properties.headers);
    const targetQueue =
      retryCount === 0
        ? this.trackingEventsConsumer.retryQueue10s
        : retryCount === 1
          ? this.trackingEventsConsumer.retryQueue1m
          : this.trackingEventsConsumer.dlqName;

    const nextHeaders = {
      ...(message.properties.headers ?? {}),
      'x-retry-count': retryCount + 1,
      'x-last-error': this.toErrorMessage(error).slice(0, 200),
    };

    const publishOptions: Options.Publish = {
      persistent: true,
      contentType: message.properties.contentType ?? 'application/json',
      contentEncoding: message.properties.contentEncoding ?? 'utf-8',
      correlationId: message.properties.correlationId,
      messageId: message.properties.messageId,
      type: message.properties.type,
      timestamp: message.properties.timestamp,
      headers: nextHeaders,
    };

    channel.publish('', targetQueue, message.content, publishOptions);
    channel.ack(message);
    this.logger.warn(
      `Project tracking event failed, moved to "${targetQueue}" (retry=${retryCount}).`,
    );
  }

  private parseEventEnvelope(content: Buffer): TrackingEventEnvelope | null {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content.toString('utf8')) as unknown;
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const eventId = this.readString(record.event_id);
    const eventType = this.readString(record.event_type);
    const occurredAt = this.readString(record.occurred_at);
    const idempotencyKey = this.readString(record.idempotency_key);

    if (
      !eventId ||
      !eventType ||
      !occurredAt ||
      !idempotencyKey ||
      !isTrackingBusinessEventType(eventType)
    ) {
      return null;
    }

    return {
      event_id: eventId,
      event_type: eventType,
      occurred_at: occurredAt,
      shipment_code: this.readNullableString(record.shipment_code),
      actor: this.readActor(record.actor),
      location: this.readObject(record.location),
      data: this.readObject(record.data) ?? {},
      idempotency_key: idempotencyKey,
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private readNullableString(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }
    return null;
  }

  private readObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private readActor(
    value: unknown,
  ): string | Record<string, unknown> | null {
    if (typeof value === 'string') {
      return value;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readRetryCount(headers: Record<string, unknown> | undefined): number {
    const value = headers?.['x-retry-count'];

    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }

    return 0;
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
