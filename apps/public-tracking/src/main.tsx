import React, { FormEvent, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

interface TrackingCurrentView {
  shipmentCode: string;
  currentStatusCode: string | null;
  currentStatus: string | null;
  currentLocationCode: string | null;
  currentLocationText: string | null;
  lastEventTypeCode: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
}

interface TrackingTimelineView {
  id: string;
  eventTypeCode: string;
  eventType: string;
  eventSource: string;
  locationCode: string | null;
  locationText: string | null;
  statusAfterEventCode: string | null;
  statusAfterEvent: string | null;
  occurredAt: string;
}

interface TrackingResponse {
  shipmentCode: string;
  current: TrackingCurrentView | null;
  timeline: TrackingTimelineView[];
}

interface ApiErrorPayload {
  message?: string;
}

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  at: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';

const FLOW_STEPS = [
  'Tạo đơn',
  'Đã lấy hàng',
  'Đang trung chuyển',
  'Đang giao hàng',
  'Đã giao',
] as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Lỗi không xác định';
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function mapStatusToStep(statusCode: string | null): number {
  if (statusCode === 'DELIVERED') {
    return 4;
  }

  if (statusCode === 'OUT_FOR_DELIVERY' || statusCode === 'DELIVERING') {
    return 3;
  }

  if (
    statusCode === 'IN_TRANSIT' ||
    statusCode === 'INBOUND_AT_HUB' ||
    statusCode === 'OUTBOUND_FROM_HUB' ||
    statusCode === 'MANIFEST_SEALED' ||
    statusCode === 'MANIFEST_RECEIVED' ||
    statusCode === 'SCAN_INBOUND' ||
    statusCode === 'SCAN_OUTBOUND'
  ) {
    return 2;
  }

  if (
    statusCode === 'PICKED_UP' ||
    statusCode === 'PICKUP_ASSIGNED' ||
    statusCode === 'PICKUP_COMPLETED' ||
    statusCode === 'TASK_ASSIGNED'
  ) {
    return 1;
  }

  return 0;
}

function statusTone(statusCode: string | null): 'info' | 'success' | 'warning' | 'danger' {
  if (statusCode === 'DELIVERED') {
    return 'success';
  }

  if (
    statusCode === 'DELIVERY_FAILED' ||
    statusCode === 'RETURNING' ||
    statusCode === 'RETURNED' ||
    statusCode === 'RETURN_STARTED' ||
    statusCode === 'RETURN_COMPLETED' ||
    statusCode === 'CANCELLED'
  ) {
    return 'danger';
  }

  if (statusCode === 'OUT_FOR_DELIVERY' || statusCode === 'DELIVERING') {
    return 'warning';
  }

  return 'info';
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Chưa có';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
}

function buildTimelineItems(response: TrackingResponse): TimelineItem[] {
  return response.timeline
    .map((event) => ({
      id: event.id,
      title: event.eventType,
      description: [
        event.locationText ?? (event.locationCode ? `Vị trí: ${event.locationCode}` : null),
        event.statusAfterEvent ? `Trạng thái sau sự kiện: ${event.statusAfterEvent}` : null,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' • ') || 'Đang xử lý.',
      at: event.occurredAt,
      tone: statusTone(event.statusAfterEventCode),
    }))
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
}

function deriveEtaLabel(current: TrackingCurrentView | null): string {
  if (!current) {
    return 'Chưa có';
  }

  if (current.currentStatusCode === 'DELIVERED') {
    return `Đã giao lúc ${formatDate(current.lastEventAt)}`;
  }

  if (current.currentStatusCode === 'OUT_FOR_DELIVERY' || current.currentStatusCode === 'DELIVERING') {
    return 'Dự kiến giao trong ngày';
  }

  if (
    current.currentStatusCode === 'DELIVERY_FAILED' ||
    current.currentStatusCode === 'RETURNING' ||
    current.currentStatusCode === 'RETURNED'
  ) {
    return 'Đơn hàng đang được xử lý lại';
  }

  return 'Dự kiến giao trong 1-3 ngày';
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const url = `${gatewayBaseUrl}${path}`;
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text.length > 0 ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const maybeError = payload as ApiErrorPayload | null;
    throw new Error(maybeError?.message ?? `Yêu cầu thất bại (${response.status})`);
  }

  return payload as T;
}

