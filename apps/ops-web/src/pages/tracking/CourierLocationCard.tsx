import React, { useCallback, useEffect, useRef, useState } from 'react';

import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { appEnv } from '../../utils/env';
import { CourierLocationMap, type LocationHistorySample } from './CourierLocationMap';

const AUTO_REFRESH_INTERVAL_MS = 30_000;

interface CourierGpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
  source: string;
  courierId?: string | null;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export function CourierLocationCard({
  shipmentCode,
}: {
  shipmentCode: string;
}): React.JSX.Element | null {
  const accessToken = useAuthStore(
    (state) => state.session?.tokens.accessToken ?? null,
  );
  const [position, setPosition] = useState<CourierGpsPosition | null>(null);
  const [history, setHistory] = useState<LocationHistorySample[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPosition = useCallback(async () => {
    if (!accessToken || !shipmentCode) {
      return;
    }

    try {
      setLoadState((prev) => (prev === 'ready' ? prev : 'loading'));
      const result = await opsApiClient.request<CourierGpsPosition>(
        opsEndpoints.scans.latestPosition(shipmentCode),
        { accessToken },
      );

      if (
        result &&
        typeof result.latitude === 'number' &&
        typeof result.longitude === 'number'
      ) {
        setPosition(result);
        setLoadState('ready');
        setErrorMessage(null);
      } else {
        setPosition(null);
        setLoadState('empty');
      }
    } catch (error) {
      // 404 means no GPS data yet — that's normal, not an error.
      if (isNotFoundError(error)) {
        setPosition(null);
        setLoadState('empty');
        return;
      }

      setLoadState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Không lấy được vị trí GPS.',
      );
    }
  }, [accessToken, shipmentCode]);

  const fetchHistory = useCallback(async () => {
    if (!accessToken || !shipmentCode) {
      return;
    }

    try {
      const result = await opsApiClient.request<LocationHistorySample[]>(
        opsEndpoints.scans.history(shipmentCode),
        { accessToken },
      );

      if (Array.isArray(result)) {
        setHistory(result);
      }
    } catch (error) {
      console.warn('Failed to fetch location history:', error);
    }
  }, [accessToken, shipmentCode]);

  useEffect(() => {
    void fetchPosition();
    void fetchHistory();

    intervalRef.current = setInterval(() => {
      void fetchPosition();
      void fetchHistory();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchPosition, fetchHistory]);

  // WebSocket subscription for realtime updates
  useEffect(() => {
    if (!accessToken || !shipmentCode) {
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectWs = () => {
      try {
        const wsUrl = new URL(appEnv.locationsWsUrl);
        wsUrl.searchParams.set('token', accessToken);

        ws = new WebSocket(wsUrl.toString());

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'location.updated') {
              if (
                payload.shipmentCode === shipmentCode ||
                (position && payload.courierId === position.courierId)
              ) {
                const newPos: CourierGpsPosition = {
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                  accuracy: payload.accuracy,
                  capturedAt: payload.capturedAt,
                  source: payload.source,
                  courierId: payload.courierId,
                };
                setPosition(newPos);
                setLoadState('ready');
                setErrorMessage(null);

                setHistory((prev) => {
                  if (prev.some((h) => h.capturedAt === payload.capturedAt)) {
                    return prev;
                  }
                  return [
                    ...prev,
                    {
                      latitude: payload.latitude,
                      longitude: payload.longitude,
                      capturedAt: payload.capturedAt,
                    },
                  ];
                });
              }
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        console.warn('Failed to connect to WS:', err);
      }
    };

    connectWs();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [accessToken, shipmentCode, position]);

  if (loadState === 'idle' || loadState === 'loading') {
    return (
      <article style={styles.card}>
        <h3 style={styles.heading}>📍 Vị trí GPS gần nhất</h3>
        <p style={styles.loadingText}>Đang tải vị trí...</p>
      </article>
    );
  }

  if (loadState === 'empty') {
    return (
      <article style={styles.card}>
        <h3 style={styles.heading}>📍 Vị trí GPS gần nhất</h3>
        <p style={styles.emptyText}>Chưa có dữ liệu GPS cho vận đơn này.</p>
      </article>
    );
  }

  if (loadState === 'error') {
    return (
      <article style={styles.card}>
        <h3 style={styles.heading}>📍 Vị trí GPS gần nhất</h3>
        <p style={styles.errorText}>{errorMessage}</p>
        <button type="button" style={styles.retryButton} onClick={() => { void fetchPosition(); void fetchHistory(); }}>
          Thử lại
        </button>
      </article>
    );
  }

  if (!position) {
    return null;
  }

  return (
    <article style={styles.card}>
      <div style={styles.headerRow}>
        <h3 style={styles.heading}>📍 Vị trí GPS gần nhất</h3>
        <span style={styles.liveBadge}>
          <span style={styles.liveDot} />
          LIVE
        </span>
      </div>
      <div style={styles.grid}>
        <div style={styles.field}>
          <span style={styles.label}>Tọa độ</span>
          <span style={styles.value}>
            {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
          </span>
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Độ chính xác</span>
          <span style={styles.value}>
            {position.accuracy !== null ? `±${position.accuracy}m` : 'Không rõ'}
          </span>
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Cập nhật lúc</span>
          <span style={styles.value}>{formatDateTime(position.capturedAt)}</span>
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Nguồn</span>
          <span style={styles.value}>{position.source}</span>
        </div>
        {position.courierId ? (
          <div style={styles.field}>
            <span style={styles.label}>Courier</span>
            <span style={styles.value}>{position.courierId}</span>
          </div>
        ) : null}
      </div>

      <CourierLocationMap
        latitude={position.latitude}
        longitude={position.longitude}
        courierId={position.courierId}
        history={history}
      />

      <p style={styles.autoRefreshNote}>Tự cập nhật realtime và định kỳ mỗi 30 giây</p>
    </article>
  );
}

function isNotFoundError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status: number }).status === 404
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: '1px solid #e7ebf8',
    borderLeft: '3px solid #047857',
    borderRadius: 12,
    padding: 12,
    maxWidth: 720,
    marginBottom: 12,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heading: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 800,
    color: '#047857',
    letterSpacing: '0.05em',
  },
  liveDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#047857',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 8,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 500,
  },
  value: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0f172a',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    margin: '4px 0 0',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    margin: '4px 0 0',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    margin: '4px 0 0',
  },
  retryButton: {
    marginTop: 8,
    padding: '4px 12px',
    fontSize: 13,
    border: '1px solid #e7ebf8',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    color: '#0f172a',
  },
  autoRefreshNote: {
    marginTop: 8,
    marginBottom: 0,
    fontSize: 11,
    color: '#94a3b8',
  },
};
