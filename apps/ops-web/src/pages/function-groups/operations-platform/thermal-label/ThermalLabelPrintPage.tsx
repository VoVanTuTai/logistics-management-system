import React, { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useDeleteManifestMutation, useGenerateBagCodesMutation, useManifestsQuery } from '../../../../features/manifests/manifests.hooks';
import {
  buildBagLabelDisplayModel,
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
  const [previewItems, setPreviewItems] = useState<BagLabelPreviewItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrItem, setActiveQrItem] = useState<BagLabelPreviewItem | null>(null);

  const destinationHubOptions = useMemo(
    () =>
      (hubsQuery.data ?? [])
        .filter((hub) => hub.isActive && normalizeHubCode(hub.code) !== originHubCode)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [hubsQuery.data, originHubCode],
  );

  const realManifests = useMemo(() => {
    if (!manifestsQuery.data) return [];
    return manifestsQuery.data
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
  }, [manifestsQuery.data, originHubCode]);

  const allItems = useMemo(() => {
    // Combine real manifests with local previews that haven't been created yet
    // Filter out local previews that have the same bagCode as a real manifest
    const realCodes = new Set(realManifests.map(m => m.bagCode));
    const filteredPreviews = previewItems.filter(p => !p.id && !realCodes.has(p.bagCode));
    return [...realManifests, ...filteredPreviews].sort((a, b) => {
      const byCreatedAt = getDateSortValue(b.createdAtRaw ?? b.createdAtText) - getDateSortValue(a.createdAtRaw ?? a.createdAtText);
      if (byCreatedAt !== 0) {
        return byCreatedAt;
      }
      return b.bagCode.localeCompare(a.bagCode);
    });
  }, [realManifests, previewItems]);

  useEffect(() => {
    if (!destinationHubCode && destinationHubOptions.length > 0) {
      setDestinationHubCode(normalizeHubCode(destinationHubOptions[0].code));
    }
  }, [destinationHubCode, destinationHubOptions]);

  const onGeneratePreview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextPreviewItems = buildPreviewItems({
      quantityInput,
      destinationHubCode,
      originHubCode,
      transportMethod,
    });

    if (!nextPreviewItems) {
      setPreviewItems([]);
      setNotice(null);
      setFormError(
        `Vui lòng nhập đủ thông tin. Số lượng phải từ 1 đến ${MAX_PREVIEW_LABELS}, mã hub đến không để trống.`,
      );
      return;
    }

    setPreviewItems(nextPreviewItems);
    setFormError(null);
    setNotice(`Đã tạo ${nextPreviewItems.length} tem bao mẫu để xem trước.`);
  };

  const onPrint = () => {
    const itemsForPrint =
      previewItems.length > 0
        ? previewItems
        : buildPreviewItems({
            quantityInput,
            destinationHubCode,
            originHubCode,
            transportMethod,
          });

    if (!itemsForPrint || itemsForPrint.length === 0) {
      setFormError(
        `Không thể in vì thiếu thông tin. Số lượng hợp lệ: 1-${MAX_PREVIEW_LABELS}, cần có mã hub đến.`,
      );
      setNotice(null);
      return;
    }

    if (previewItems.length === 0) {
      setPreviewItems(itemsForPrint);
    }

    const opened = openBagLabelBatchPrint(itemsForPrint);
    if (!opened) {
      setFormError('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.');
      setNotice(null);
      return;
    }

    setFormError(null);
    setNotice(`Đã mở cửa sổ in ${itemsForPrint.length} tem bao.`);
  };

  const onCreateRealLabels = async () => {
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

      setPreviewItems([]); // Clear local previews as they are now on server
      setNotice(`Thành công! Đã tạo ${response.length} tem bao trên hệ thống.`);
    } catch (err) {
      setFormError('Lỗi khi tạo tem bao trên hệ thống. Vui lòng thử lại sau.');
      setNotice(null);
    }
  };

  const onDeleteLabel = async (bagCode: string) => {
    // Note: bagCode could be used directly as manifestId depending on implementation.
    // If our API expects the internal ID, we need to have it in the previewItem.
    // Let's assume we can fetch list of manifests and delete by manifestId, or the preview item holds manifestCode and we can pass it if the backend supports deletion by manifestCode or id.
    // We'll delete by manifestCode via API (the hooks delete by ID but typically code works if backend handles it, but since we generate we don't know ID unless returned).
    // Wait, generateMutation returns Manifest[], so we have the ID! We should map ID.
    const item = allItems.find((i) => i.bagCode === bagCode);
    if (!item || !item.id) {
      setPreviewItems((prev) => prev.filter((i) => i.bagCode !== bagCode));
      setNotice(`Đã xóa tem bao mẫu ${bagCode}.`);
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa mã bao ${bagCode}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
        // No need to manually filter if using react-query as it will re-fetch
        setNotice(`Đã xóa tem bao ${bagCode}.`);
      } catch (err) {
        setFormError(`Lỗi khi xóa tem bao ${bagCode}.`);
      }
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
          Chọn số lượng, mã hub đến, phương thức vận chuyển T (trucking) hoặc A (air), sau đó
          xem trước tem bao trước khi in.
        </p>
      </header>

      <div className="ops-thermal-print__layout">
        <article className="ops-thermal-print__form-card">
          <h3>Thông tin in</h3>
          <form onSubmit={onGeneratePreview} className="ops-thermal-print__form">
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
              <button type="submit">Tạo xem trước</button>
              <button 
                type="button" 
                className="ops-thermal-print__secondary-btn" 
                onClick={onCreateRealLabels}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Đang tạo...' : 'Tạo trên hệ thống'}
              </button>
              <button type="button" className="ops-thermal-print__secondary-btn" onClick={onPrint}>
                In tem bao
              </button>
            </div>
          </form>

          {hubsQuery.isError ? (
            <p className="ops-thermal-print__hint">Không tải được danh sách hub. Bạn vẫn có thể nhập mã hub đến tay.</p>
          ) : (
            <p className="ops-thermal-print__hint">
              Có thể nhập tay mã hub đến hoặc chọn từ danh sách gợi ý.
            </p>
          )}
          {formError ? <p className="ops-thermal-print__error">{formError}</p> : null}
          {notice ? <p className="ops-thermal-print__notice">{notice}</p> : null}
        </article>

        <article className="ops-thermal-print__preview">
          <div className="ops-thermal-print__preview-header">
            <h3>Danh sách tem bao</h3>
            <span>{previewItems.length}</span>
          </div>

          {allItems.length === 0 ? (
            <p className="ops-thermal-print__preview-empty">
              Chưa có tem bao "Đang mở". Nhập form bên trái và bấm "Tạo trên hệ thống" để lưu vào DB.
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
                          {item.id ? 'Đang mở' : 'Xem trước'}
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
    </section>
  );
}

interface BuildPreviewOptions {
  quantityInput: string;
  destinationHubCode: string;
  originHubCode: string;
  transportMethod: BagTransportMethod;
}

function buildPreviewItems(options: BuildPreviewOptions): BagLabelPreviewItem[] | null {
  const quantity = Number.parseInt(options.quantityInput, 10);
  const destinationHubCode = normalizeHubCode(options.destinationHubCode);
  const originHubCode = normalizeHubCode(options.originHubCode || 'HUB-NA');

  if (
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    quantity > MAX_PREVIEW_LABELS ||
    destinationHubCode.length === 0
  ) {
    return null;
  }

  const createdAtText = formatDateTime(new Date().toISOString());
  const hubTriplet = getHubTriplet(destinationHubCode);
  const batchTimestamp = Date.now().toString();

  return Array.from({ length: quantity }, (_, index) => {
    const bagCode = `MB${createBagCodeDigits(hubTriplet, batchTimestamp, index)}`;

    return {
      bagCode,
      originHubCode,
      destinationHubCode,
      status: 'CHO_IN',
      shipmentCount: 0,
      createdAtRaw: new Date().toISOString(),
      createdAtText,
      transportMethod: options.transportMethod,
      qrPreviewSrc: buildQrPreviewSrc(bagCode),
    };
  });
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

function getHubTriplet(hubCode: string): string {
  const digits = (hubCode.match(/\d/g) ?? []).join('');
  if (digits.length >= 3) {
    return digits.slice(0, 3);
  }

  return digits.padStart(3, '0');
}

function createBagCodeDigits(hubTriplet: string, batchTimestamp: string, index: number): string {
  const timePart = batchTimestamp.slice(-4).padStart(4, '0');
  const sequencePart = String(index + 1).padStart(3, '0');
  return `${hubTriplet}${timePart}${sequencePart}`;
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

function BagLabelStickerPreview({ item }: { item: BagLabelPreviewItem }): React.JSX.Element {
  const display = buildBagLabelDisplayModel(item);

  return (
    <>
      <div className="ops-thermal-print__sticker-top">
        <div className="ops-thermal-print__sticker-top-text">
          <div>TTC đóng bao: {display.packingHubCode}</div>
          <div>In: {display.printedAtText}</div>
        </div>
        <div className="ops-thermal-print__sticker-method">{display.methodLetter}</div>
      </div>

      <div className="ops-thermal-print__sticker-main">
        <div className="ops-thermal-print__sticker-large-code">{display.largeCode}</div>
        <div className="ops-thermal-print__sticker-qr-wrap">
          {item.qrPreviewSrc ? (
            <img src={item.qrPreviewSrc} alt={`QR ${item.bagCode}`} />
          ) : (
            <div className="ops-thermal-print__sticker-qr-fallback">QR</div>
          )}
        </div>
      </div>

      <div className="ops-thermal-print__sticker-route">{display.routeCode}</div>
      <div className="ops-thermal-print__sticker-barcode" aria-hidden="true" />
      <div className="ops-thermal-print__sticker-barcode-text">{display.barcodeText}</div>
      <div className="ops-thermal-print__sticker-destination">
        Đích đến: {display.destinationText}
      </div>
    </>
  );
}