function PublicTrackingApp(): React.JSX.Element {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trackingCode = normalizeCode(code);

      if (!trackingCode) {
        throw new Error('Vui lòng nhập mã vận đơn.');
      }

      const detail = await request<TrackingResponse>(
        `/public/tracking/public/track/${encodeURIComponent(trackingCode)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      setTracking(detail);
    } catch (requestError) {
      setTracking(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo(
    () => (tracking ? buildTimelineItems(tracking) : []),
    [tracking],
  );
  const activeStep = mapStatusToStep(tracking?.current?.currentStatusCode ?? null);
  const eta = deriveEtaLabel(tracking?.current ?? null);

  return (
    <main className="tracking-page">
      <section className="tracking-hero">
        <p className="tracking-kicker">Tra cứu vận đơn công khai</p>
        <h1>Theo dõi đơn hàng theo thời gian thực</h1>
        <p>Nhập mã vận đơn để xem trạng thái hiện tại và timeline giao nhận.</p>

        <form className="tracking-form" onSubmit={(event) => { void onSubmit(event); }}>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Ví dụ: SHP260317A1B2C3"
            aria-label="Mã vận đơn"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Đang kiểm tra...' : 'Tra cứu'}
          </button>
        </form>
        {error ? <p className="tracking-error">{error}</p> : null}
      </section>

      {tracking ? (
        <>
          <section className="tracking-progress-card">
            <header>
              <h2>{tracking.shipmentCode}</h2>
              <span className={`status-badge status-${statusTone(tracking.current?.currentStatusCode ?? null)}`}>
                {tracking.current?.currentStatus ?? 'Đang xử lý'}
              </span>
            </header>

            <ol className="tracking-steps" aria-label="Tiến trình vận đơn">
              {FLOW_STEPS.map((step, index) => {
                const stateClass =
                  index < activeStep
                    ? 'done'
                    : index === activeStep
                      ? 'active'
                      : 'todo';

                return (
                  <li key={step} className={`tracking-step tracking-step-${stateClass}`}>
                    <span className="step-dot" />
                    <span className="step-label">{step}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="tracking-grid">
            <article className="tracking-card">
              <h3>Tổng quan hiện tại</h3>
              <dl className="summary-grid">
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{tracking.current?.currentStatus ?? 'Đang xử lý'}</dd>
                </div>
                <div>
                  <dt>Dự kiến giao</dt>
                  <dd>{eta}</dd>
                </div>
                <div>
                  <dt>Vị trí hiện tại</dt>
                  <dd>{tracking.current?.currentLocationText ?? tracking.current?.currentLocationCode ?? 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Cập nhật lúc</dt>
                  <dd>{formatDate(tracking.current?.lastEventAt)}</dd>
                </div>
              </dl>
            </article>

            <article className="tracking-card">
              <h3>Mốc gần nhất</h3>
              <dl className="summary-grid">
                <div>
                  <dt>Sự kiện</dt>
                  <dd>{tracking.current?.lastEventType ?? 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Mã sự kiện</dt>
                  <dd>{tracking.current?.lastEventTypeCode ?? 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Mã vận đơn</dt>
                  <dd>{tracking.shipmentCode}</dd>
                </div>
                <div>
                  <dt>Số mốc timeline</dt>
                  <dd>{tracking.timeline.length}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="tracking-card">
            <h3>Lịch sử sự kiện</h3>
            <div className="tracking-timeline">
              {timeline.length === 0 ? <p>Chưa có timeline.</p> : null}
              {timeline.map((item) => (
                <div key={item.id} className="timeline-item">
                  <span className={`timeline-dot timeline-dot-${item.tone}`} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <small>{formatDate(item.at)}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Không tìm thấy phần tử #root');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <PublicTrackingApp />
  </React.StrictMode>,
);
