import React, { FormEvent, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

interface ShipmentResponse {
  code: string;
  currentStatus: string;
  metadata: Record<string, unknown> | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
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
  'Tao don',
  'Da lay hang',
  'Dang van chuyen',
  'Dang giao hang',
  'Da giao',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Loi khong xac dinh';
}

function mapStatusToStep(status: string): number {
  if (status === 'DELIVERED') {
    return 4;
  }

  if (['OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPT', 'DELIVERY_FAILED', 'NDR_CREATED'].includes(status)) {
    return 3;
  }

  if (['SCAN_INBOUND', 'SCAN_OUTBOUND', 'MANIFEST_SEALED', 'MANIFEST_RECEIVED', 'IN_TRANSIT'].includes(status)) {
    return 2;
  }

  if (['PICKUP_COMPLETED', 'TASK_ASSIGNED'].includes(status)) {
    return 1;
  }

  return 0;
}

function statusTone(status: string): 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'DELIVERED') {
    return 'success';
  }

  if (['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'CANCELLED'].includes(status)) {
    return 'danger';
  }

  if (['OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPT'].includes(status)) {
    return 'warning';
  }

  return 'info';
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function buildTimeline(shipment: ShipmentResponse): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      id: `${shipment.code}-created`,
      title: 'Don hang duoc tao',
      description: `Van don ${shipment.code} da duoc tao tren he thong.`,
      at: shipment.createdAt,
      tone: 'info',
    },
  ];

  if (shipment.updatedAt !== shipment.createdAt) {
    items.push({
      id: `${shipment.code}-updated`,
      title: 'Cap nhat trang thai',
      description: `Trang thai hien tai da doi sang ${shipment.currentStatus}.`,
      at: shipment.updatedAt,
      tone: statusTone(shipment.currentStatus),
    });
  }

  if (shipment.cancellationReason) {
    items.push({
      id: `${shipment.code}-cancelled`,
      title: 'Van don bi huy',
      description: shipment.cancellationReason,
      at: shipment.updatedAt,
      tone: 'danger',
    });
  }

  return items.sort((left, right) =>
    new Date(right.at).getTime() - new Date(left.at).getTime(),
  );
}

function deriveEtaLabel(status: string, updatedAt: string): string {
  if (status === 'DELIVERED') {
    return `Da giao luc ${formatDate(updatedAt)}`;
  }

  if (status === 'OUT_FOR_DELIVERY') {
    return 'Du kien giao trong ngay';
  }

  if (['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'CANCELLED'].includes(status)) {
    return 'Don hang dang gap su co giao';
  }

  return 'Du kien giao trong 1-3 ngay';
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D+/g, '');
  if (digits.length < 6) {
    return 'Da an';
  }

  return `${digits.slice(0, 3)}***${digits.slice(-3)}`;
}

function maskName(value: string): string {
  if (!value) {
    return 'Da an';
  }

  if (value.length <= 2) {
    return `${value[0]}*`;
  }

  return `${value[0]}${'*'.repeat(Math.max(value.length - 2, 1))}${value[value.length - 1]}`;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const url = `${gatewayBaseUrl}${path}`;
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text.length > 0 ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const maybeError = payload as ApiErrorPayload | null;
    throw new Error(maybeError?.message ?? `Yeu cau that bai (${response.status})`);
  }

  return payload as T;
}

function PublicTrackingApp(): React.JSX.Element {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trackingCode = code.trim().toUpperCase();

      if (!trackingCode) {
        throw new Error('Vui long nhap ma van don.');
      }

      const detail = await request<ShipmentResponse>(
        `/public/shipment/shipments/${encodeURIComponent(trackingCode)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      setShipment(detail);
    } catch (requestError) {
      setShipment(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo(() => (shipment ? buildTimeline(shipment) : []), [shipment]);
  const activeStep = shipment ? mapStatusToStep(shipment.currentStatus) : 0;
  const metadata = useMemo(() => asRecord(shipment?.metadata), [shipment?.metadata]);
  const receiver = useMemo(() => asRecord(metadata?.receiver), [metadata]);
  const receiverName = maskName(asString(receiver?.name));
  const receiverPhone = maskPhone(asString(receiver?.phone));
  const receiverRegion = asString(receiver?.region) || 'Chua co';
  const eta = shipment ? deriveEtaLabel(shipment.currentStatus, shipment.updatedAt) : 'Chua co';

  return (
    <main className="tracking-page">
      <section className="tracking-hero">
        <p className="tracking-kicker">Theo doi van don cong khai</p>
        <h1>Theo doi van don theo thoi gian thuc</h1>
        <p>Nhap ma van don de xem trang thai, du kien giao va lich su su kien.</p>

        <form className="tracking-form" onSubmit={onSubmit}>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Vi du: SHP260317A1B2C3"
            aria-label="Ma van don"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Dang kiem tra...' : 'Tra cuu'}
          </button>
        </form>
        {error ? <p className="tracking-error">{error}</p> : null}
      </section>

      {shipment ? (
        <>
          <section className="tracking-progress-card">
            <header>
              <h2>{shipment.code}</h2>
              <span className={`status-badge status-${statusTone(shipment.currentStatus)}`}>
                {shipment.currentStatus}
              </span>
            </header>

            <ol className="tracking-steps" aria-label="Tien trinh van don">
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
              <h3>Tong quan hien tai</h3>
              <dl className="summary-grid">
                <div>
                  <dt>Trang thai</dt>
                  <dd>{shipment.currentStatus}</dd>
                </div>
                <div>
                  <dt>Du kien giao</dt>
                  <dd>{eta}</dd>
                </div>
                <div>
                  <dt>Khu vuc hien tai</dt>
                  <dd>{receiverRegion}</dd>
                </div>
                <div>
                  <dt>Cap nhat luc</dt>
                  <dd>{formatDate(shipment.updatedAt)}</dd>
                </div>
              </dl>
            </article>

            <article className="tracking-card">
              <h3>Nguoi nhan (da an thong tin)</h3>
              <dl className="summary-grid">
                <div>
                  <dt>Ten</dt>
                  <dd>{receiverName}</dd>
                </div>
                <div>
                  <dt>So dien thoai</dt>
                  <dd>{receiverPhone}</dd>
                </div>
                <div>
                  <dt>Tao luc</dt>
                  <dd>{formatDate(shipment.createdAt)}</dd>
                </div>
                <div>
                  <dt>Ly do huy</dt>
                  <dd>{shipment.cancellationReason ?? 'Khong co'}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="tracking-card">
            <h3>Lich su su kien</h3>
            <div className="tracking-timeline">
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
  throw new Error('Khong tim thay phan tu #root');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <PublicTrackingApp />
  </React.StrictMode>,
);
