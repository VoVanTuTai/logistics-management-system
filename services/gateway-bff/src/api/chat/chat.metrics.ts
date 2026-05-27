import { Injectable } from '@nestjs/common';

type MetricKind = 'counter' | 'gauge';

interface MetricDefinition {
  kind: MetricKind;
  help: string;
}

const METRICS: Record<string, MetricDefinition> = {
  chat_messages_created_total: {
    kind: 'counter',
    help: 'Total chat messages persisted by the gateway.',
  },
  chat_read_marks_total: {
    kind: 'counter',
    help: 'Total chat read receipt updates.',
  },
  chat_ws_connections_total: {
    kind: 'counter',
    help: 'Total accepted chat WebSocket connections.',
  },
  chat_ws_connections_active: {
    kind: 'gauge',
    help: 'Current active chat WebSocket connections.',
  },
  chat_ws_rejections_total: {
    kind: 'counter',
    help: 'Total rejected chat WebSocket upgrades.',
  },
  chat_ws_events_sent_total: {
    kind: 'counter',
    help: 'Total chat realtime events sent to WebSocket clients.',
  },
  chat_ws_send_failures_total: {
    kind: 'counter',
    help: 'Total failed chat WebSocket event sends.',
  },
  chat_pubsub_events_published_total: {
    kind: 'counter',
    help: 'Total chat realtime events published to pub/sub.',
  },
  chat_pubsub_events_received_total: {
    kind: 'counter',
    help: 'Total chat realtime events received from pub/sub.',
  },
  chat_pubsub_publish_failures_total: {
    kind: 'counter',
    help: 'Total chat pub/sub publish failures.',
  },
  chat_store_errors_total: {
    kind: 'counter',
    help: 'Total chat store operation failures.',
  },
  chat_ws_tickets_issued_total: {
    kind: 'counter',
    help: 'Total short-lived chat WebSocket auth tickets issued.',
  },
};

@Injectable()
export class ChatMetricsService {
  private readonly values = new Map<string, number>();

  increment(name: keyof typeof METRICS, value = 1): void {
    this.values.set(name, this.get(name) + value);
  }

  set(name: keyof typeof METRICS, value: number): void {
    this.values.set(name, value);
  }

  get(name: keyof typeof METRICS): number {
    return this.values.get(name) ?? 0;
  }

  renderPrometheus(): string {
    return Object.entries(METRICS)
      .map(([name, definition]) => {
        const value = this.values.get(name) ?? 0;
        return [
          `# HELP ${name} ${definition.help}`,
          `# TYPE ${name} ${definition.kind}`,
          `${name} ${value}`,
        ].join('\n');
      })
      .join('\n');
  }
}
