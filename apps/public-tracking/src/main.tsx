import React, { FormEvent, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
const TruckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>;
const NetworkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 13c0-4.4-3.6-8-8-8s-8 3.6-8 8" /><path d="M21 13h-4" /><path d="M7 13H3" /><path d="M12 5V1" /><path d="m18 19 3 3" /><path d="m6 19-3 3" /><circle cx="12" cy="13" r="3" /><circle cx="12" cy="19" r="2" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.68-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" /></svg>;

interface TrackingCurrentView {
  shipmentCode: string;
  currentStatusCode: string | null;
  currentStatus: string | null;
  currentLocationCode: string | null;
  currentLocationText: string | null;
  lastEventTypeCode: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  updatedAt?: string | null;
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
  note?: string | null;
}

interface PublicContactView {
  name: string | null;
  phone: string | null;
  address: string | null;
  addressDetail: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
  region: string | null;
  hubCode: string | null;
}

interface PublicOrderView {
  code: string;
  statusCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sender: PublicContactView;
  receiver: PublicContactView;
  package: {
    itemType: string | null;
    weightKg: number | null;
    dimensionsCm: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
    declaredValue: number | null;
  };
  serviceType: string | null;
  codAmount: number | null;
  estimatedFee: number | null;
  currency: string | null;
  deliveryNote: string | null;
  source: string | null;
  routing: {
    originHubCode: string | null;
    destinationHubCode: string | null;
  };
}

interface TrackingResponse {
  shipmentCode: string;
  current: TrackingCurrentView | null;
  timeline: TrackingTimelineView[];
  order: PublicOrderView | null;
}

interface ApiErrorPayload {
  message?: string | string[];
}

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  status: string;
  source: string;
  location: string;
  at: string;
}

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';

const FLOW_STEPS = [
  { label: 'Đã nhận hàng', icon: <PackageIcon /> },
  { label: 'Trung chuyển', icon: <TruckIcon /> },
  { label: 'Qua hub', icon: <NetworkIcon /> },
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

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function mapStatusToStep(statusCode: string | null | undefined): number {
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
  return 0;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: number | null | undefined, currency = 'VND'): string {
  if (value === null || value === undefined) return 'Chưa có';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return 'Chưa có';
  return `${new Intl.NumberFormat('vi-VN').format(value)}${suffix}`;
}

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Chưa có';
  return String(value);
}

