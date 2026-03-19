import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import type { ReportingEventEnvelope } from '../../application/projections/reporting-event.types';
import { ReportingEventsConsumer } from './reporting-events.consumer';

const RETRY_ROUTING_KEY = 'reporting.retry';
const DEFAULT_VHOST = '%2F';

interface RabbitmqHttpConfig {
  apiBaseUrl: string;
  authHeader: string;
}

interface RabbitmqHttpMessageProperties {
  content_type?: string;
  content_encoding?: string;
  correlation_id?: string;
  message_id?: string;
  type?: string;
  timestamp?: number;
  headers?: Record<string, unknown>;
}

interface RabbitmqHttpMessage {
  payload: unknown;
  payload_encoding?: string;
  properties?: RabbitmqHttpMessageProperties;
}

@Injectable()
export class ReportingRabbitmqConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReportingRabbitmqConsumerService.name);
  private readonly pollIntervalMs = this.parsePositiveInt(
    process.env.REPORTING_CONSUMER_INTERVAL_MS,
    1000,
  );
  private readonly batchSize = this.parsePositiveInt(
    process.env.REPORTING_CONSUMER_BATCH_SIZE,
    20,
  );
  private readonly exchangeName =
    process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events';
  private readonly rabbitmqHttpConfig = this.buildRabbitmqHttpConfig();

  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private isShuttingDown = false;

  constructor(private readonly reportingEventsConsumer: ReportingEventsConsumer) {}

  async onModuleInit(): Promise<void> {
    await this.configureTopology();
    await this.pollPending();
    this.logger.log(
      `Reporting consumer polling "${this.reportingEventsConsumer.queueName}" every ${this.pollIntervalMs}ms.`,
    );

    this.pollTimer = setInterval(() => {
      void this.pollPending();
    }, this.pollIntervalMs);
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async configureTopology(): Promise<void> {
    try {
      await this.declareExchange(this.exchangeName);
      await this.declareQueue(this.reportingEventsConsumer.queueName);
      await this.bindQueue(this.reportingEventsConsumer.queueName, RETRY_ROUTING_KEY);

      for (const pattern of this.reportingEventsConsumer.routingPatterns) {
        await this.bindQueue(this.reportingEventsConsumer.queueName, pattern);
      }

      await this.declareQueue(this.reportingEventsConsumer.retryQueue10s, {
        'x-message-ttl': 10000,
        'x-dead-letter-exchange': this.exchangeName,
        'x-dead-letter-routing-key': RETRY_ROUTING_KEY,
      });
      await this.declareQueue(this.reportingEventsConsumer.retryQueue1m, {
        'x-message-ttl': 60000,
        'x-dead-letter-exchange': this.exchangeName,
        'x-dead-letter-routing-key': RETRY_ROUTING_KEY,
      });
      await this.declareQueue(this.reportingEventsConsumer.dlqName);
    } catch (error) {
      this.logger.error(
        `Failed to configure reporting consumer topology: ${this.toErrorMessage(error)}`,
      );
    }
  }

  private async pollPending(): Promise<void> {
    if (this.isShuttingDown || this.isPolling) {
      return;
    }

    this.isPolling = true;

    try {
      const messages = await this.readMessages(this.reportingEventsConsumer.queueName);

      for (const message of messages) {
        await this.processMessage(message);
      }
    } catch (error) {
      this.logger.error(
        `Failed to poll reporting queue: ${this.toErrorMessage(error)}`,
      );
    } finally {
      this.isPolling = false;
    }
  }

  private async processMessage(message: RabbitmqHttpMessage): Promise<void> {
    const rawPayload = this.toRawPayload(message.payload);
    const event = this.parseEventEnvelope(rawPayload);

    if (!event) {
      this.logger.warn('Skipping malformed reporting event payload.');
      return;
    }

    try {
      await this.reportingEventsConsumer.handle(event);
    } catch (error) {
      await this.moveToRetryOrDlq(message, rawPayload, error);
    }
  }

  private async moveToRetryOrDlq(
    message: RabbitmqHttpMessage,
    rawPayload: string,
    error: unknown,
  ): Promise<void> {
    const retryCount = this.readRetryCount(message.properties?.headers);
    const targetQueue =
      retryCount === 0
        ? this.reportingEventsConsumer.retryQueue10s
        : retryCount === 1
          ? this.reportingEventsConsumer.retryQueue1m
          : this.reportingEventsConsumer.dlqName;
    const nextHeaders = {
      ...(message.properties?.headers ?? {}),
      'x-retry-count': retryCount + 1,
      'x-last-error': this.toErrorMessage(error).slice(0, 200),
    };

    await this.publishToQueue(targetQueue, rawPayload, message.properties, nextHeaders);
    this.logger.warn(
      `Project reporting event failed, moved to "${targetQueue}" (retry=${retryCount}).`,
    );
  }

  private async readMessages(queueName: string): Promise<RabbitmqHttpMessage[]> {
    const response = await this.callRabbitmqApi(
      `/queues/${DEFAULT_VHOST}/${encodeURIComponent(queueName)}/get`,
      {
        method: 'POST',
        body: JSON.stringify({
          count: this.batchSize,
          ackmode: 'ack_requeue_false',
          encoding: 'auto',
          truncate: 50000,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Read queue failed (${response.status}): ${body}`);
    }

    return (await response.json()) as RabbitmqHttpMessage[];
  }

  private async declareExchange(exchangeName: string): Promise<void> {
    const response = await this.callRabbitmqApi(
      `/exchanges/${DEFAULT_VHOST}/${encodeURIComponent(exchangeName)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          type: 'topic',
          durable: true,
          auto_delete: false,
          internal: false,
          arguments: {},
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Declare exchange failed (${response.status}): ${body}`);
    }
  }

  private async declareQueue(
    queueName: string,
    argumentsMap?: Record<string, unknown>,
  ): Promise<void> {
    const response = await this.callRabbitmqApi(
      `/queues/${DEFAULT_VHOST}/${encodeURIComponent(queueName)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          durable: true,
          auto_delete: false,
          arguments: argumentsMap ?? {},
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Declare queue failed (${response.status}): ${body}`);
    }
  }

  private async bindQueue(queueName: string, routingKey: string): Promise<void> {
    const response = await this.callRabbitmqApi(
      `/bindings/${DEFAULT_VHOST}/e/${encodeURIComponent(this.exchangeName)}/q/${encodeURIComponent(queueName)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          routing_key: routingKey,
          arguments: {},
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Bind queue failed (${response.status}): ${body}`);
    }
  }

  private async publishToQueue(
    queueName: string,
    rawPayload: string,
    sourceProperties: RabbitmqHttpMessageProperties | undefined,
    headers: Record<string, unknown>,
  ): Promise<void> {
    const response = await this.callRabbitmqApi(
      `/exchanges/${DEFAULT_VHOST}/${encodeURIComponent('amq.default')}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            delivery_mode: 2,
            content_type: sourceProperties?.content_type ?? 'application/json',
            content_encoding: sourceProperties?.content_encoding ?? 'utf-8',
            correlation_id: sourceProperties?.correlation_id ?? undefined,
            message_id: sourceProperties?.message_id ?? undefined,
            type: sourceProperties?.type ?? undefined,
            timestamp:
              sourceProperties?.timestamp ?? Math.floor(Date.now() / 1000),
            headers,
          },
          routing_key: queueName,
          payload: rawPayload,
          payload_encoding: 'string',
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Publish to queue failed (${response.status}): ${body}`);
    }
  }

  private async callRabbitmqApi(
    path: string,
    init: { method: string; body?: string },
  ): Promise<Response> {
    return fetch(`${this.rabbitmqHttpConfig.apiBaseUrl}${path}`, {
      method: init.method,
      headers: {
        Authorization: this.rabbitmqHttpConfig.authHeader,
        'Content-Type': 'application/json',
      },
      body: init.body,
    });
  }

  private toRawPayload(payload: unknown): string {
    if (typeof payload === 'string') {
      return payload;
    }

    return JSON.stringify(payload ?? {});
  }

  private parseEventEnvelope(rawPayload: string): ReportingEventEnvelope | null {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawPayload) as unknown;
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

    if (!eventId || !eventType || !occurredAt || !idempotencyKey) {
      return null;
    }

    if (!this.reportingEventsConsumer.routingPatterns.includes(eventType)) {
      return null;
    }

    return {
      event_id: eventId,
      event_type: eventType,
      occurred_at: occurredAt,
      shipment_code: this.readNullableString(record.shipment_code),
      actor: this.readNullableString(record.actor),
      location: this.readObject(record.location),
      data: this.readObject(record.data) ?? {},
      idempotency_key: idempotencyKey,
    };
  }

  private buildRabbitmqHttpConfig(): RabbitmqHttpConfig {
    const rabbitmqUrl = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
    const parsedUrl = new URL(rabbitmqUrl);
    const username = decodeURIComponent(parsedUrl.username || 'guest');
    const password = decodeURIComponent(parsedUrl.password || 'guest');
    const host = parsedUrl.hostname || 'localhost';
    const managementPort = process.env.RABBITMQ_MANAGEMENT_PORT ?? '15672';

    return {
      apiBaseUrl: `http://${host}:${managementPort}/api`,
      authHeader: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    };
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
