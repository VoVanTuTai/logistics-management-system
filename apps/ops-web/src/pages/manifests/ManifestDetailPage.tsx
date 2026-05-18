import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useAddShipmentMutation,
  useManifestDetailQuery,
  useReceiveHandoverMutation,
  useRemoveShipmentMutation,
  useSealManifestMutation,
} from '../../features/manifests/manifests.api';
import type {
  AddShipmentInput,
  ManifestActionResultDto,
  ReceiveHandoverInput,
  RemoveShipmentInput,
  SealManifestInput,
} from '../../features/manifests/manifests.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatManifestStatusLabel } from '../../utils/logisticsLabels';

import './ManifestDetailPage.css';

/* ─── Status helpers ─── */
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'CREATED': return 'manifest-badge--created';
    case 'SEALED': return 'manifest-badge--sealed';
    case 'RECEIVED': return 'manifest-badge--received';
    case 'CLOSED': return 'manifest-badge--closed';
    default: return 'manifest-badge--default';
  }
}

function canAddShipment(status: string): boolean {
  return status === 'CREATED';
}

function canRemoveShipment(status: string): boolean {
  return status === 'CREATED';
}

function canSeal(status: string): boolean {
  return status === 'CREATED';
}

function canReceive(status: string): boolean {
  return status === 'SEALED';
}

/* ─── Toast ─── */
interface ToastItem {
  id: number;
  type: 'success' | 'error';
  text: string;
}

let toastId = 0;

