import React, { FormEvent, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

// SVGs
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const TruckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const NetworkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 13c0-4.4-3.6-8-8-8s-8 3.6-8 8"/><path d="M21 13h-4"/><path d="M7 13H3"/><path d="M12 5V1"/><path d="m18 19 3 3"/><path d="m6 19-3 3"/><circle cx="12" cy="13" r="3"/><circle cx="12" cy="19" r="2"/></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
const AppleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04c-.06.27-.18.53-.35.75-.48.6-1.14.98-1.89 1.1-.06-.27-.18-.53-.35-.75-.48-.6-1.14-.98-1.89-1.1.84-.13 1.63.15 2.21.73.58.57.86 1.36.73 2.21 1.05-.18 2.01-.73 2.67-1.55.57-.73.84-1.63.75-2.55zM15.4 10.4c-.65-.48-1.42-.75-2.2-.75-1.04 0-2.03.41-2.77 1.15-.74.74-1.15 1.73-1.15 2.77s.41 2.03 1.15 2.77c.74.74 1.73 1.15 2.77 1.15.78 0 1.55-.27 2.2-.75 1.04.78 2.37.95 3.58.46-1.22-.5-2.55-1.58-3.58-2.61v-.02c.7-.7.98-1.72.75-2.68z"/></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l15-9L5 3z"/></svg>;
const QrCodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>;
const LightningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;

// Interfaces
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
}

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';

