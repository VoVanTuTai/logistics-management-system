import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  ScanBarcode,
  Lock,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react';

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
import { shipmentsClient } from '../../features/shipments/shipments.client';
import { useHubsQuery } from '../../features/masterdata/masterdata.hooks';
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

function playBeep(type: 'success' | 'error' | 'misrouted') {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.2;

    if (type === 'success') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'misrouted') {
      // 2-tone alarm buzzer: frequency ramp down from 700Hz to 260Hz for misrouted sorting
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.45);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
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
  isMisrouted?: boolean;
  targetHubCode?: string;
  targetHubName?: string;
}

/* ─── Misrouted Alert Model ─── */
interface MisroutedAlertData {
  shipmentCode: string;
  destinationHubCode: string;
  destinationHubName: string;
  currentHubCode: string;
  receiverAddress?: string;
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
  const isSystemAdmin = (session?.user.roles ?? []).some(
    (r) => r === 'SYSTEM_ADMIN' || r === 'HQ_OPS' || r === 'HQ_MANAGER',
  );
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean),
    [session?.user.hubCodes],
  );

  // Load official hubs list and scope to user permissions
  const hubsQuery = useHubsQuery(accessToken, {});
  const availableHubs = useMemo(() => {
    const rawList =
      hubsQuery.data && hubsQuery.data.length > 0
        ? hubsQuery.data
        : [
            { code: 'HCM-001', name: 'Bưu cục Tân Bình / TP.HCM' },
            { code: '07913W001', name: 'Bưu cục Phường 13 - Tân Bình' },
            { code: '07901W001', name: 'Bưu cục Phường Bến Thành / Q1' },
            { code: '003079B001', name: 'Kho Tỉnh TP. Hồ Chí Minh' },
            { code: 'HN-001', name: 'Bưu cục Đống Đa / Hà Nội' },
            { code: '00101W001', name: 'Bưu cục Tràng Tiền / Hoàn Kiếm' },
            { code: '001001B001', name: 'Kho Tỉnh Hà Nội' },
            { code: 'DN-001', name: 'Bưu cục Hải Châu / Đà Nẵng' },
          ];

    if (!isSystemAdmin && assignedHubCodes.length > 0) {
      const allowedSet = new Set(assignedHubCodes);
      const filtered = rawList.filter((h) => allowedSet.has(h.code.trim().toUpperCase()));
      if (filtered.length > 0) return filtered;
      return assignedHubCodes.map((code) => ({ code, name: `Bưu cục ${code}` }));
    }

    return rawList;
  }, [hubsQuery.data, isSystemAdmin, assignedHubCodes]);

  const availableHubsMap = useMemo(() => {
    const map = new Map<string, string>();
    availableHubs.forEach((h) => map.set(h.code.toUpperCase(), h.name));
    return map;
  }, [availableHubs]);

  const defaultLocationCode = useMemo(() => {
    if (assignedHubCodes.length > 0) return assignedHubCodes[0];
    if (availableHubs.length > 0) return availableHubs[0].code;
    return 'HCM-001';
  }, [assignedHubCodes, availableHubs]);

  const pickupMutation = usePickupScanMutation(accessToken);
  const inboundMutation = useInboundScanMutation(accessToken);
  const outboundMutation = useOutboundScanMutation(accessToken);

  const [scanType, setScanType] = useState<HubScanType>('INBOUND');
  const [shipmentCode, setShipmentCode] = useState('');
  const [locationCode, setLocationCode] = useState(defaultLocationCode);
  const [note, setNote] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [misroutedAlert, setMisroutedAlert] = useState<MisroutedAlertData | null>(null);

  const shipmentInputRef = useRef<HTMLInputElement>(null);

  // Sync default locationCode when availableHubs loaded
  useEffect(() => {
    if (availableHubs.length > 0 && (!locationCode || !availableHubs.some((h) => h.code === locationCode))) {
      setLocationCode(defaultLocationCode);
    }
  }, [availableHubs, defaultLocationCode, locationCode]);

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
      addToast('error', 'Vui lòng chọn bưu cục quét.');
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
      // ─── 1. Kiểm tra Bắn Nhầm Tuyến / Sai Đích Đến (Misrouted Sorting Detection) ───
      let isMisrouted = false;
      let targetHubCode = '';
      let targetHubName = '';
      let receiverAddr = '';

      if (scanType === 'INBOUND') {
        try {
          const listRes = await shipmentsClient.listPage(accessToken, {
            shipmentCode: trimmedCode,
            limit: 1,
          });
          const matchedShipment =
            listRes.items.find((s) => s.shipmentCode.toUpperCase() === trimmedCode) ||
            listRes.items[0];

          if (matchedShipment) {
            targetHubCode = (
              matchedShipment.destinationHubCode ||
              matchedShipment.receiverHubCode ||
              ''
            ).trim().toUpperCase();
            receiverAddr = matchedShipment.receiverAddress || '';

            if (targetHubCode && targetHubCode !== trimmedLocation.toUpperCase()) {
              isMisrouted = true;
              targetHubName = availableHubsMap.get(targetHubCode) || targetHubCode;
            }
          }
        } catch {
          // Gracefully continue with scan
        }
      }

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
        isMisrouted,
        targetHubCode: isMisrouted ? targetHubCode : undefined,
        targetHubName: isMisrouted ? targetHubName : undefined,
      };

      setScanHistory((prev) => [newItem, ...prev]);
      setShipmentCode('');
      setNote('');

      if (isMisrouted) {
        playBeep('misrouted');
        setMisroutedAlert({
          shipmentCode: trimmedCode,
          destinationHubCode: targetHubCode,
          destinationHubName: targetHubName,
          currentHubCode: trimmedLocation,
          receiverAddress: receiverAddr,
        });
        addToast(
          'error',
          `Cảnh báo phân loại: Đơn ${trimmedCode} có đích phát là [${targetHubCode}], khác bưu cục hiện tại [${trimmedLocation}]!`,
        );
      } else {
        playBeep('success');
        addToast('success', `Đã ghi nhận ${formatScanTypeLabel(scanType).toLowerCase()} mã ${trimmedCode}.`);
      }
      focusShipmentInput();
    } catch (error) {
      const msg = getErrorMessage(error);
      addToast('error', `Quét thất bại mã ${trimmedCode}: ${msg}`);
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
              {toast.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : toast.type === 'error' ? (
                <AlertCircle size={16} />
              ) : (
                <Info size={16} />
              )}
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
            <ScanBarcode size={24} className="hub-scan-header__icon" aria-hidden="true" />
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

      {/* ─── Misrouted Sorting Alarm Banner ─── */}
      {misroutedAlert && (
        <div className="hub-scan-misrouted-banner" role="alert">
          <div className="hub-scan-misrouted-banner__icon">
            <AlertTriangle size={24} />
          </div>
          <div className="hub-scan-misrouted-banner__content">
            <div className="hub-scan-misrouted-banner__title">
              Cảnh báo phân loại: Sai đích đến của kiện hàng
            </div>
            <div className="hub-scan-misrouted-banner__desc">
              Kiện hàng <strong>{misroutedAlert.shipmentCode}</strong> có bưu cục đích phát là{' '}
              <span className="hub-scan-misrouted-target">
                {misroutedAlert.destinationHubCode} ({misroutedAlert.destinationHubName})
              </span>
              {misroutedAlert.receiverAddress ? ` [Địa chỉ: ${misroutedAlert.receiverAddress}]` : ''},
              nhưng đang quét INBOUND tại bưu cục sở tại <strong>{misroutedAlert.currentHubCode}</strong>!
            </div>
            <div className="hub-scan-misrouted-banner__action">
              <strong>Chỉ dẫn nghiệp vụ:</strong> Vui lòng tách riêng kiện hàng này sang lồng hàng chuyển tiếp, <strong>không xếp vào kệ phát</strong> của bưu tá bưu cục này!
            </div>
          </div>
          <button
            type="button"
            className="hub-scan-misrouted-banner__dismiss"
            onClick={() => setMisroutedAlert(null)}
            title="Đóng cảnh báo"
          >
            ×
          </button>
        </div>
      )}

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
                    {type === 'PICKUP' ? (
                      <Package size={15} />
                    ) : type === 'INBOUND' ? (
                      <ArrowDownToLine size={15} />
                    ) : (
                      <ArrowUpFromLine size={15} />
                    )}
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
              Bưu cục quét <span className="hub-scan-form__required">*</span>
            </label>
            {!isSystemAdmin && assignedHubCodes.length <= 1 ? (
              <div className="hub-scan-location-locked">
                <Lock size={13} className="hub-scan-location-locked__icon" aria-hidden="true" />
                <span className="hub-scan-location-locked__code">{locationCode}</span>
                <span className="hub-scan-location-locked__name">
                  {availableHubsMap.get(locationCode) || 'Bưu cục sở tại'}
                </span>
              </div>
            ) : (
              <select
                id="locationCodeInput"
                className="hub-scan-input hub-scan-select"
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                disabled={isSubmitting}
              >
                {availableHubs.map((h) => (
                  <option key={h.code} value={h.code}>
                    {h.code} - {h.name}
                  </option>
                ))}
              </select>
            )}
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
                  <ArrowRight size={16} aria-hidden="true" />
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
            <ScanBarcode size={36} className="hub-scan-history__empty-icon" strokeWidth={1.5} aria-hidden="true" />
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
                  {item.isMisrouted && (
                    <span className="hub-scan-badge hub-scan-badge--misrouted" style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={11} /> Sai đích ({item.targetHubCode})
                    </span>
                  )}
                </div>
                <div className="hub-scan-history__item-info">
                  <span className="hub-scan-history__item-code">{item.shipmentCode}</span>
                  <span className="hub-scan-history__item-meta">
                    Tại {item.locationCode} · {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <div className="hub-scan-history__item-status">
                  <span className="hub-scan-history__item-ok">Thành công</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
