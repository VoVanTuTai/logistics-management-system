import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { queryKeys } from '../../utils/queryKeys';
import { appEnv } from '../../utils/env';

type RealtimeConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

interface TaskRealtimeEventPayload {
  type?: string;
}

export function useDispatchTasksRealtime(
  enabled: boolean,
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
    let socket: WebSocket | null = null;
    let reconnectAttempt = 0;

    const connect = () => {
      if (isClosed) {
        return;
      }

      setStatus('connecting');

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

        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks,
        });
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

        setStatus('disconnected');
        reconnectAttempt += 1;
        const backoffMs = Math.min(10000, 1000 * 2 ** (reconnectAttempt - 1));

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

      if (socket) {
        socket.close();
      }
    };
  }, [enabled, queryClient]);

  return status;
}

