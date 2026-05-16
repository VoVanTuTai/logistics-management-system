import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  useInboundScanMutation,
  useOutboundScanMutation,
  usePickupScanMutation,
} from '../../features/scans/scans.api';
import type {
  HubScanInput,
  HubScanResultDto,
  HubScanType,
} from '../../features/scans/scans.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { createIdempotencyKey } from '../../utils/idempotency';
import { formatScanTypeLabel } from '../../utils/logisticsLabels';

import './HubScanPage.css';

/* ─── Audio helpers ─── */
const audioCtxRef: { current: AudioContext | null } = { current: null };

function getAudioCtx(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  return audioCtxRef.current;
}

function playBeep(type: 'success' | 'error') {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.18;

    if (type === 'success') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.frequency.value = 300;
      osc.type = 'square';
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Audio context may not be available
  }
}

/* ─── Scan history ─── */
interface ScanHistoryItem {
  id: string;
  shipmentCode: string;
  scanType: HubScanType;
  locationCode: string;
  timestamp: string;
  result: HubScanResultDto;
  isNew: boolean;
}

/* ─── Toast model ─── */
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

let toastIdCounter = 0;

export function HubScanPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = session?.user.hubCodes ?? [];
  const defaultLocationCode = assignedHubCodes[0] ?? '';

  const pickupMutation = usePickupScanMutation(accessToken);
  const inboundMutation = useInboundScanMutation(accessToken);
  const outboundMutation = useOutboundScanMutation(accessToken);

  const [scanType, setScanType] = useState<HubScanType>('INBOUND');
  const [shipmentCode, setShipmentCode] = useState('');
  const [locationCode, setLocationCode] = useState(defaultLocationCode);
  const [note, setNote] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const shipmentInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus shipment code input on mount & after each scan
  useEffect(() => {
    shipmentInputRef.current?.focus();
  }, []);

  const focusShipmentInput = useCallback(() => {
    setTimeout(() => {
      shipmentInputRef.current?.focus();
      shipmentInputRef.current?.select();
    }, 80);
  }, []);

  // Remove "isNew" highlight after fade-out animation
  useEffect(() => {
    const newItems = scanHistory.filter((item) => item.isNew);
    if (newItems.length === 0) return;

    const timer = setTimeout(() => {
      setScanHistory((prev) =>
        prev.map((item) => (item.isNew ? { ...item, isNew: false } : item)),
      );
    }, 2200);

    return () => clearTimeout(timer);
  }, [scanHistory]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);

    return () => clearTimeout(timer);
  }, [toasts]);

  const addToast = useCallback((type: ToastMessage['type'], text: string) => {
    toastIdCounter += 1;
    const id = `toast-${toastIdCounter}`;
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const isSubmitting =
    pickupMutation.isPending || inboundMutation.isPending || outboundMutation.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCode = shipmentCode.trim().toUpperCase();
    const trimmedLocation = locationCode.trim();

    if (!trimmedCode) {
      addToast('error', 'Vui lòng nhập mã vận đơn.');
      playBeep('error');
      focusShipmentInput();
      return;
    }

    if (!trimmedLocation) {
      addToast('error', 'Vui lòng nhập mã vị trí Hub.');
      playBeep('error');
      return;
    }

    const payload: HubScanInput = {
      shipmentCode: trimmedCode,
      locationCode: trimmedLocation,
      note: note.trim() || null,
      scanType,
      idempotencyKey: createIdempotencyKey('ops-scan'),
    };

    try {
      let result: HubScanResultDto;

      if (scanType === 'PICKUP') {
        result = await pickupMutation.mutateAsync(payload);
      } else if (scanType === 'INBOUND') {
        result = await inboundMutation.mutateAsync(payload);
      } else {
        result = await outboundMutation.mutateAsync(payload);
      }

      const newItem: ScanHistoryItem = {
        id: `${trimmedCode}-${Date.now()}`,
        shipmentCode: trimmedCode,
        scanType,
        locationCode: trimmedLocation,
        timestamp: new Date().toISOString(),
        result,
        isNew: true,
      };

      setScanHistory((prev) => [newItem, ...prev]);
      setShipmentCode('');
      setNote('');
      addToast('success', `✓ ${formatScanTypeLabel(scanType)} mã ${trimmedCode} thành công.`);
      playBeep('success');
      focusShipmentInput();
    } catch (error) {
      const msg = getErrorMessage(error);
      addToast('error', `✗ Quét thất bại mã ${trimmedCode}: ${msg}`);
      playBeep('error');
      focusShipmentInput();
    }
  };

  const totalScanned = scanHistory.length;
  const scanTypeLabel = formatScanTypeLabel(scanType);

  return (
    <div className="hub-scan-page">
      {/* ─── Toast Container ─── */}
      <div className="hub-scan-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`hub-scan-toast hub-scan-toast--${toast.type}`}>
            <span className="hub-scan-toast__icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span className="hub-scan-toast__text">{toast.text}</span>
            <button
              type="button"
              className="hub-scan-toast__close"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ─── Header ─── */}
      <header className="hub-scan-header">
        <div className="hub-scan-header__info">
          <h2 className="hub-scan-header__title">
            <svg viewBox="0 0 24 24" className="hub-scan-header__icon" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M7 8h2v8H7zM10 8h1v8h-1zM12 8h2v8h-2zM15 8h1v8h-1zM17 8h1v8h-1z" fill="currentColor"/>
            </svg>
            Vận hành quét Hub
          </h2>
          <p className="hub-scan-header__desc">
            Quét mã vận đơn để ghi nhận {scanTypeLabel.toLowerCase()}. Mỗi lần quét sẽ cập nhật vị trí và trạng thái đơn hàng.
          </p>
        </div>
        <div className="hub-scan-header__stats">
          <div className="hub-scan-stat">
            <span className="hub-scan-stat__value">{totalScanned}</span>
            <span className="hub-scan-stat__label">Đã quét phiên này</span>
          </div>
          <div className="hub-scan-stat hub-scan-stat--mode">
            <span className="hub-scan-stat__value">{scanTypeLabel}</span>
            <span className="hub-scan-stat__label">Chế độ quét</span>
          </div>
        </div>
      </header>

      {/* ─── Scan Form ─── */}
      <form className="hub-scan-form" onSubmit={(e) => void onSubmit(e)} autoComplete="off">
        <div className="hub-scan-form__row hub-scan-form__row--top">
          <div className="hub-scan-form__group hub-scan-form__group--type">
            <label className="hub-scan-form__label">Loại quét</label>
            <div className="hub-scan-type-selector">
              {(['PICKUP', 'INBOUND', 'OUTBOUND'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`hub-scan-type-btn ${scanType === type ? 'hub-scan-type-btn--active' : ''}`}
                  onClick={() => setScanType(type)}
                >
                  <span className="hub-scan-type-btn__icon">
                    {type === 'PICKUP' ? '📦' : type === 'INBOUND' ? '📥' : '📤'}
                  </span>
                  {formatScanTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hub-scan-form__row hub-scan-form__row--main">
          <div className="hub-scan-form__group hub-scan-form__group--code">
            <label className="hub-scan-form__label" htmlFor="shipmentCodeInput">
              Mã vận đơn <span className="hub-scan-form__required">*</span>
            </label>
            <div className="hub-scan-input-wrap hub-scan-input-wrap--primary">
              <svg viewBox="0 0 24 24" className="hub-scan-input-wrap__icon" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 8h2v8H7zM10 8h1v8h-1zM12 8h2v8h-2zM15 8h1v8h-1zM17 8h1v8h-1z" fill="currentColor" opacity="0.5"/>
              </svg>
              <input
                id="shipmentCodeInput"
                ref={shipmentInputRef}
                type="text"
                className="hub-scan-input hub-scan-input--lg"
                placeholder="Quét hoặc nhập mã vận đơn rồi Enter"
                value={shipmentCode}
                onChange={(e) => setShipmentCode(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              {isSubmitting && <span className="hub-scan-input-wrap__spinner" />}
            </div>
          </div>

          <div className="hub-scan-form__group hub-scan-form__group--location">
            <label className="hub-scan-form__label" htmlFor="locationCodeInput">
              Mã vị trí Hub <span className="hub-scan-form__required">*</span>
            </label>
            <input
              id="locationCodeInput"
              type="text"
              className="hub-scan-input"
              placeholder="VD: HUB-HCM-001"
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="hub-scan-form__group hub-scan-form__group--note">
            <label className="hub-scan-form__label" htmlFor="scanNote">Ghi chú</label>
            <input
              id="scanNote"
              type="text"
              className="hub-scan-input"
              placeholder="Ghi chú (không bắt buộc)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="hub-scan-form__group hub-scan-form__group--submit">
            <label className="hub-scan-form__label">&nbsp;</label>
            <button
              type="submit"
              className="hub-scan-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="hub-scan-submit-btn__spinner" />
                  Đang quét...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Gửi quét
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ─── Scan History ─── */}
      <section className="hub-scan-history">
        <div className="hub-scan-history__header">
          <h3 className="hub-scan-history__title">
            Lịch sử quét phiên hiện tại
            {totalScanned > 0 && (
              <span className="hub-scan-history__count">{totalScanned}</span>
            )}
          </h3>
          {totalScanned > 0 && (
            <button
              type="button"
              className="hub-scan-history__clear"
              onClick={() => setScanHistory([])}
            >
              Xóa lịch sử
            </button>
          )}
        </div>

        {scanHistory.length === 0 ? (
          <div className="hub-scan-history__empty">
            <svg viewBox="0 0 24 24" className="hub-scan-history__empty-icon" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 8h2v8H7zM10 8h1v8h-1zM12 8h2v8h-2zM15 8h1v8h-1zM17 8h1v8h-1z" fill="currentColor" opacity="0.2"/>
            </svg>
            <p>Chưa có kết quả quét nào. Hãy quét mã vận đơn ở form phía trên.</p>
          </div>
        ) : (
          <div className="hub-scan-history__list">
            {scanHistory.map((item) => (
              <div
                key={item.id}
                className={`hub-scan-history__item ${item.isNew ? 'hub-scan-history__item--new' : ''}`}
              >
                <div className="hub-scan-history__item-badge">
                  <span className={`hub-scan-badge hub-scan-badge--${item.scanType.toLowerCase()}`}>
                    {formatScanTypeLabel(item.scanType)}
                  </span>
                </div>
                <div className="hub-scan-history__item-info">
                  <span className="hub-scan-history__item-code">{item.shipmentCode}</span>
                  <span className="hub-scan-history__item-meta">
                    Tại {item.locationCode} · {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <div className="hub-scan-history__item-status">
                  <span className="hub-scan-history__item-ok">✓ Thành công</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
