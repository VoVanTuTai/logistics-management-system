import qrcode from 'qrcode-generator';

export interface ShippingLabelPrintPayload {
  brandName: string;
  serviceName: string;
  shipmentCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  hubCode: string;
  zoneCode: string;
  itemDescription: string;
  parcelNote: string;
  qrValue: string;
  routeTag: string;
  sortCode: string;
  codAmountText: string;
  createdAtText: string;
  deliveryInstruction: string;
  hotlineText: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function newlineToBreaks(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function buildQrSvg(value: string): string {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(value || 'N/A', 'Byte');
    qr.make();
    const svg = qr.createSvgTag({ cellSize: 2, margin: 0, scalable: true });
    return svg.replace('<svg ', '<svg class="qr-svg" ');
  } catch {
    return '<div class="qr-fallback">QR</div>';
  }
}

function buildLabelHtml(payload: ShippingLabelPrintPayload): string {
  const codeText = escapeHtml(payload.shipmentCode);
  const sender = newlineToBreaks(payload.senderAddress);
  const receiver = newlineToBreaks(payload.receiverAddress);
  const sortCode = newlineToBreaks(payload.sortCode);
  const deliveryInstruction = newlineToBreaks(payload.deliveryInstruction);
  const qr = buildQrSvg(payload.qrValue || payload.shipmentCode);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Shipping Label ${codeText}</title>
    <style>
      @page { size: 100mm 150mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #fff; }
      body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet {
        width: 100mm;
        height: 150mm;
        min-height: 150mm;
        margin: 0 auto;
        padding: 3mm;
        border: 0.2mm solid #111;
        display: grid;
        grid-template-rows: auto auto auto auto auto auto auto 1fr;
        gap: 1.6mm;
        page-break-inside: avoid;
        overflow: hidden;
      }
      .block { border: 0.2mm solid #222; padding: 1.4mm; }
      .dash { border-style: dashed; }
      .header { display: grid; grid-template-columns: minmax(0, 38fr) minmax(0, 62fr); gap: 1.2mm; }
      .brand { display: grid; gap: 0.8mm; }
      .brand-title { font-size: 4.3mm; font-weight: 800; letter-spacing: 0.2px; text-transform: uppercase; }
      .service { font-size: 5.1mm; font-weight: 800; letter-spacing: 0.3px; }
      .barcode-wrap { display: grid; gap: 0.8mm; }
      .barcode {
        height: 16mm;
        border: 0.2mm solid #111;
        background:
          repeating-linear-gradient(
            90deg,
            #111 0mm,
            #111 0.45mm,
            #fff 0.45mm,
            #fff 0.85mm,
            #111 0.85mm,
            #111 1.05mm,
            #fff 1.05mm,
            #fff 1.45mm
          );
      }
      .ship-code { font-size: 3.2mm; font-weight: 700; line-height: 1.2; }
      .two-col { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.2mm; }
      .label { font-size: 2.6mm; font-weight: 700; text-transform: uppercase; margin-bottom: 0.6mm; }
      .name { font-size: 3mm; font-weight: 700; line-height: 1.2; margin-bottom: 0.3mm; }
      .text { font-size: 2.5mm; line-height: 1.24; word-break: break-word; }
      .route { display: grid; grid-template-columns: minmax(0, 72fr) minmax(0, 28fr); gap: 1.2mm; }
      .route-main, .route-sub {
        border: 0.24mm solid #111;
        text-align: center;
        font-weight: 800;
        line-height: 1;
        padding: 2.1mm 1mm;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: clip;
      }
      .route-main { font-size: 6.8mm; letter-spacing: 0.25px; text-transform: uppercase; }
      .route-sub { font-size: 5mm; text-transform: uppercase; }
      .item-qr { display: grid; grid-template-columns: minmax(0, 74fr) minmax(0, 26fr); gap: 1.2mm; }
      .qr-box { border: 0.2mm solid #111; padding: 1mm; display: grid; justify-items: center; gap: 0.8mm; }
      .qr-svg {
        width: 24mm;
        height: 24mm;
        display: block;
        border: 0.15mm solid #111;
        background: #fff;
      }
      .qr-fallback {
        width: 24mm;
        height: 24mm;
        border: 0.15mm solid #111;
        display: grid;
        place-items: center;
        font-size: 3.2mm;
        font-weight: 700;
      }
      .big-row { display: grid; grid-template-columns: minmax(0, 66fr) minmax(0, 34fr); gap: 1.2mm; }
      .route-tag {
        border: 0.2mm solid #111;
        font-size: 9.6mm;
        font-weight: 900;
        letter-spacing: 0.2px;
        text-align: center;
        padding: 1.8mm 1mm;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: clip;
      }
      .meta { border: 0.2mm solid #111; padding: 1.3mm; }
      .cod-sign { display: grid; grid-template-columns: minmax(0, 70fr) minmax(0, 30fr); gap: 1.2mm; }
      .cod-value { font-size: 6.2mm; font-weight: 900; line-height: 1; margin: 0.6mm 0 1mm; }
      .signature {
        border: 0.2mm solid #111;
        min-height: 26mm;
        display: grid;
        grid-template-rows: auto 1fr auto;
        padding: 1.3mm;
      }
      .sign-hint { font-size: 2.2mm; line-height: 1.2; color: #222; }
      .footer { font-size: 2.3mm; border-top: 0.2mm dashed #333; padding-top: 1.1mm; line-height: 1.25; }
      .header > *,
      .two-col > *,
      .route > *,
      .item-qr > *,
      .big-row > *,
      .cod-sign > * {
        min-width: 0;
      }
      @media print {
        html, body { width: 100mm; height: 150mm; }
        body { margin: 0; }
        .sheet { margin: 0; }
      }
    </style>
  </head>
  <body>
    <article class="sheet">
      <section class="header block">
        <div class="brand">
          <div class="brand-title">${escapeHtml(payload.brandName)}</div>
          <div class="service">${escapeHtml(payload.serviceName)}</div>
        </div>
        <div class="barcode-wrap">
          <div class="barcode" role="img" aria-label="Barcode"></div>
          <div class="ship-code">Mã vận đơn: ${codeText}</div>
        </div>
      </section>

      <section class="two-col">
        <div class="block">
          <div class="label">Từ</div>
          <div class="name">${escapeHtml(payload.senderName)}</div>
          <div class="text">${escapeHtml(payload.senderPhone)}</div>
          <div class="text">${sender}</div>
        </div>
        <div class="block">
          <div class="label">Đến</div>
          <div class="name">${escapeHtml(payload.receiverName)}</div>
          <div class="text">${escapeHtml(payload.receiverPhone)}</div>
          <div class="text">${receiver}</div>
        </div>
      </section>

      <section class="route">
        <div class="route-main">${escapeHtml(payload.hubCode || 'HUB-NA')}</div>
        <div class="route-sub">${escapeHtml(payload.zoneCode || 'ZONE')}</div>
      </section>

      <section class="item-qr">
        <div class="block dash">
          <div class="label">Nội dung hàng</div>
          <div class="text">${escapeHtml(payload.itemDescription || '-')}</div>
          <div class="text">${escapeHtml(payload.parcelNote || '-')}</div>
        </div>
        <div class="qr-box">
          ${qr}
          <div class="text" style="text-align:center;">${sortCode}</div>
        </div>
      </section>

      <section class="big-row">
        <div class="route-tag">${escapeHtml(payload.routeTag || 'ROUTE')}</div>
        <div class="meta">
          <div class="label">Ngày đặt hàng</div>
          <div class="text">${escapeHtml(payload.createdAtText)}</div>
        </div>
      </section>

      <section class="cod-sign">
        <div class="block">
          <div class="label">Tiền thu người nhận</div>
          <div class="cod-value">${escapeHtml(payload.codAmountText)}</div>
          <div class="label">Chỉ dẫn giao hàng</div>
          <div class="text">${deliveryInstruction}</div>
        </div>
        <div class="signature">
          <div class="label">Chữ ký người nhận</div>
          <div></div>
          <div class="sign-hint">Vui lòng ký và ghi rõ họ tên khi nhận hàng.</div>
        </div>
      </section>

      <footer class="footer">
        ${escapeHtml(payload.hotlineText)}
      </footer>
    </article>
  </body>
</html>`;
}

export function openShippingLabelPrint(payload: ShippingLabelPrintPayload): boolean {
  const popup = window.open('', '_blank', 'width=440,height=900');
  if (!popup) {
    return false;
  }

  const html = buildLabelHtml(payload);
  try {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      popup.print();
    }, 220);
  } catch {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    popup.location.href = url;
    popup.onload = () => {
      popup.focus();
      popup.print();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
  }

  return true;
}
