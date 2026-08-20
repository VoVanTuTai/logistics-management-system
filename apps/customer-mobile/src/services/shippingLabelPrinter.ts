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

function resolveHubCodes(order: OrderModel | any): { senderHubCode: string; receiverHubCode: string } {
  const metadata = order?.metadata || {};
  const senderMeta = metadata?.sender || {};
  const receiverMeta = metadata?.receiver || {};
  const routingMeta = metadata?.routing || {};

  let senderHub =
    order.senderHubCode ||
    order.sender?.hubCode ||
    senderMeta?.hubCode ||
    routingMeta?.originHubCode ||
    order.originHubCode;

  let receiverHub =
    order.receiverHubCode ||
    order.receiver?.hubCode ||
    receiverMeta?.hubCode ||
    routingMeta?.destinationHubCode ||
    order.destinationHubCode;

  const senderProv = (order.sender?.province || senderMeta?.province || '').toLowerCase();
  const receiverProv = (order.receiver?.province || receiverMeta?.province || '').toLowerCase();

  if (!senderHub) {
    if (senderProv.includes('hà nội')) senderHub = '001001B001';
    else if (senderProv.includes('hồ chí minh') || senderProv.includes('hcm')) senderHub = '003S001';
    else if (senderProv.includes('đà nẵng')) senderHub = '002C001';
    else if (senderProv.includes('cao bằng')) senderHub = '001004B001';
    else senderHub = '001N001';
  }

  if (!receiverHub) {
    if (receiverProv.includes('hồ chí minh') || receiverProv.includes('hcm')) receiverHub = '003079B001';
    else if (receiverProv.includes('cần thơ')) receiverHub = '003092B001';
    else if (receiverProv.includes('hà nội')) receiverHub = '001001B001';
    else if (receiverProv.includes('đà nẵng')) receiverHub = '002C001';
    else receiverHub = '003S001';
  }

  return {
    senderHubCode: String(senderHub).toUpperCase(),
    receiverHubCode: String(receiverHub).toUpperCase(),
  };
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

  const { senderHubCode, receiverHubCode } = resolveHubCodes(order);
  const senderProvinceUpper = escapeHtml(
    (order.sender?.province || 'THÀNH PHỐ HÀ NỘI').toUpperCase(),
  );
  const receiverProvince = escapeHtml(
    order.receiverProvince || order.receiver?.province || 'Thành phố Hồ Chí Minh',
  );

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
      html, body { width: 100mm; height: 150mm; margin: 0; padding: 0; background: #fff; }
      body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet {
        width: 100mm;
        height: 150mm;
        margin: 0 auto;
        padding: 2.5mm;
        border: 0.3mm solid #111;
        display: flex;
        flex-direction: column;
        gap: 1.2mm;
        overflow: hidden;
        background: #fff;
      }
      .block { border: 0.25mm solid #222; padding: 1.2mm; }
      .header {
        height: 20mm;
        display: grid;
        grid-template-columns: 38% 62%;
        gap: 1.2mm;
        align-items: center;
      }
      .brand { display: flex; flex-direction: column; gap: 0.5mm; }
      .brand-title { font-size: 3.6mm; font-weight: 800; letter-spacing: 0.2px; text-transform: uppercase; line-height: 1.1; }
      .service { font-size: 4.2mm; font-weight: 800; letter-spacing: 0.3px; line-height: 1.1; }
      .barcode-wrap { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5mm; }
      .barcode {
        width: 95%;
        height: 12mm;
        border: 0.2mm solid #000;
        background: repeating-linear-gradient(
          90deg,
          #000 0mm, #000 0.45mm,
          #fff 0.45mm, #fff 0.85mm,
          #000 0.85mm, #000 1.1mm,
          #fff 1.1mm, #fff 1.5mm
        );
      }
      .ship-code { font-size: 2.8mm; font-weight: 700; line-height: 1.1; margin-top: 0.5mm; }
      .two-col {
        height: 28mm;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.2mm;
      }
      .two-col .block {
        padding: 1.2mm;
        overflow: hidden;
      }
      .label { font-size: 2.4mm; font-weight: 800; text-transform: uppercase; margin-bottom: 0.4mm; }
      .name { font-size: 2.8mm; font-weight: 800; line-height: 1.15; margin-bottom: 0.2mm; }
      .text { font-size: 2.2mm; line-height: 1.2; word-break: break-word; overflow: hidden; }
      .route {
        height: 13mm;
        display: grid;
        grid-template-columns: 68% 32%;
        gap: 1.2mm;
      }
      .route-main {
        border: 0.25mm solid #111;
        font-size: 6.8mm;
        font-weight: 900;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: #fff;
      }
      .route-sub {
        border: 0.25mm solid #111;
        font-size: 2.8mm;
        font-weight: 800;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 1mm;
        line-height: 1.15;
        word-break: break-word;
        overflow: hidden;
        background: #fff;
      }
      .item-qr {
        height: 30mm;
        display: grid;
        grid-template-columns: 68% 32%;
        gap: 1.2mm;
      }
      .item-qr .dash {
        border: 0.25mm dashed #111;
        padding: 1.2mm;
        display: flex;
        flex-direction: column;
        gap: 0.5mm;
        overflow: hidden;
      }
      .qr-box {
        border: 0.25mm solid #111;
        padding: 1mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5mm;
        overflow: hidden;
        background: #fff;
      }
      .qr-svg {
        width: 17mm;
        height: 17mm;
        display: block;
      }
      .qr-fallback {
        width: 17mm;
        height: 17mm;
        border: 0.15mm solid #111;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3mm;
        font-weight: 800;
      }
      .qr-info {
        font-size: 2mm;
        line-height: 1.15;
        text-align: center;
        word-break: break-word;
        width: 100%;
      }
      .big-row {
        height: 13mm;
        display: grid;
        grid-template-columns: 68% 32%;
        gap: 1.2mm;
      }
      .route-tag {
        border: 0.25mm solid #111;
        font-size: 6.8mm;
        font-weight: 900;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: #fff;
      }
      .meta {
        border: 0.25mm solid #111;
        padding: 1.2mm;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: #fff;
      }
      .cod-sign {
        height: 33mm;
        display: grid;
        grid-template-columns: 68% 32%;
        gap: 1.2mm;
      }
      .cod-sign .block {
        padding: 1.2mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .cod-value {
        font-size: 5.5mm;
        font-weight: 900;
        line-height: 1;
        margin: 0.5mm 0 1mm;
      }
      .signature {
        border: 0.25mm solid #111;
        padding: 1.2mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .sign-hint {
        font-size: 1.9mm;
        line-height: 1.15;
        color: #333;
      }
      .footer {
        height: 6mm;
        font-size: 2.2mm;
        border-top: 0.25mm dashed #333;
        padding-top: 0.8mm;
        text-align: left;
        line-height: 1.2;
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
      <!-- ROW 1: HEADER & BARCODE -->
      <section class="header block">
        <div class="brand">
          <div class="brand-title">${brandName}</div>
          <div class="service">${serviceName}</div>
        </div>
        <div class="barcode-wrap">
          <div class="barcode" role="img" aria-label="Barcode"></div>
          <div class="ship-code">Mã vận đơn: <strong>${codeText}</strong></div>
        </div>
      </section>

      <!-- ROW 2: SENDER & RECEIVER -->
      <section class="two-col">
        <div class="block">
          <div class="label">TỪ</div>
          <div class="name">${senderName}</div>
          <div class="text">${senderPhone}</div>
          <div class="text">${senderAddress}</div>
        </div>
        <div class="block">
          <div class="label">ĐẾN</div>
          <div class="name">${receiverName}</div>
          <div class="text">${receiverPhone}</div>
          <div class="text">${receiverAddress}</div>
        </div>
      </section>

      <!-- ROW 3: SENDER HUB (TOP BIG CODE) & SENDER PROVINCE -->
      <section class="route">
        <div class="route-main">${senderHubCode}</div>
        <div class="route-sub">${senderProvinceUpper}</div>
      </section>

      <!-- ROW 4: ITEM CONTENT & QR CODE BOX -->
      <section class="item-qr">
        <div class="block dash">
          <div class="label">NỘI DUNG HÀNG</div>
          <div class="text">${itemDescription}</div>
          <div class="text">${parcelNote}</div>
        </div>
        <div class="qr-box">
          ${qrSvg}
          <div class="qr-info">
            <div>Hub đích: <strong>${receiverHubCode}</strong></div>
            <div>Khu vực: ${receiverProvince}</div>
          </div>
        </div>
      </section>

      <!-- ROW 5: RECEIVER HUB (BOTTOM BIG CODE) & ORDER CREATED DATE -->
      <section class="big-row">
        <div class="route-tag">${receiverHubCode}</div>
        <div class="meta">
          <div class="label">NGÀY ĐẶT HÀNG</div>
          <div class="text">${createdAtText}</div>
        </div>
      </section>

      <!-- ROW 6: COD & RECIPIENT SIGNATURE -->
      <section class="cod-sign">
        <div class="block">
          <div class="label">TIỀN THU NGƯỜI NHẬN</div>
          <div class="cod-value">${codAmountText}</div>
          <div class="label">CHỈ DẪN GIAO HÀNG</div>
          <div class="text">${deliveryInstruction}</div>
        </div>
        <div class="signature">
          <div class="label">CHỮ KÝ NGƯỜI NHẬN</div>
          <div></div>
          <div class="sign-hint">Vui lòng ký và ghi rõ họ tên khi nhận hàng.</div>
        </div>
      </section>

      <!-- ROW 7: FOOTER -->
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
    await Print.printAsync({ html });
  }
}