function buildTimelineItems(response: TrackingResponse): TimelineItem[] {
  return response.timeline
    .map((event) => ({
      id: event.id,
      title: event.eventType,
      description: event.note || event.statusAfterEvent || 'Đang xử lý.',
      status: event.statusAfterEvent ?? 'Chưa có',
      source: event.eventSource,
      location: event.locationText ?? event.locationCode ?? 'Không xác định',
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
    const message = maybeError?.message;
    throw new Error(Array.isArray(message) ? message.join(', ') : message ?? `Yêu cầu thất bại (${response.status})`);
  }

  return payload as T;
}

function statusTone(statusCode: string | null | undefined): string {
  if (statusCode === 'DELIVERED') return 'success';
  if (statusCode === 'DELIVERY_FAILED' || statusCode === 'CANCELLED' || statusCode === 'RETURNED') return 'danger';
  if (statusCode === 'OUT_FOR_DELIVERY' || statusCode === 'DELIVERING') return 'warning';
  return 'info';
}

function PublicTrackingApp(): React.JSX.Element {
  const [code, setCode] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);

  async function onSubmit(event?: FormEvent<HTMLFormElement>): Promise<void> {
    if (event) event.preventDefault();
    setError(null);

    try {
      const trackingCode = normalizeCode(code);
      const phone = normalizePhone(receiverPhone);

      if (!trackingCode) throw new Error('Vui lòng nhập mã vận đơn.');
      if (!phone) throw new Error('Vui lòng nhập số điện thoại người nhận.');

      setLoading(true);
      const params = new URLSearchParams({ receiverPhone: phone });
      const detail = await request<TrackingResponse>(
        `/public/tracking/public/track/${encodeURIComponent(trackingCode)}?${params.toString()}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
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

  const timeline = useMemo(() => (tracking ? buildTimelineItems(tracking) : []), [tracking]);
  const activeStep = mapStatusToStep(tracking?.current?.currentStatusCode ?? tracking?.order?.statusCode);
  const progress = activeStep === FLOW_STEPS.length - 1
    ? '100%'
    : `${(activeStep / (FLOW_STEPS.length - 1)) * 100}%`;
  const order = tracking?.order ?? null;
  const currency = order?.currency ?? 'VND';

  return (
    <>
      <nav className="navbar">
        <a href="/" className="brand-logo">NEXUS</a>
        <div className="nav-links">
          <a href="#" className="active">Tra cứu</a>
          <a href="#">Hỗ trợ</a>
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Public tracking</p>
            <h1>Tra cứu hành trình đơn hàng</h1>
            <p>Nhập mã vận đơn và số điện thoại người nhận để xem thông tin đơn, trạng thái hiện tại và toàn bộ timeline vận chuyển.</p>
          </div>

          <form className="lookup-panel" onSubmit={(event) => { void onSubmit(event); }}>
            <label>
              <span>Mã vận đơn</span>
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Ví dụ: 111000000001"
                autoComplete="off"
              />
            </label>
            <label>
              <span>Số điện thoại người nhận</span>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(event) => setReceiverPhone(event.target.value)}
                placeholder="Ví dụ: 0919000001"
                autoComplete="tel"
              />
            </label>
            <button type="submit" disabled={loading}>
              <SearchIcon />
              {loading ? 'Đang tra cứu' : 'Tra cứu'}
            </button>
            <div className="privacy-note">
              <ShieldIcon />
              <span>Thông tin hành trình chỉ hiển thị khi mã vận đơn khớp với SĐT người nhận.</span>
            </div>
          </form>
        </section>

        {error ? <p className="message message--error">{error}</p> : null}

        {tracking ? (
          <>
            <section className="summary-card">
              <div className="tracking-header">
                <div>
                  <span className="section-label">Mã vận đơn</span>
                  <h2>{tracking.shipmentCode}</h2>
                </div>
                <span className={`status-pill status-pill--${statusTone(tracking.current?.currentStatusCode ?? order?.statusCode)}`}>
                  {tracking.current?.currentStatus ?? order?.statusCode ?? 'Đang xử lý'}
                </span>
              </div>

              <div className="stepper-container">
                <div className="stepper-line-bg" />
                <div className="stepper-line-fill" style={{ width: progress }} />
                <div className="stepper">
                  {FLOW_STEPS.map((step, index) => {
                    const stateClass = index < activeStep ? 'done' : index === activeStep ? 'active' : '';
                    return (
                      <div key={step.label} className={`step ${stateClass}`}>
                        <div className="step-icon">{step.icon}</div>
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="metric-grid">
                <InfoItem label="Vị trí hiện tại" value={tracking.current?.currentLocationText ?? tracking.current?.currentLocationCode} />
                <InfoItem label="Sự kiện cuối" value={tracking.current?.lastEventType} />
                <InfoItem label="Thời điểm cập nhật" value={formatDate(tracking.current?.lastEventAt ?? tracking.current?.updatedAt)} />
                <InfoItem label="Dịch vụ" value={order?.serviceType} />
              </div>
            </section>

            <section className="details-grid">
              <article className="panel">
                <PanelHeader title="Người gửi" icon={<PackageIcon />} />
                <InfoList
                  items={[
                    ['Tên', order?.sender.name],
                    ['Số điện thoại', order?.sender.phone],
                    ['Địa chỉ', joinAddress(order?.sender)],
                    ['Hub gửi', order?.sender.hubCode ?? order?.routing.originHubCode],
                  ]}
                />
              </article>

              <article className="panel">
                <PanelHeader title="Người nhận" icon={<MapPinIcon />} />
                <InfoList
                  items={[
                    ['Tên', order?.receiver.name],
                    ['Số điện thoại', order?.receiver.phone],
                    ['Địa chỉ', joinAddress(order?.receiver)],
                    ['Hub nhận', order?.receiver.hubCode ?? order?.routing.destinationHubCode],
                  ]}
                />
              </article>

              <article className="panel">
                <PanelHeader title="Hàng hóa" icon={<PackageIcon />} />
                <InfoList
                  items={[
                    ['Loại hàng', order?.package.itemType],
                    ['Khối lượng', formatNumber(order?.package.weightKg, ' kg')],
                    ['Kích thước', formatDimensions(order)],
                    ['Giá trị khai báo', formatCurrency(order?.package.declaredValue, currency)],
                  ]}
                />
              </article>

              <article className="panel">
                <PanelHeader title="Thanh toán & đơn hàng" icon={<NetworkIcon />} />
                <InfoList
                  items={[
                    ['COD', formatCurrency(order?.codAmount, currency)],
                    ['Phí dự kiến', formatCurrency(order?.estimatedFee, currency)],
                    ['Ngày tạo', formatDate(order?.createdAt)],
                    ['Ghi chú giao hàng', order?.deliveryNote],
                  ]}
                />
              </article>
            </section>

            <section className="panel timeline-panel">
              <PanelHeader title="Toàn bộ hành trình" icon={<TruckIcon />} />
              {timeline.length === 0 ? (
                <p className="empty">Chưa có dữ liệu sự kiện.</p>
              ) : (
                <div className="timeline-table-wrap">
                  <table className="timeline-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Sự kiện</th>
                        <th>Trạng thái</th>
                        <th>Vị trí</th>
                        <th>Nguồn</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.at)}</td>
                          <td><strong>{item.title}</strong></td>
                          <td>{item.status}</td>
                          <td>{item.location}</td>
                          <td>{item.source}</td>
                          <td>{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="empty-state">
            <img
              src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=1200&auto=format&fit=crop"
              alt="NEXUS logistics operation"
            />
            <div>
              <span className="section-label">NEXUS Express</span>
              <h2>Sẵn sàng tra cứu đơn hàng</h2>
              <p>Thông tin đơn hàng, người gửi, người nhận, hàng hóa, COD và lịch sử vận chuyển sẽ hiển thị tại đây sau khi xác thực thành công.</p>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <strong>NEXUS Logistics</strong>
        <span>&copy; {new Date().getFullYear()} Tracking Portal</span>
      </footer>
    </>
  );
}

function PanelHeader({ title, icon }: { title: string; icon: React.ReactNode }): React.JSX.Element {
  return (
    <div className="panel-header">
      <span>{icon}</span>
      <h3>{title}</h3>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number | null | undefined }): React.JSX.Element {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{display(value)}</strong>
    </div>
  );
}

function InfoList({ items }: { items: Array<[string, string | number | null | undefined]> }): React.JSX.Element {
  return (
    <dl className="info-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{display(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function joinAddress(contact: PublicContactView | null | undefined): string | null {
  if (!contact) return null;
  return [
    contact.addressDetail,
    contact.address,
    contact.ward,
    contact.district,
    contact.province,
    contact.region,
  ].filter(Boolean).join(', ') || null;
}

function formatDimensions(order: PublicOrderView | null): string {
  const dimensions = order?.package.dimensionsCm;
  if (!dimensions) return 'Chưa có';
  const { length, width, height } = dimensions;
  if (length === null && width === null && height === null) return 'Chưa có';
  return `${display(length)} x ${display(width)} x ${display(height)} cm`;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Không tìm thấy phần tử #root');
createRoot(rootElement).render(<React.StrictMode><PublicTrackingApp /></React.StrictMode>);
