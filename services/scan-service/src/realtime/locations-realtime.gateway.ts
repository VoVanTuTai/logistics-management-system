import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

import type { CourierCurrentLocation } from '../domain/entities/current-location.entity';

type TrackedWebSocket = WebSocket & {
  isAlive?: boolean;
};

export interface LocationUpdatedRealtimeEvent {
  type: 'location.updated';
  courierId: string;
  taskId: string | null;
  shipmentCode: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
  source: CourierCurrentLocation['source'];
  at: string;
}

@Injectable()
export class LocationsRealtimeGateway implements OnModuleDestroy {
  private readonly logger = new Logger(LocationsRealtimeGateway.name);
  private wsServer: WebSocketServer | null = null;
  private readonly clients = new Set<TrackedWebSocket>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  attach(httpServer: HttpServer): void {
    if (this.wsServer) {
      return;
    }

    this.wsServer = new WebSocketServer({
      server: httpServer,
      path: '/ws/locations',
    });

    this.wsServer.on('connection', (socket: TrackedWebSocket) => {
      socket.isAlive = true;
      this.clients.add(socket);

      socket.on('pong', () => {
        socket.isAlive = true;
      });

      socket.on('close', () => {
        this.clients.delete(socket);
      });

      socket.on('error', (error: Error) => {
        this.logger.warn(`WebSocket client error: ${toErrorMessage(error)}`);
      });
    });

    this.heartbeatInterval = setInterval(() => {
      this.checkClientHeartbeats();
    }, 30000);

    this.logger.log('Location realtime WebSocket is listening on /ws/locations');
  }

  publishLocationUpdated(location: CourierCurrentLocation): void {
    this.broadcast({
      type: 'location.updated',
      courierId: location.courierId,
      taskId: location.taskId,
      shipmentCode: location.shipmentCode,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      capturedAt: location.capturedAt.toISOString(),
      source: location.source,
      at: new Date().toISOString(),
    });
  }

  onModuleDestroy(): void {
    if (!this.wsServer) {
      return;
    }

    for (const socket of this.clients) {
      try {
        socket.close();
      } catch {
        // Ignore close errors during shutdown.
      }
    }

    this.clients.clear();
    this.wsServer.close();
    this.wsServer = null;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private checkClientHeartbeats(): void {
    for (const socket of this.clients) {
      if (socket.isAlive === false) {
        this.clients.delete(socket);
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }

  private broadcast(payload: LocationUpdatedRealtimeEvent): void {
    const rawPayload = JSON.stringify(payload);

    for (const socket of this.clients) {
      if (socket.readyState !== WebSocket.OPEN) {
        continue;
      }

      try {
        socket.send(rawPayload);
      } catch (error) {
        this.logger.warn(
          `Cannot deliver location realtime payload: ${toErrorMessage(error)}`,
        );
      }
    }
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
