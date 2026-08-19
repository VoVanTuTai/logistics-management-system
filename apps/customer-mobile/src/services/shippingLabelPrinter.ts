import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import qrcode from 'qrcode-generator';
import type { OrderModel } from '../types';

function escapeHtml(value: string): string {
  if (!value) return '';
  return String(value)
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

function formatVnd(val?: number): string {
  if (!val || val <= 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
}

function formatDate(val?: string): string {
  if (!val) return new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
  const d = new Date(val);
  const timeStr = d.toLocaleTimeString('vi-VN');
  const dateStr = d.toLocaleDateString('vi-VN');
  return `${timeStr} ${dateStr}`;
}

function compactCode(value: string, fallback: string): string {
  const normalized = (value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return normalized.length > 0 ? normalized.slice(0, 9) : fallback;
}

export function buildShippingLabelHtml(order: OrderModel | any): string {
  const codeText = escapeHtml(order.code);
  const senderName = escapeHtml(order.sender?.name || 'Merchant');
  const senderPhone = escapeHtml(order.sender?.phone || '');
  const senderAddress = newlineToBreaks(
    order.sender?.composedAddress || order.sender?.addressDetail || 'N/A',
  );

  const receiverName = escapeHtml(order.receiver?.name || 'Khách hàng');
  const receiverPhone = escapeHtml(order.receiver?.phone || '');
  const receiverAddress = newlineToBreaks(
    order.receiver?.composedAddress || order.receiver?.addressDetail || 'N/A',
  );

  const hubCode = escapeHtml(order.receiverHubCode || order.receiver?.hubCode || order.senderHubCode || order.sender?.hubCode || '003092B001');
  const zoneCode = escapeHtml(order.receiverProvince || order.receiver?.province || 'THÀNH PHỐ CẦN THƠ');
  const routeTag = compactCode(hubCode || zoneCode, '003092B00');
  const sortCode = newlineToBreaks(`Hub đích: ${hubCode}\nKhu vực: ${zoneCode}`);

  const itemTypeStr = order.itemName || order.itemType || 'hhh';
  const itemDescription = escapeHtml(itemTypeStr);
  const weightKgStr = `${order.weightKg ?? 1} kg`;
  const codVal = order.codAmountVnd ?? order.codAmount ?? 0;
  const codAmountText = formatVnd(codVal);

  const parcelNote = escapeHtml(
    `Loại hàng: ${itemTypeStr} | Khối lượng: ${weightKgStr} | COD: ${codAmountText}`,
  );

  const createdAtText = formatDate(order.createdAt);
  const deliveryInstruction = newlineToBreaks(
    order.notes || order.deliveryNote || 'Gọi trước khi giao. Không cho thử hàng.',
  );
  const hotlineText = escapeHtml('Hotline vận hành: 1900-1234');
  const brandName = escapeHtml('NEXUS LOGISTICS');
  const serviceName = escapeHtml(order.orderType === 'EXPRESS' ? 'EXPRESS' : 'STANDARD');

  const qrSvg = buildQrSvg(order.code);

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
      .sheet {
        padding: 2.4mm;
        grid-template-rows: 22mm 30mm 11mm 28mm 14mm 27mm minmax(0, 1fr);
        gap: 0.8mm;
      }
      .block,
      .header,
      .two-col > *,
      .route > *,
      .item-qr > *,
      .big-row > *,
      .cod-sign > * {
        min-height: 0;
        overflow: hidden;
      }
      .block { padding: 1.1mm; }
      .header { align-items: stretch; }
      .brand { align-content: center; gap: 0.6mm; }
      .brand-title { font-size: 3.8mm; line-height: 1; }
      .service { font-size: 4.3mm; line-height: 1.05; }
      .barcode-wrap { gap: 0.5mm; }
      .barcode { height: 12.5mm; }
      .ship-code { font-size: 2.9mm; line-height: 1.1; }
      .two-col,
      .route,
      .item-qr,
      .big-row,
      .cod-sign {
        height: 100%;
      }
      .label { font-size: 2.35mm; line-height: 1; margin-bottom: 0.45mm; }
      .name { font-size: 2.75mm; line-height: 1.08; margin-bottom: 0.25mm; }
      .text {
        font-size: 2.25mm;
        line-height: 1.16;
        overflow-wrap: anywhere;
      }
      .two-col .block {
        display: grid;
        grid-template-rows: auto auto auto minmax(0, 1fr);
      }
      .two-col .block .text:last-child,
      .item-qr .block .text:last-child,
      .cod-sign .block .text:last-child {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .two-col .block .text:last-child { -webkit-line-clamp: 6; }
      .item-qr .block .text:last-child { -webkit-line-clamp: 4; }
      .cod-sign .block .text:last-child { -webkit-line-clamp: 5; }
      .route-main,
      .route-sub {
        display: grid;
        place-items: center;
        padding: 0.8mm 1mm;
      }
      .route-main { font-size: 6mm; }
      .route-sub { font-size: 4.2mm; }
      .item-qr { grid-template-columns: minmax(0, 70fr) 25mm; }
      .item-qr .block {
        display: grid;
        align-content: start;
      }
      .qr-box {
        padding: 0.8mm;
        align-content: center;
        gap: 0.5mm;
      }
      .qr-svg,
      .qr-fallback {
        width: 20.5mm;
        height: 20.5mm;
      }
      .route-tag {
        display: grid;
        place-items: center;
        font-size: 7.4mm;
        line-height: 1;
        padding: 0.8mm 1mm;
      }
      .meta {
        display: grid;
        align-content: center;
        padding: 1mm;
      }
      .cod-sign .block {
        display: grid;
        grid-template-rows: auto auto auto minmax(0, 1fr);
        padding: 1.1mm;
      }
      .cod-value {
        font-size: 5.2mm;
        line-height: 1;
        margin: 0.25mm 0 0.7mm;
      }
      .signature {
        min-height: 0;
        height: 100%;
        padding: 1.1mm;
      }
      .sign-hint { font-size: 2mm; }
      .footer {
        min-height: 0;
        overflow: hidden;
        font-size: 2.05mm;
        line-height: 1.15;
        padding-top: 0.7mm;
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
          <div class="brand-title">${brandName}</div>
          <div class="service">${serviceName}</div>
        </div>
        <div class="barcode-wrap">
          <div class="barcode" role="img" aria-label="Barcode"></div>
          <div class="ship-code">Mã vận đơn: ${codeText}</div>
        </div>
      </section>

      <section class="two-col">
        <div class="block">
          <div class="label">Từ</div>
          <div class="name">${senderName}</div>
          <div class="text">${senderPhone}</div>
          <div class="text">${senderAddress}</div>
        </div>
        <div class="block">
          <div class="label">Đến</div>
          <div class="name">${receiverName}</div>
          <div class="text">${receiverPhone}</div>
          <div class="text">${receiverAddress}</div>
        </div>
      </section>

      <section class="route">
        <div class="route-main">${hubCode}</div>
        <div class="route-sub">${zoneCode}</div>
      </section>

      <section class="item-qr">
        <div class="block dash">
          <div class="label">Nội dung hàng</div>
          <div class="text">${itemDescription}</div>
          <div class="text">${parcelNote}</div>
        </div>
        <div class="qr-box">
          ${qrSvg}
          <div class="text" style="text-align:center;">${sortCode}</div>
        </div>
      </section>

      <section class="big-row">
        <div class="route-tag">${routeTag}</div>
        <div class="meta">
          <div class="label">Ngày đặt hàng</div>
          <div class="text">${createdAtText}</div>
        </div>
      </section>

      <section class="cod-sign">
        <div class="block">
          <div class="label">Tiền thu người nhận</div>
          <div class="cod-value">${codAmountText}</div>
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
        ${hotlineText}
      </footer>
    </article>
  </body>
</html>`;
}

export async function printOrShareShippingLabel(order: OrderModel | any): Promise<void> {
  const html = buildShippingLabelHtml(order);

  try {
    // Generate PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      width: 283, // 100mm in points (~72 dpi)
      height: 425, // 150mm in points
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Mã vận đơn ${order.code}.pdf`,
      });
    } else {
      await Print.printAsync({ uri });
    }
  } catch (error) {
    // Direct fallback print dialog
    await Print.printAsync({ html });
  }
}
