import React, { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import {
  buildBagLabelDisplayModel,
  openBagLabelBatchPrint,
  type BagLabelPrintPayload,
  type BagTransportMethod,
} from '../../../../printing/bagLabelPrint';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import './ThermalLabelPrintPage.css';

const MAX_PREVIEW_LABELS = 30;

interface BagLabelPreviewItem extends BagLabelPrintPayload {
  qrPreviewSrc: string | null;
}

export function ThermalLabelPrintPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const hubsQuery = useHubsQuery(accessToken, {});
  const originHubCode = normalizeHubCode(session?.user.hubCodes?.[0] ?? '');

  const [quantityInput, setQuantityInput] = useState('1');
  const [destinationHubCode, setDestinationHubCode] = useState('');
  const [transportMethod, setTransportMethod] = useState<BagTransportMethod>('T');
  const [previewItems, setPreviewItems] = useState<BagLabelPreviewItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const destinationHubOptions = useMemo(
    () =>
      (hubsQuery.data ?? [])
        .filter((hub) => hub.isActive && normalizeHubCode(hub.code) !== originHubCode)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [hubsQuery.data, originHubCode],
  );

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
              <input
                type="text"
                list="ops-thermal-destination-hubs"
                value={destinationHubCode}
                onChange={(event) => setDestinationHubCode(normalizeHubCode(event.target.value))}
                placeholder="Nhập mã hub đến"
              />
              <datalist id="ops-thermal-destination-hubs">
                {destinationHubOptions.map((hub) => (
                  <option key={hub.id} value={normalizeHubCode(hub.code)}>
                    {hub.name}
                  </option>
                ))}
              </datalist>
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
            <h3>Hình ảnh tem bao xem trước</h3>
            <span>{previewItems.length}</span>
          </div>

          {previewItems.length === 0 ? (
            <p className="ops-thermal-print__preview-empty">
              Chưa có tem bao mẫu. Nhập form bên trái và bấm "Tạo xem trước".
            </p>
          ) : (
            <div className="ops-thermal-print__preview-grid">
              {previewItems.map((item) => (
                <article key={item.bagCode} className="ops-thermal-print__sticker">
                  <BagLabelStickerPreview item={item} />
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
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
      createdAtText,
      transportMethod: options.transportMethod,
      qrPreviewSrc: buildQrPreviewSrc(bagCode),
    };
  });
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
