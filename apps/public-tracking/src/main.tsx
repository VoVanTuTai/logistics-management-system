import React, { FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';

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

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
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

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
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

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>Public Tracking</p>
        <h1 style={styles.title}>Track your shipment</h1>
        <p style={styles.subtitle}>
          Enter shipment code to view current status and shipment timeline.
        </p>
      </section>

      <section style={styles.panel}>
        <form style={styles.form} onSubmit={onSubmit}>
          <input
            style={styles.input}
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Example: SHP260317A1B2C3"
            aria-label="Tracking code"
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Track'}
          </button>
        </form>
        {error ? <p style={styles.error}>{error}</p> : null}
      </section>

      {shipment ? (
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Shipment detail</h2>
          <dl style={styles.detailGrid}>
            <div>
              <dt style={styles.detailLabel}>Code</dt>
              <dd style={styles.detailValue}>{shipment.code}</dd>
            </div>
            <div>
              <dt style={styles.detailLabel}>Current status</dt>
              <dd style={styles.detailValue}>{shipment.currentStatus}</dd>
            </div>
            <div>
              <dt style={styles.detailLabel}>Created at</dt>
              <dd style={styles.detailValue}>{formatDate(shipment.createdAt)}</dd>
            </div>
            <div>
              <dt style={styles.detailLabel}>Updated at</dt>
              <dd style={styles.detailValue}>{formatDate(shipment.updatedAt)}</dd>
            </div>
            <div>
              <dt style={styles.detailLabel}>Cancellation reason</dt>
              <dd style={styles.detailValue}>
                {shipment.cancellationReason ?? 'N/A'}
              </dd>
            </div>
          </dl>
          <details style={styles.rawBlock}>
            <summary style={styles.rawSummary}>Raw payload</summary>
            <pre style={styles.pre}>{JSON.stringify(shipment, null, 2)}</pre>
          </details>
        </section>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    margin: 0,
    padding: '40px 16px 56px',
    fontFamily: '"Trebuchet MS", "Verdana", sans-serif',
    color: '#132038',
    background:
      'radial-gradient(circle at 10% 10%, #d7f4ff 0, #d7f4ff 15%, transparent 50%), radial-gradient(circle at 95% 0%, #ffe6c7 0, #ffe6c7 18%, transparent 55%), linear-gradient(160deg, #f7fbff 0%, #e6efff 45%, #fdf8ef 100%)',
    display: 'grid',
    justifyContent: 'center',
    gap: 18,
  },
  hero: {
    width: 'min(860px, 100%)',
    borderRadius: 20,
    padding: '24px 22px',
    background: 'linear-gradient(120deg, #102a43, #254f77)',
    color: '#f8fbff',
    boxShadow: '0 14px 30px rgba(19, 32, 56, 0.28)',
  },
  badge: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  title: {
    margin: '10px 0 8px',
    fontSize: 34,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: 0,
    maxWidth: 520,
    opacity: 0.92,
  },
  panel: {
    width: 'min(860px, 100%)',
    borderRadius: 20,
    padding: 18,
    background: 'rgba(255, 255, 255, 0.88)',
    border: '1px solid rgba(16, 42, 67, 0.14)',
    boxShadow: '0 10px 22px rgba(37, 79, 119, 0.18)',
    backdropFilter: 'blur(6px)',
  },
  form: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '1fr auto',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #8ca9c9',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 15,
    outlineColor: '#2f6ea3',
  },
  button: {
    border: 0,
    borderRadius: 12,
    padding: '12px 22px',
    background: 'linear-gradient(120deg, #2f6ea3, #1f4f76)',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    margin: '12px 0 0',
    color: '#a4161a',
    fontWeight: 700,
  },
  sectionTitle: {
    margin: '0 0 14px',
    fontSize: 22,
  },
  detailGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    margin: 0,
  },
  detailLabel: {
    margin: 0,
    color: '#395a7a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    margin: '6px 0 0',
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  rawBlock: {
    marginTop: 16,
  },
  rawSummary: {
    fontWeight: 700,
    cursor: 'pointer',
  },
  pre: {
    marginTop: 10,
    background: '#102a43',
    color: '#e3f2fd',
    borderRadius: 12,
    padding: 12,
    overflowX: 'auto',
    fontSize: 12,
  },
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <PublicTrackingApp />
  </React.StrictMode>,
);