const FLOW_STEPS = [
  { label: 'Đã nhận hàng', icon: <PackageIcon /> },
  { label: 'Đang trung chuyển', icon: <TruckIcon /> },
  { label: 'Đến trạm chia', icon: <NetworkIcon /> },
  { label: 'Đang giao', icon: <MapPinIcon /> },
  { label: 'Hoàn tất', icon: <CheckCircleIcon /> },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Lỗi không xác định';
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function mapStatusToStep(statusCode: string | null): number {
  if (statusCode === 'DELIVERED') return 4;
  if (statusCode === 'OUT_FOR_DELIVERY' || statusCode === 'DELIVERING') return 3;
  if (
    statusCode === 'INBOUND_AT_HUB' ||
    statusCode === 'OUTBOUND_FROM_HUB' ||
    statusCode === 'MANIFEST_SEALED' ||
    statusCode === 'MANIFEST_RECEIVED' ||
    statusCode === 'MANIFEST_UNSEALED' ||
    statusCode === 'SCAN_INBOUND' ||
    statusCode === 'SCAN_OUTBOUND'
  ) return 2;
  if (statusCode === 'IN_TRANSIT' || statusCode === 'SEND_GOODS') return 1;
  if (
    statusCode === 'PICKED_UP' ||
    statusCode === 'PICKUP_ASSIGNED' ||
    statusCode === 'PICKUP_COMPLETED' ||
    statusCode === 'TASK_ASSIGNED'
  ) return 0;
  return 0;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()} Th${date.getMonth() + 1}, ${date.getFullYear()}`;
}

function buildTimelineItems(response: TrackingResponse): TimelineItem[] {
  return response.timeline
    .map((event) => ({
      id: event.id,
      title: event.eventType,
      description: [
        event.locationText ?? (event.locationCode ? `Vị trí: ${event.locationCode}` : null),
        event.statusAfterEvent ? `Trạng thái: ${event.statusAfterEvent}` : null,
      ].filter((value): value is string => Boolean(value)).join(' • ') || 'Đang xử lý.',
      at: event.occurredAt,
    }))
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
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
  const [code, setCode] = useState('NX-8829-5510-VN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);

  async function onSubmit(event?: FormEvent<HTMLFormElement>): Promise<void> {
    if (event) event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trackingCode = normalizeCode(code);
      if (!trackingCode) throw new Error('Vui lòng nhập mã vận đơn.');
      const detail = await request<TrackingResponse>(`/public/tracking/public/track/${encodeURIComponent(trackingCode)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      setTracking(detail);
    } catch (requestError) {
      setTracking(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo(() => (tracking ? buildTimelineItems(tracking) : []), [tracking]);
  const activeStep = mapStatusToStep(tracking?.current?.currentStatusCode ?? null);

  const calculateProgress = () => {
    if (activeStep === 0) return '0%';
    if (activeStep === FLOW_STEPS.length - 1) return '100%';
    return `${(activeStep / (FLOW_STEPS.length - 1)) * 100}%`;
  };

  // Mock locations for UI fidelity with the screenshot
  const origin = "TP. Hồ Chí Minh, VN";
  const destination = "Hà Nội, VN";
  const etaDate = tracking?.current?.lastEventAt ? formatShortDate(tracking.current.lastEventAt) : "24 Th12, 2024";

  return (
    <>
      <nav className="navbar">
        <a href="/" className="brand-logo">NEXUS</a>
        <div className="nav-links">
          <a href="#" className="active">Tracking</a>
          <a href="#">Support</a>
        </div>
        <button className="nav-btn">Download App</button>
      </nav>

      <main className="container">
        <section className="hero">
          <div className="hero-content">
            <h1>Theo dõi đơn hàng <span>NEXUS</span> của bạn</h1>
            <form className="search-bar" onSubmit={(e) => { void onSubmit(e); }}>
              <div className="search-icon"><SearchIcon /></div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: SHP260317A1B2C3"
              />
              <button type="submit" disabled={loading}>TRA CỨU</button>
            </form>
            {error && <p style={{ color: '#fff', marginTop: '12px', background: 'rgba(239,68,68,0.9)', display: 'inline-block', padding: '4px 12px', borderRadius: '4px' }}>{error}</p>}
          </div>
        </section>

        {tracking && (
          <>
            <section className="card">
              <div className="tracking-header">
                <div>
                  <div className="tracking-id-label">TRACKING ID</div>
                  <div className="tracking-id">{tracking.shipmentCode}</div>
                </div>
                <div className="status-pill">{tracking.current?.currentStatus ?? 'Đang xử lý'}</div>
              </div>

              <div className="stepper-container">
                <div className="stepper-line-bg" />
                <div className="stepper-line-fill" style={{ width: calculateProgress() }} />
                <div className="stepper">
                  {FLOW_STEPS.map((step, index) => {
                    const stateClass = index < activeStep ? 'done' : index === activeStep ? 'active' : '';
                    return (
                      <div key={step.label} className={`step ${stateClass}`}>
                        <div className="step-icon">
                          {step.icon}
                        </div>
                        <span className="step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="destination-row">
                <div className="location-block">
                  <div className="loc-icon"><MapPinIcon /></div>
                  <div className="loc-text">
                    <div className="label">TỪ</div>
                    <div className="value">{origin}</div>
                  </div>
                </div>
                
                <div className="location-block">
                  <div className="loc-icon"><MapPinIcon /></div>
                  <div className="loc-text">
                    <div className="label">ĐẾN</div>
                    <div className="value">{destination}</div>
                  </div>
                </div>

                <div className="eta-block">
                  <div className="eta-text">
                    <div className="label">DỰ KIẾN GIAO</div>
                    <div className="value">{etaDate}</div>
                  </div>
                  <CalendarIcon />
                </div>
              </div>
            </section>

            <div className="grid-2">
              <section className="card timeline-card">
                <h3>Chi tiết hành trình</h3>
                <div className="timeline">
                  {timeline.length === 0 && <p className="tl-time">Chưa có dữ liệu sự kiện.</p>}
                  {timeline.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <div className="tl-dot" />
                      <div className="tl-title">{item.title}</div>
                      <div className="tl-time">{formatDate(item.at)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card van-card">
                <img 
                  src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=1475&auto=format&fit=crop" 
                  alt="NEXUS Delivery Van" 
                  className="van-img" 
                />
                <div className="van-badge">
                  <SendIcon /> NEXUS Global Network
                </div>
              </section>
            </div>
          </>
        )}

        <section className="promo">
          <svg className="promo-bg-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <div className="promo-content">
            <h2>Trải nghiệm mượt mà hơn - Tải ngay ứng dụng NEXUS Logistics!</h2>
            <p>Nhận thông báo tức thời, theo dõi thời gian thực và quản lý tất cả đơn hàng Logistics chỉ trong một chạm.</p>
            <div className="promo-btns">
              <a href="#" className="store-btn">
                <span className="icon"><AppleIcon /></span>
                <span className="texts">
                  <span className="small">TẢI TRÊN</span>
                  <span className="large">App Store</span>
                </span>
              </a>
              <a href="#" className="store-btn">
                <span className="icon"><PlayIcon /></span>
                <span className="texts">
                  <span className="small">TẢI TRÊN</span>
                  <span className="large">Google Play</span>
                </span>
              </a>
            </div>
          </div>
          
          <div className="promo-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1601972602237-8e60f08610ea?q=80&w=1287&auto=format&fit=crop" 
              alt="NEXUS App" 
              className="phone-mockup" 
            />
            <div className="qr-float">
              <QrCodeIcon />
            </div>
          </div>
        </section>

      </main>

      <footer className="footer">
        <div className="footer-brand">NEXUS</div>
        <div className="footer-links">
          <a href="#" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</a>
          <a href="#" style={{textDecoration: 'none', color: 'inherit'}}>Terms of Service</a>
          <a href="#" style={{textDecoration: 'none', color: 'inherit'}}>Contact</a>
        </div>
        <div>&copy; {new Date().getFullYear()} NEXUS Logistics. All rights reserved.</div>
      </footer>
    </>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Không tìm thấy phần tử #root');
createRoot(rootElement).render(<React.StrictMode><PublicTrackingApp /></React.StrictMode>);
