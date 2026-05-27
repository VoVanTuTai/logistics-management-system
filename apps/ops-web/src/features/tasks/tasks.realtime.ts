import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { queryKeys } from '../../utils/queryKeys';
import { appEnv } from '../../utils/env';

export type RealtimeConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

interface TaskRealtimeEventPayload {
  type?: string;
}

interface DispatchTasksRealtimeOptions {
  minRefetchIntervalMs?: number;
  initialReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

export function useDispatchTasksRealtime(
  enabled: boolean,
  options: DispatchTasksRealtimeOptions = {},
): RealtimeConnectionStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeConnectionStatus>('idle');

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    if (!appEnv.dispatchTasksWsUrl) {
      setStatus('disconnected');
      return;
    }

    let isClosed = false;
    let reconnectTimeout: number | null = null;
    let refetchTimeout: number | null = null;
    let socket: WebSocket | null = null;
    let reconnectAttempt = 0;
    let lastRefetchAt = 0;
    const minRefetchIntervalMs = options.minRefetchIntervalMs ?? 1500;
    const initialReconnectDelayMs = options.initialReconnectDelayMs ?? 1000;
    const maxReconnectDelayMs = options.maxReconnectDelayMs ?? 30000;

    const refetchActiveQueries = () => {
      if (isClosed) {
        return;
      }

      lastRefetchAt = Date.now();
      refetchTimeout = null;

      void Promise.all([
        queryClient.refetchQueries({
          queryKey: queryKeys.tasks,
          type: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: queryKeys.shipments,
          type: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: queryKeys.pickups,
          type: 'active',
        }),
      ]);
    };

    const scheduleRefetch = () => {
      if (isClosed || refetchTimeout !== null) {
        return;
      }

      const elapsedMs = Date.now() - lastRefetchAt;
      if (elapsedMs >= minRefetchIntervalMs) {
        refetchActiveQueries();
        return;
      }

      refetchTimeout = window.setTimeout(
        refetchActiveQueries,
        minRefetchIntervalMs - elapsedMs,
      );
    };

    const connect = () => {
      if (isClosed) {
        return;
      }

      setStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

      socket = new WebSocket(appEnv.dispatchTasksWsUrl);

      socket.onopen = () => {
        reconnectAttempt = 0;
        setStatus('connected');
      };

      socket.onmessage = (event) => {
        let payload: TaskRealtimeEventPayload | null = null;

        try {
          payload = JSON.parse(event.data) as TaskRealtimeEventPayload;
        } catch {
          payload = null;
        }

        if (payload?.type !== 'task.changed') {
          return;
        }

        scheduleRefetch();
      };

      socket.onerror = () => {
        if (!isClosed) {
          setStatus('disconnected');
        }
      };

      socket.onclose = () => {
        if (isClosed) {
          return;
        }

        reconnectAttempt += 1;
        setStatus('reconnecting');
        const jitterMs = Math.trunc(Math.random() * 250);
        const backoffMs =
          Math.min(
            maxReconnectDelayMs,
            initialReconnectDelayMs * 2 ** (reconnectAttempt - 1),
          ) + jitterMs;

        reconnectTimeout = window.setTimeout(() => {
          connect();
        }, backoffMs);
      };
    };

    connect();

    return () => {
      isClosed = true;

      if (reconnectTimeout !== null) {
        window.clearTimeout(reconnectTimeout);
      }

      if (refetchTimeout !== null) {
        window.clearTimeout(refetchTimeout);
      }

      if (socket) {
        socket.close();
      }
    };
  }, [
    enabled,
    options.initialReconnectDelayMs,
    options.maxReconnectDelayMs,
    options.minRefetchIntervalMs,
    queryClient,
  ]);

  return status;
}

