import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

import type { Task } from '../domain/entities/task.entity';

export type TaskRealtimeChangeKind =
  | 'created'
  | 'assigned'
  | 'reassigned'
  | 'status_updated';

interface TaskRealtimeSnapshot {
  id: string;
  taskCode: string;
  taskType: string;
  status: string;
  shipmentCode: string | null;
  pickupRequestId: string | null;
  assignedCourierId: string | null;
  updatedAt: string;
}

interface TaskRealtimeChangedEvent {
  type: 'task.changed';
  kind: TaskRealtimeChangeKind;
  at: string;
  task: TaskRealtimeSnapshot;
}

@Injectable()
export class TasksRealtimeGateway implements OnModuleDestroy {
  private readonly logger = new Logger(TasksRealtimeGateway.name);
  private wsServer: WebSocketServer | null = null;
  private readonly clients = new Set<WebSocket>();

  attach(httpServer: HttpServer): void {
    if (this.wsServer) {
      return;
    }

    this.wsServer = new WebSocketServer({
      server: httpServer,
      path: '/ws/tasks',
    });

    this.wsServer.on('connection', (socket: WebSocket) => {
      this.clients.add(socket);

      socket.on('close', () => {
        this.clients.delete(socket);
      });

      socket.on('error', (error: Error) => {
        this.logger.warn(`WebSocket client error: ${this.toErrorMessage(error)}`);
      });
    });

    this.logger.log('Dispatch realtime WebSocket is listening on /ws/tasks');
  }

  publishTaskChanged(kind: TaskRealtimeChangeKind, task: Task): void {
    const payload: TaskRealtimeChangedEvent = {
      type: 'task.changed',
      kind,
      at: new Date().toISOString(),
      task: this.toTaskSnapshot(task),
    };

    this.broadcast(payload);
  }

  onModuleDestroy(): void {
    if (!this.wsServer) {
      return;
    }

    for (const socket of this.clients) {
      try {
        socket.close();
      } catch {
        // ignore close errors while shutting down
      }
    }

    this.clients.clear();
    this.wsServer.close();
    this.wsServer = null;
  }

  private broadcast(payload: TaskRealtimeChangedEvent): void {
    const rawPayload = JSON.stringify(payload);

    for (const socket of this.clients) {
      if (socket.readyState !== WebSocket.OPEN) {
        continue;
      }

      try {
        socket.send(rawPayload);
      } catch (error) {
        this.logger.warn(
          `Cannot deliver realtime payload to WebSocket client: ${this.toErrorMessage(error)}`,
        );
      }
    }
  }

  private toTaskSnapshot(task: Task): TaskRealtimeSnapshot {
    const activeAssignment =
      task.assignments.find((assignment) => assignment.unassignedAt === null) ??
      null;

    return {
      id: task.id,
      taskCode: task.taskCode,
      taskType: task.taskType,
      status: task.status,
      shipmentCode: task.shipmentCode,
      pickupRequestId: task.pickupRequestId,
      assignedCourierId: activeAssignment?.courierId ?? null,
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
