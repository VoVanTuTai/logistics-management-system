import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import type { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';

interface RabbitmqHttpConfig {
  publishUrl: string;
  authHeader: string;
}

@Injectable()
export class ScanOutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScanOutboxRelayService.name);
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
  private readonly rabbitmqHttpConfig = this.buildRabbitmqHttpConfig();

  private pollTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private isShuttingDown = false;

  constructor(
    @Inject(OutboxEventRepository)
    private readonly outboxEventRepository: OutboxEventRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.flushPending();

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
  }

  private async flushPending(): Promise<void> {
    if (this.isShuttingDown || this.isFlushing) {
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
        `Scan outbox relay failed while publishing events: ${this.toErrorMessage(error)}`,
      );
    } finally {
      this.isFlushing = false;
    }
  }

  private async publishEvent(event: OutboxEvent): Promise<void> {
    const response = await fetch(this.rabbitmqHttpConfig.publishUrl, {
      method: 'POST',
      headers: {
        Authorization: this.rabbitmqHttpConfig.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          delivery_mode: 2,
          message_id: event.eventId,
          type: event.eventType,
          timestamp: Math.floor(event.occurredAt.getTime() / 1000),
          headers: {
            idempotency_key: event.payload.idempotency_key,
            aggregate_type: event.aggregateType,
            aggregate_id: event.aggregateId,
          },
        },
        routing_key: event.routingKey,
        payload: JSON.stringify(event.payload),
        payload_encoding: 'string',
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `RabbitMQ publish request failed (${response.status}): ${responseText}`,
      );
    }

    const publishResult = (await response.json()) as { routed?: boolean };
    if (!publishResult.routed) {
      this.logger.warn(
        `Event "${event.eventType}" with routing key "${event.routingKey}" was not routed by exchange "${this.exchangeName}".`,
      );
    }
  }

  private buildRabbitmqHttpConfig(): RabbitmqHttpConfig {
    const rabbitmqUrl = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
    const parsedUrl = new URL(rabbitmqUrl);
    const username = decodeURIComponent(parsedUrl.username || 'guest');
    const password = decodeURIComponent(parsedUrl.password || 'guest');
    const host = parsedUrl.hostname || 'localhost';
    const managementPort = process.env.RABBITMQ_MANAGEMENT_PORT ?? '15672';

    return {
      publishUrl: `http://${host}:${managementPort}/api/exchanges/%2F/${encodeURIComponent(this.exchangeName)}/publish`,
      authHeader: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    };
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
