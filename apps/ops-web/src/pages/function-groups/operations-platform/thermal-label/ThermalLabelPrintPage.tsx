import React, { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useDeleteManifestMutation, useGenerateBagCodesMutation, useManifestsQuery } from '../../../../features/manifests/manifests.hooks';
import {
  openBagLabelBatchPrint,
  type BagLabelPrintPayload,
  type BagTransportMethod,
} from '../../../../printing/bagLabelPrint';
import { useAuthStore } from '../../../../store/authStore';
import { useUiStore } from '../../../../store/uiStore';
import { formatDateTime } from '../../../../utils/format';
import './ThermalLabelPrintPage.css';

const MAX_PREVIEW_LABELS = 30;

interface BagLabelPreviewItem extends BagLabelPrintPayload {
  id?: string;
  shipmentCount?: number;
  createdAtRaw?: string | null;
  qrPreviewSrc: string | null;
}

export function ThermalLabelPrintPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const showToast = useUiStore((state) => state.showToast);
  const accessToken = session?.tokens.accessToken ?? null;
  const hubsQuery = useHubsQuery(accessToken, {});
  const generateMutation = useGenerateBagCodesMutation(accessToken);
  const deleteMutation = useDeleteManifestMutation(accessToken);
  const originHubCode = normalizeHubCode(session?.user.hubCodes?.[0] ?? '');
  const manifestsQuery = useManifestsQuery(accessToken);

  const [quantityInput, setQuantityInput] = useState('1');
  const [destinationHubCode, setDestinationHubCode] = useState('');
  const [transportMethod, setTransportMethod] = useState<BagTransportMethod>('T');
  const [lastCreatedItems, setLastCreatedItems] = useState<BagLabelPreviewItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrItem, setActiveQrItem] = useState<BagLabelPreviewItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<BagLabelPreviewItem | null>(null);

  const destinationHubOptions = useMemo(
    () =>
      (hubsQuery.data ?? [])
        .filter((hub) => hub.isActive && normalizeHubCode(hub.code) !== originHubCode)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [hubsQuery.data, originHubCode],
  );

  const realManifests = useMemo(() => {
    if (!manifestsQuery.data) return [];
    const createdLabels = manifestsQuery.data
      .filter((m) => m.status === 'CREATED' && normalizeHubCode(m.originHubCode || '') === originHubCode)
      .map((m) => ({
        id: m.id,
        bagCode: m.manifestCode,
        originHubCode: m.originHubCode || 'HUB-NA',
        destinationHubCode: m.destinationHubCode || 'HUB-NA',
        status: m.status,
        shipmentCount: m.shipmentCount ?? 0,
        createdAtRaw: m.createdAt ?? null,
        createdAtText: m.createdAt ? formatDateTime(m.createdAt) : '',
        transportMethod: 'T' as BagTransportMethod, // Default if not stored
        qrPreviewSrc: buildQrPreviewSrc(m.manifestCode),
      }));

    return dedupeByBagCode(createdLabels);
  }, [manifestsQuery.data, originHubCode]);

  const arrivedLabelsAtOrigin = useMemo(() => {
    return (manifestsQuery.data ?? []).filter(
      (m) => m.status === 'RECEIVED' && normalizeHubCode(m.originHubCode || '') === originHubCode,
    ).length;
  }, [manifestsQuery.data, originHubCode]);

  const allItems = useMemo(() => {
    return [...realManifests].sort((a, b) => {
      const byCreatedAt = getDateSortValue(b.createdAtRaw ?? b.createdAtText) - getDateSortValue(a.createdAtRaw ?? a.createdAtText);
      if (byCreatedAt !== 0) {
        return byCreatedAt;
      }
      return b.bagCode.localeCompare(a.bagCode);
    });
  }, [realManifests]);

  useEffect(() => {
    if (!destinationHubCode && destinationHubOptions.length > 0) {
      setDestinationHubCode(normalizeHubCode(destinationHubOptions[0].code));
    }
  }, [destinationHubCode, destinationHubOptions]);

  const onCreateLabelsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void createLabels({ printAfterCreate: false });
  };

  const onPrintLastCreated = () => {
    if (lastCreatedItems.length === 0) {
      setFormError('Chưa có lô tem vừa tạo để in hàng loạt.');
      setNotice(null);
      return;
    }

    const opened = openBagLabelBatchPrint(lastCreatedItems);
    if (!opened) {
      setFormError('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.');
      setNotice(null);
      return;
    }

    setFormError(null);
    setNotice(`Đã mở cửa sổ in ${lastCreatedItems.length} tem bao vừa tạo.`);
  };

  const createLabels = async ({ printAfterCreate }: { printAfterCreate: boolean }) => {
    const quantity = Number.parseInt(quantityInput, 10);
    if (!destinationHubCode || !Number.isFinite(quantity) || quantity < 1 || quantity > MAX_PREVIEW_LABELS) {
      setFormError(
        `Vui lòng nhập đủ thông tin. Số lượng hợp lệ: 1-${MAX_PREVIEW_LABELS}, cần có mã hub đến.`
      );
      setNotice(null);
      return;
    }

    try {
      setFormError(null);
      setNotice('Đang tạo tem bao trên hệ thống...');
      
      const response = await generateMutation.mutateAsync({
        originHubCode,
        destinationHubCode,
        quantity,
        note: `Created from print page - Method ${transportMethod}`,
      });

      const nextPreviewItems = response.map((item) => ({
        id: item.id,
        bagCode: item.manifestCode,
        originHubCode: item.originHubCode ?? 'HUB-NA',
        destinationHubCode: item.destinationHubCode ?? 'HUB-NA',
        status: item.status,
        shipmentCount: item.shipmentCount ?? 0,
        createdAtRaw: item.createdAt ?? null,
        createdAtText: item.createdAt ? formatDateTime(item.createdAt) : formatDateTime(new Date().toISOString()),
        transportMethod: transportMethod,
        qrPreviewSrc: buildQrPreviewSrc(item.manifestCode),
      }));

      const uniqueItems = dedupeByBagCode(nextPreviewItems);
      setLastCreatedItems(uniqueItems);

      if (uniqueItems.length !== nextPreviewItems.length) {
        setFormError('Hệ thống trả về mã tem bao bị trùng. Chỉ hiển thị các mã duy nhất, vui lòng kiểm tra lại trước khi in.');
        setNotice(null);
        return;
      }

      if (printAfterCreate) {
        const opened = openBagLabelBatchPrint(uniqueItems);
        if (!opened) {
          setFormError('Đã tạo tem nhưng trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi in lại lô vừa tạo.');
          setNotice(null);
          return;
        }
      }

      setNotice(
        printAfterCreate
          ? `Thành công! Đã tạo và mở cửa sổ in ${uniqueItems.length} tem bao.`
          : `Thành công! Đã tạo ${uniqueItems.length} tem bao trên hệ thống.`,
      );
    } catch (err) {
      setFormError('Lỗi khi tạo tem bao trên hệ thống. Vui lòng thử lại sau.');
      setNotice(null);
    }
  };

  const onDeleteLabel = (bagCode: string) => {
    const item = allItems.find((i) => i.bagCode === bagCode);
    if (!item) {
      return;
    }
    setDeleteCandidate(item);
  };

  const closeDeleteConfirm = () => {
    setDeleteCandidate(null);
  };

  const confirmDeleteLabel = async () => {
    if (!deleteCandidate) {
      return;
    }

    const bagCode = deleteCandidate.bagCode;
    const manifestId = deleteCandidate.id;
    if (!manifestId) {
      setDeleteCandidate(null);
      return;
    }

    try {
      setFormError(null);
      setNotice(`Đang xóa tem bao ${bagCode}...`);
      setDeleteCandidate(null);
      await deleteMutation.mutateAsync(manifestId);
      setNotice(`Đã xóa tem bao ${bagCode}.`);
    } catch (err) {
      setFormError(`Lỗi khi xóa tem bao ${bagCode}.`);
      setNotice(null);
    }
  };

  const openQrModal = (item: BagLabelPreviewItem) => {
    setActiveQrItem(item);
    setQrModalOpen(true);
  };

  const closeQrModal = () => {
    setQrModalOpen(false);
    setActiveQrItem(null);
  };

  const onPrintSingle = (item: BagLabelPreviewItem) => {
    const opened = openBagLabelBatchPrint([item]);
    if (!opened) {
      showToast('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.', 'error');
    }
  };

  return (
    <section className="ops-thermal-print">
      <header className="ops-thermal-print__header">
        <small>THERMAL_LABEL_PRINT</small>
        <h2>In tem bao</h2>
        <p>
          Chọn số lượng n tem, hub đến và phương thức vận chuyển để tạo một lô tem duy nhất
          trên hệ thống. Tem đã có thao tác hàng đến không xuất hiện trong danh sách sử dụng lại.
        </p>
      </header>

      <div className="ops-thermal-print__layout">
        <article className="ops-thermal-print__form-card">
          <h3>Thông tin in</h3>
          <form onSubmit={onCreateLabelsSubmit} className="ops-thermal-print__form">
            <label className="ops-thermal-print__field">
              <span>Hub đi</span>
              <input type="text" value={originHubCode || 'CHƯA_GÁN_HUB'} disabled />
            </label>

            <label className="ops-thermal-print__field">
              <span>Số lượng tem bao</span>
              <input
                type="number"
                min={1}
                max={MAX_PREVIEW_LABELS}
                value={quantityInput}
                onChange={(event) => setQuantityInput(event.target.value)}
              />
            </label>

            <label className="ops-thermal-print__field">
              <span>Mã hub đến</span>
              <select
                value={destinationHubCode}
                onChange={(event) => setDestinationHubCode(normalizeHubCode(event.target.value))}
                className="ops-thermal-print__select"
              >
                {destinationHubCode === '' && (
                  <option value="" disabled>
                    -- Chọn mã hub đến --
                  </option>
                )}
                {destinationHubOptions.map((hub) => (
                  <option key={hub.id} value={normalizeHubCode(hub.code)}>
                    {normalizeHubCode(hub.code)} - {hub.name}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="ops-thermal-print__field ops-thermal-print__field--method">
              <legend>Phương thức</legend>
              <label className="ops-thermal-print__radio">
                <input
                  type="radio"
                  name="transportMethod"
                  value="T"
                  checked={transportMethod === 'T'}
                  onChange={() => setTransportMethod('T')}
                />
                T (Trucking)
              </label>
              <label className="ops-thermal-print__radio">
                <input
                  type="radio"
                  name="transportMethod"
                  value="A"
                  checked={transportMethod === 'A'}
                  onChange={() => setTransportMethod('A')}
                />
                A (Air)
              </label>
            </fieldset>

            <div className="ops-thermal-print__actions">
              <button type="submit" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Đang tạo...' : 'Tạo tem bao'}
              </button>
              <button
                type="button"
                className="ops-thermal-print__secondary-btn"
                onClick={() => void createLabels({ printAfterCreate: true })}
                disabled={generateMutation.isPending}
              >
                Tạo và in
              </button>
              <button
                type="button"
                className="ops-thermal-print__secondary-btn"
                onClick={onPrintLastCreated}
                disabled={lastCreatedItems.length === 0}
              >
                In lô vừa tạo
              </button>
            </div>
          </form>

          {hubsQuery.isError ? (
            <p className="ops-thermal-print__hint">Không tải được danh sách hub đến. Vui lòng thử lại sau.</p>
          ) : (
            <p className="ops-thermal-print__hint">
              Mỗi lần tạo sẽ gọi hệ thống cấp mã thật, không in tem mẫu cục bộ. Có {arrivedLabelsAtOrigin} tem đã hàng đến đang bị khóa khỏi danh sách dùng lại.
            </p>
          )}
          {formError ? <p className="ops-thermal-print__error">{formError}</p> : null}
          {notice ? <p className="ops-thermal-print__notice">{notice}</p> : null}
        </article>

        <article className="ops-thermal-print__preview">
          <div className="ops-thermal-print__preview-header">
            <h3>Tem bao sẵn sàng sử dụng</h3>
            <span>{allItems.length}</span>
          </div>

          {allItems.length === 0 ? (
            <p className="ops-thermal-print__preview-empty">
              Chưa có tem bao đang mở. Nhập form bên trái để tạo lô tem thật trên hệ thống.
            </p>
          ) : (
            <div className="ops-thermal-print__list">
              <table className="ops-thermal-print__table">
                <thead>
                  <tr>
                    <th>Mã bao</th>
                    <th>Ngày tạo</th>
                    <th>Số đơn trong bao</th>
                    <th>Mã Hub đến</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((item) => (
                    <tr key={item.bagCode}>
                      <td><strong>{item.bagCode}</strong></td>
                      <td>{item.createdAtText}</td>
                      <td>{item.shipmentCount ?? 0}</td>
                      <td>{item.destinationHubCode}</td>
                      <td>{item.transportMethod === 'T' ? 'Trucking' : 'Air'}</td>
                      <td>
                        <span className={`ops-thermal-print__status-tag ${item.id ? 'ops-thermal-print__status-tag--open' : 'ops-thermal-print__status-tag--preview'}`}>
                          Sẵn sàng in
                        </span>
                      </td>
                      <td>
                        <button type="button" onClick={() => openQrModal(item)} className="ops-thermal-print__link-btn">Mã QR</button>
                        <button type="button" onClick={() => onPrintSingle(item)} className="ops-thermal-print__link-btn">In</button>
                        <button type="button" onClick={() => onDeleteLabel(item.bagCode)} className="ops-thermal-print__link-btn ops-thermal-print__link-btn--danger">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      {qrModalOpen && activeQrItem && (
        <div className="ops-thermal-print__qr-modal" onClick={closeQrModal}>
          <div className="ops-thermal-print__qr-content" onClick={(e) => e.stopPropagation()}>
            <h4>Mã QR: {activeQrItem.bagCode}</h4>
            <div className="ops-thermal-print__qr-image">
              {activeQrItem.qrPreviewSrc ? (
                <img src={activeQrItem.qrPreviewSrc} alt={`QR ${activeQrItem.bagCode}`} />
              ) : (
                <div>Lỗi tạo QR</div>
              )}
            </div>
            <button type="button" onClick={closeQrModal} className="ops-thermal-print__secondary-btn">Đóng</button>
          </div>
        </div>
      )}

      {deleteCandidate ? (
        <div className="ops-thermal-print__qr-modal" onClick={closeDeleteConfirm}>
          <div className="ops-thermal-print__qr-content" onClick={(event) => event.stopPropagation()}>
            <h4>Xác nhận xóa tem bao</h4>
            <p>
              Bạn đang xóa mã bao <strong>{deleteCandidate.bagCode}</strong>. Chỉ tem đang mở
              mới có thể xóa; tem đã đóng bao hoặc đã hàng đến không nằm trong danh sách này.
            </p>
            <div className="ops-thermal-print__actions">
              <button type="button" className="ops-thermal-print__secondary-btn" onClick={closeDeleteConfirm}>
                Hủy
              </button>
              <button
                type="button"
                className="ops-thermal-print__link-btn ops-thermal-print__link-btn--danger"
                onClick={() => void confirmDeleteLabel()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getDateSortValue(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeHubCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

function dedupeByBagCode<T extends BagLabelPreviewItem>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = normalizeHubCode(item.bagCode);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function buildQrPreviewSrc(value: string): string | null {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(value || 'N/A', 'Byte');
    qr.make();
    const qrSvg = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
    return `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;
  } catch {
    return null;
  }
}
