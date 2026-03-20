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
  'Created',
  'Picked Up',
  'In Transit',
  'Out For Delivery',
  'Delivered',
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

  return 'Unknown error';
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
      title: 'Shipment Created',
      description: `Shipment ${shipment.code} was created in system.`,
      at: shipment.createdAt,
      tone: 'info',
    },
  ];

  if (shipment.updatedAt !== shipment.createdAt) {
    items.push({
      id: `${shipment.code}-updated`,
      title: 'Status Updated',
      description: `Current status changed to ${shipment.currentStatus}.`,
      at: shipment.updatedAt,
      tone: statusTone(shipment.currentStatus),
    });
  }

  if (shipment.cancellationReason) {
    items.push({
      id: `${shipment.code}-cancelled`,
      title: 'Shipment Cancelled',
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
    return `Delivered at ${formatDate(updatedAt)}`;
  }

  if (status === 'OUT_FOR_DELIVERY') {
    return 'Expected today';
  }

  if (['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'CANCELLED'].includes(status)) {
    return 'Delivery exception';
  }

  return 'Expected in 1-3 days';
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D+/g, '');
  if (digits.length < 6) {
    return 'Hidden';
  }

  return `${digits.slice(0, 3)}***${digits.slice(-3)}`;
}

function maskName(value: string): string {
  if (!value) {
    return 'Hidden';
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
    throw new Error(maybeError?.message ?? `Request failed (${response.status})`);
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
        throw new Error('Tracking code is required.');
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
  const receiverRegion = asString(receiver?.region) || 'N/A';
  const eta = shipment ? deriveEtaLabel(shipment.currentStatus, shipment.updatedAt) : 'N/A';

  return (
    <main className="tracking-page">
      <section className="tracking-hero">
        <p className="tracking-kicker">Public Tracking</p>
        <h1>Track Shipment In Real Time</h1>
        <p>Enter shipment code to view status, ETA, and event timeline.</p>

        <form className="tracking-form" onSubmit={onSubmit}>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Example: SHP260317A1B2C3"
            aria-label="Tracking code"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Track'}
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

            <ol className="tracking-steps" aria-label="Shipment progress">
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
              <h3>Current Summary</h3>
              <dl className="summary-grid">
                <div>
                  <dt>Status</dt>
                  <dd>{shipment.currentStatus}</dd>
                </div>
                <div>
                  <dt>ETA</dt>
                  <dd>{eta}</dd>
                </div>
                <div>
                  <dt>Current Region</dt>
                  <dd>{receiverRegion}</dd>
                </div>
                <div>
                  <dt>Updated At</dt>
                  <dd>{formatDate(shipment.updatedAt)}</dd>
                </div>
              </dl>
            </article>

            <article className="tracking-card">
              <h3>Receiver (masked)</h3>
              <dl className="summary-grid">
                <div>
                  <dt>Name</dt>
                  <dd>{receiverName}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{receiverPhone}</dd>
                </div>
                <div>
                  <dt>Created At</dt>
                  <dd>{formatDate(shipment.createdAt)}</dd>
                </div>
                <div>
                  <dt>Cancellation</dt>
                  <dd>{shipment.cancellationReason ?? 'N/A'}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="tracking-card">
            <h3>Timeline</h3>
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
  throw new Error('Missing #root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <PublicTrackingApp />
  </React.StrictMode>,
);
