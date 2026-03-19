import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { connect, type ChannelModel, type ConfirmChannel, type Options } from 'amqplib';

import type { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';

@Injectable()
export class MasterdataOutboxRelayService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MasterdataOutboxRelayService.name);
  private readonly rabbitmqUrl =
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  private readonly exchangeName =
    process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';
  private readonly pollIntervalMs = this.parsePositiveInt(
    process.env.OUTBOX_RELAY_INTERVAL_MS,
    1000,
  );
  private readonly batchSize = this.parsePositiveInt(
    process.env.OUTBOX_RELAY_BATCH_SIZE,
    50,
  );

  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private isShuttingDown = false;

  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureBrokerConnection();

    this.pollTimer = setInterval(() => {
      void this.flushPending();
    }, this.pollIntervalMs);
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

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

  private async ensureBrokerConnection(): Promise<void> {
    if (this.isShuttingDown || this.channel) {
      return;
    }

    try {
      const connection = await connect(this.rabbitmqUrl);
      const channel = await connection.createConfirmChannel();

      await channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

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
        `Outbox relay connected to exchange "${this.exchangeName}" (batch=${this.batchSize}).`,
      );

      await this.flushPending();
    } catch (error) {
      this.logger.error(
        `Failed to connect RabbitMQ for outbox relay: ${this.toErrorMessage(error)}`,
      );
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.ensureBrokerConnection();
    }, 3000);
  }

  private async flushPending(): Promise<void> {
    if (this.isShuttingDown || this.isFlushing) {
      return;
    }

    if (!this.channel) {
      await this.ensureBrokerConnection();
      return;
    }

    this.isFlushing = true;

    try {
      const pendingEvents = await this.outboxEventRepository.listPending(this.batchSize);
      if (pendingEvents.length === 0) {
        return;
      }

      for (const event of pendingEvents) {
        await this.publishEvent(event);
        await this.outboxEventRepository.markPublished(event.id, new Date());
      }
    } catch (error) {
      this.logger.error(
        `Outbox relay failed while publishing events: ${this.toErrorMessage(error)}`,
      );
      this.channel = null;
      this.connection = null;
      this.scheduleReconnect();
    } finally {
      this.isFlushing = false;
    }
  }

  private publishEvent(event: OutboxEvent): Promise<void> {
    const channel = this.channel;
    if (!channel) {
      throw new Error('RabbitMQ confirm channel is not ready.');
    }

    const content = Buffer.from(JSON.stringify(event.payload), 'utf8');
    const options: Options.Publish = {
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      persistent: true,
      messageId: event.eventId,
      type: event.eventType,
      timestamp: event.occurredAt.getTime(),
      headers: {
        idempotency_key: event.payload.idempotency_key,
        aggregate_type: event.aggregateType,
        aggregate_id: event.aggregateId,
      },
    };

    return new Promise<void>((resolve, reject) => {
      channel.publish(
        this.exchangeName,
        event.routingKey,
        content,
        options,
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        },
      );
    });
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