export function ManifestDetailPage(): React.JSX.Element {
  const { manifestId = '' } = useParams();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const receiverName = session?.user.username ?? 'Ops User';

  const detailQuery = useManifestDetailQuery(accessToken, manifestId);
  const addShipmentMutation = useAddShipmentMutation(accessToken, manifestId);
  const removeShipmentMutation = useRemoveShipmentMutation(accessToken, manifestId);
  const sealMutation = useSealManifestMutation(accessToken, manifestId);
  const receiveMutation = useReceiveHandoverMutation(accessToken, manifestId);

  // Form state
  const [addCode, setAddCode] = useState('');
  const [removeCode, setRemoveCode] = useState('');
  const [sealCode, setSealCode] = useState('');
  const [actionNote, setActionNote] = useState('');

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<'seal' | 'receive' | null>(null);

  // Toast
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: ToastItem['type'], text: string) => {
    toastId += 1;
    const id = toastId;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  const manifest = detailQuery.data;
  const status = manifest?.status ?? '';
  const shipmentCodes = manifest?.shipmentCodes ?? [];
  const shipmentCount = shipmentCodes.length;

  /* ─── Handlers ─── */
  const onAddShipment = async () => {
    const code = addCode.trim().toUpperCase();
    if (!code) { addToast('error', 'Vui lòng nhập mã vận đơn.'); return; }
    if (!canAddShipment(status)) {
      addToast('error', `Chỉ thêm được khi bao đang ở trạng thái "${formatManifestStatusLabel('CREATED')}".`);
      return;
    }
    if (shipmentCodes.includes(code)) {
      addToast('error', `Mã ${code} đã có trong bao.`);
      return;
    }
    try {
      await addShipmentMutation.mutateAsync({ shipmentCode: code, note: actionNote || null });
      addToast('success', `✓ Đã thêm ${code} vào bao.`);
      setAddCode('');
      setActionNote('');
    } catch (error) {
      addToast('error', `Thêm thất bại: ${getErrorMessage(error)}`);
    }
  };

  const onRemoveShipment = async () => {
    const code = removeCode.trim().toUpperCase();
    if (!code) { addToast('error', 'Vui lòng nhập mã vận đơn cần gỡ.'); return; }
    if (!canRemoveShipment(status)) {
      addToast('error', `Chỉ gỡ được khi bao đang ở trạng thái "${formatManifestStatusLabel('CREATED')}".`);
      return;
    }
    try {
      await removeShipmentMutation.mutateAsync({ shipmentCode: code, note: actionNote || null });
      addToast('success', `✓ Đã gỡ ${code} khỏi bao.`);
      setRemoveCode('');
      setActionNote('');
    } catch (error) {
      addToast('error', `Gỡ thất bại: ${getErrorMessage(error)}`);
    }
  };

  const onSealManifest = async () => {
    const code = sealCode.trim().toUpperCase();
    if (!code) { addToast('error', 'Vui lòng nhập mã seal niêm phong.'); return; }
    if (shipmentCount === 0) {
      addToast('error', 'Không thể niêm phong bao trống (0 kiện). Hãy thêm vận đơn trước.');
      return;
    }
    try {
      await sealMutation.mutateAsync({ sealCode: code, note: actionNote || null });
      addToast('success', `✓ Đã niêm phong bao với seal ${code}. Bao chuyển sang trạng thái "Đang luân chuyển".`);
      setSealCode('');
      setActionNote('');
      setConfirmAction(null);
    } catch (error) {
      addToast('error', `Niêm phong thất bại: ${getErrorMessage(error)}`);
    }
  };

  const onReceiveHandover = async () => {
    if (!canReceive(status)) {
      addToast('error', 'Bao chưa ở trạng thái "Đang luân chuyển", không thể nhận bàn giao.');
      return;
    }
    try {
      await receiveMutation.mutateAsync({
        manifestCode: manifest?.manifestCode ?? '',
        receiverName,
        note: actionNote || null,
      });
      addToast('success', `✓ Đã nhận bàn giao bao ${manifest?.manifestCode}. Trạng thái chuyển "Đã đến".`);
      setActionNote('');
      setConfirmAction(null);
    } catch (error) {
      addToast('error', `Nhận bàn giao thất bại: ${getErrorMessage(error)}`);
    }
  };

  /* ─── Loading / Error ─── */
  if (detailQuery.isLoading) {
    return (
      <div className="manifest-detail-page">
        <div className="manifest-loading">
          <div className="manifest-loading__spinner" />
          <span>Đang tải chi tiết bao tải...</span>
        </div>
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="manifest-detail-page">
        <div className="manifest-error-banner">{getErrorMessage(detailQuery.error)}</div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="manifest-detail-page">
        <div className="manifest-error-banner">Không tìm thấy bao tải.</div>
      </div>
    );
  }

  const isAnyLoading =
    addShipmentMutation.isPending ||
    removeShipmentMutation.isPending ||
    sealMutation.isPending ||
    receiveMutation.isPending;

  return (
    <div className="manifest-detail-page">
      {/* ─── Toast ─── */}
      <div className="manifest-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`manifest-toast manifest-toast--${t.type}`}>
            <span>{t.type === 'success' ? '✓' : '✗'}</span>
            <span className="manifest-toast__text">{t.text}</span>
          </div>
        ))}
      </div>

      {/* ─── Back link ─── */}
      <Link to={routePaths.manifests} className="manifest-back-link">
        ← Quay lại danh sách bao tải
      </Link>

      {/* ─── Header Card ─── */}
      <header className="manifest-header-card">
        <div className="manifest-header-card__left">
          <h2 className="manifest-header-card__title">
            <span className="manifest-header-card__icon">📦</span>
            Bao tải {manifest.manifestCode}
          </h2>
          <span className={`manifest-badge ${getStatusBadgeClass(status)}`}>
            {formatManifestStatusLabel(status)}
          </span>
        </div>
        <div className="manifest-header-card__stats">
          <div className="manifest-stat">
            <span className="manifest-stat__value">{shipmentCount}</span>
            <span className="manifest-stat__label">Kiện trong bao</span>
          </div>
          <div className="manifest-stat">
            <span className="manifest-stat__value manifest-stat__value--hub">{manifest.originHubCode ?? '—'}</span>
            <span className="manifest-stat__label">Hub đi</span>
          </div>
          <div className="manifest-stat manifest-stat--arrow">→</div>
          <div className="manifest-stat">
            <span className="manifest-stat__value manifest-stat__value--hub">{manifest.destinationHubCode ?? '—'}</span>
            <span className="manifest-stat__label">Hub đến</span>
          </div>
        </div>
      </header>

      {/* ─── Info row ─── */}
      <div className="manifest-info-row">
        <div className="manifest-info-item">
          <span className="manifest-info-item__label">Niêm phong lúc</span>
          <span className="manifest-info-item__value">{formatDateTime(manifest.sealedAt)}</span>
        </div>
        <div className="manifest-info-item">
          <span className="manifest-info-item__label">Cập nhật lúc</span>
          <span className="manifest-info-item__value">{manifest.updatedAt ? formatDateTime(manifest.updatedAt) : '—'}</span>
        </div>
        <div className="manifest-info-item">
          <span className="manifest-info-item__label">Ghi chú</span>
          <span className="manifest-info-item__value">{manifest.note ?? '—'}</span>
        </div>
      </div>

      {/* ─── Shipment List ─── */}
      <section className="manifest-shipments-card">
        <h3 className="manifest-shipments-card__title">
          Danh sách vận đơn trong bao
          <span className="manifest-shipments-card__count">{shipmentCount}</span>
        </h3>
        {shipmentCount === 0 ? (
          <div className="manifest-shipments-card__empty">
            <span>📋</span>
            <p>Bao trống — chưa có vận đơn nào. Hãy quét thêm vận đơn vào bao.</p>
          </div>
        ) : (
          <div className="manifest-shipments-card__list">
            {shipmentCodes.map((code, idx) => (
              <div key={code} className="manifest-shipment-chip">
                <span className="manifest-shipment-chip__idx">{idx + 1}</span>
                <span className="manifest-shipment-chip__code">{code}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Action Panels ─── */}
      <div className="manifest-actions-grid">
        {/* ── Thêm vận đơn ── */}
        <div className={`manifest-action-card ${!canAddShipment(status) ? 'manifest-action-card--disabled' : ''}`}>
          <div className="manifest-action-card__header manifest-action-card__header--blue">
            <span>📥</span>
            <h4>Đóng bao (Thêm vận đơn)</h4>
          </div>
          {!canAddShipment(status) && (
            <div className="manifest-action-card__blocked">
              Bao đã niêm phong hoặc đã nhận, không thể thêm vận đơn.
            </div>
          )}
          <div className="manifest-action-card__body">
            <input
              type="text"
              className="manifest-input"
              placeholder="Quét/nhập mã vận đơn"
              value={addCode}
              onChange={(e) => setAddCode(e.target.value)}
              disabled={!canAddShipment(status) || isAnyLoading}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void onAddShipment(); } }}
              autoFocus
            />
            <button
              type="button"
              className="manifest-btn manifest-btn--blue"
              disabled={!canAddShipment(status) || isAnyLoading}
              onClick={() => void onAddShipment()}
            >
              {addShipmentMutation.isPending ? 'Đang thêm...' : '+ Thêm vận đơn'}
            </button>
          </div>
        </div>

        {/* ── Gỡ vận đơn ── */}
        <div className={`manifest-action-card ${!canRemoveShipment(status) ? 'manifest-action-card--disabled' : ''}`}>
          <div className="manifest-action-card__header manifest-action-card__header--orange">
            <span>📤</span>
            <h4>Gỡ vận đơn khỏi bao</h4>
          </div>
          {!canRemoveShipment(status) && (
            <div className="manifest-action-card__blocked">
              Chỉ gỡ được khi bao ở trạng thái "Khởi tạo".
            </div>
          )}
          <div className="manifest-action-card__body">
            <input
              type="text"
              className="manifest-input"
              placeholder="Mã vận đơn cần gỡ"
              value={removeCode}
              onChange={(e) => setRemoveCode(e.target.value)}
              disabled={!canRemoveShipment(status) || isAnyLoading}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void onRemoveShipment(); } }}
            />
            <button
              type="button"
              className="manifest-btn manifest-btn--orange"
              disabled={!canRemoveShipment(status) || isAnyLoading}
              onClick={() => void onRemoveShipment()}
            >
              {removeShipmentMutation.isPending ? 'Đang gỡ...' : '− Gỡ vận đơn'}
            </button>
          </div>
        </div>

        {/* ── Niêm phong ── */}
        <div className={`manifest-action-card ${!canSeal(status) ? 'manifest-action-card--disabled' : ''}`}>
          <div className="manifest-action-card__header manifest-action-card__header--purple">
            <span>🔒</span>
            <h4>Niêm phong bao (Đóng bao)</h4>
          </div>
          {!canSeal(status) && (
            <div className="manifest-action-card__blocked">
              Bao đã được niêm phong hoặc đã hoàn tất.
            </div>
          )}
          <div className="manifest-action-card__body">
            <input
              type="text"
              className="manifest-input"
              placeholder="Mã seal niêm phong (bắt buộc)"
              value={sealCode}
              onChange={(e) => setSealCode(e.target.value)}
              disabled={!canSeal(status) || isAnyLoading}
            />
            <button
              type="button"
              className="manifest-btn manifest-btn--purple"
              disabled={!canSeal(status) || isAnyLoading || shipmentCount === 0}
              onClick={() => setConfirmAction('seal')}
            >
              {sealMutation.isPending ? 'Đang niêm phong...' : '🔒 Niêm phong bao'}
            </button>
            {shipmentCount === 0 && canSeal(status) && (
              <small className="manifest-action-card__warning">⚠ Bao đang trống, không thể niêm phong.</small>
            )}
          </div>
        </div>

        {/* ── Nhận bàn giao (Gỡ bao) ── */}
        <div className={`manifest-action-card ${!canReceive(status) ? 'manifest-action-card--disabled' : ''}`}>
          <div className="manifest-action-card__header manifest-action-card__header--green">
            <span>✅</span>
            <h4>Nhận bàn giao (Gỡ bao)</h4>
          </div>
          {!canReceive(status) && (
            <div className="manifest-action-card__blocked">
              {status === 'CREATED'
                ? 'Bao chưa niêm phong, chưa thể nhận bàn giao.'
                : status === 'RECEIVED'
                  ? 'Bao đã được nhận bàn giao rồi.'
                  : 'Bao chưa ở trạng thái hợp lệ để nhận.'}
            </div>
          )}
          <div className="manifest-action-card__body">
            <div className="manifest-input manifest-input--readonly">
              Người nhận: <strong>{receiverName}</strong>
            </div>
            <button
              type="button"
              className="manifest-btn manifest-btn--green"
              disabled={!canReceive(status) || isAnyLoading}
              onClick={() => setConfirmAction('receive')}
            >
              {receiveMutation.isPending ? 'Đang nhận...' : '✅ Xác nhận nhận bàn giao'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Confirm Modal ─── */}
      {confirmAction && (
        <div className="manifest-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="manifest-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="manifest-modal__title">
              {confirmAction === 'seal' ? '🔒 Xác nhận niêm phong bao' : '✅ Xác nhận nhận bàn giao'}
            </h3>
            <div className="manifest-modal__body">
              {confirmAction === 'seal' ? (
                <>
                  <p>Bạn sắp niêm phong bao <strong>{manifest.manifestCode}</strong> với <strong>{shipmentCount} kiện</strong>.</p>
                  <p>Mã seal: <strong>{sealCode || '(chưa nhập)'}</strong></p>
                  <p className="manifest-modal__warning">
                    ⚠ Sau khi niêm phong, không thể thêm/gỡ vận đơn. Hãy kiểm tra kỹ trước khi xác nhận.
                  </p>
                </>
              ) : (
                <>
                  <p>Bạn sắp nhận bàn giao bao <strong>{manifest.manifestCode}</strong>.</p>
                  <p>Hub đi: <strong>{manifest.originHubCode}</strong> → Hub đến: <strong>{manifest.destinationHubCode}</strong></p>
                  <p>Người nhận: <strong>{receiverName}</strong></p>
                  <p className="manifest-modal__warning">
                    ⚠ Xác nhận rằng bao đã đến hub của bạn và kiện hàng nguyên vẹn.
                  </p>
                </>
              )}
              <textarea
                className="manifest-input manifest-input--area"
                placeholder="Ghi chú (không bắt buộc)"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={2}
              />
            </div>
            <div className="manifest-modal__actions">
              <button
                type="button"
                className="manifest-btn manifest-btn--outline"
                onClick={() => setConfirmAction(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`manifest-btn ${confirmAction === 'seal' ? 'manifest-btn--purple' : 'manifest-btn--green'}`}
                disabled={isAnyLoading || (confirmAction === 'seal' && !sealCode.trim())}
                onClick={() => {
                  if (confirmAction === 'seal') void onSealManifest();
                  else void onReceiveHandover();
                }}
              >
                {isAnyLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
