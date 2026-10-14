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
  pickupRouteName?: string;
  pickupCourierId?: string;
  deliveryRouteName?: string;
  deliveryCourierId?: string;
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

function buildSingleSheetMarkup(payload: ShippingLabelPrintPayload): string {
  const codeText = escapeHtml(payload.shipmentCode);
  const sender = newlineToBreaks(payload.senderAddress);
  const receiver = newlineToBreaks(payload.receiverAddress);
  const sortCode = newlineToBreaks(payload.sortCode);
  const deliveryInstruction = newlineToBreaks(payload.deliveryInstruction);
  const qr = buildQrSvg(payload.qrValue || payload.shipmentCode);

  return `    <article class="sheet">
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
          <div class="label">Từ (Người gửi)</div>
          <div class="name">${escapeHtml(payload.senderName)}</div>
          <div class="text">${escapeHtml(payload.senderPhone)}</div>
          <div class="text">${sender}</div>
        </div>
        <div class="block">
          <div class="label">Đến (Người nhận)</div>
          <div class="name">${escapeHtml(payload.receiverName)}</div>
          <div class="text">${escapeHtml(payload.receiverPhone)}</div>
          <div class="text">${receiver}</div>
        </div>
      </section>

      <section class="two-col route-courier-box">
        <div class="block route-courier-card">
          <div class="route-courier-title">
            <span>TUYẾN LẤY HÀNG</span>
            <span class="route-courier-badge">LẤY</span>
          </div>
          <div class="route-courier-val">${escapeHtml(payload.pickupRouteName || 'TUYẾN LẤY')}</div>
          <div class="route-courier-shipper">Shipper lấy: <strong>${escapeHtml(payload.pickupCourierId || 'Tự động')}</strong></div>
        </div>
        <div class="block route-courier-card">
          <div class="route-courier-title">
            <span>TUYẾN PHÁT HÀNG</span>
            <span class="route-courier-badge route-courier-badge--deliv">GIAO</span>
          </div>
          <div class="route-courier-val">${escapeHtml(payload.deliveryRouteName || 'TUYẾN PHÁT')}</div>
          <div class="route-courier-shipper">Shipper giao: <strong>${escapeHtml(payload.deliveryCourierId || 'Tự động')}</strong></div>
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
    </article>`;
}

function buildMultiLabelHtml(payloads: ShippingLabelPrintPayload[]): string {
  const title =
    payloads.length === 1
      ? `Van_Don_${escapeHtml(payloads[0].shipmentCode)}`
      : `Danh_Sach_Van_Don_${payloads.length}_Don`;
  const sheets = payloads.map((p) => buildSingleSheetMarkup(p)).join('\n');

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      @page { size: 100mm 150mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 100%; min-height: 100%; margin: 0; padding: 0; background: #e2e8f0; }
      body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 12px 0; }
      .sheet {
        width: 100mm;
        height: 150mm;
        min-height: 150mm;
        max-height: 150mm;
        margin: 12px auto;
        padding: 2.2mm;
        background: #fff;
        border: 0.2mm solid #111;
        display: grid;
        grid-template-rows: 20mm 26mm 14mm 9mm 25mm 12mm 24mm minmax(0, 1fr);
        gap: 0.8mm;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: always;
        break-after: page;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }
      .sheet:last-of-type {
        page-break-after: auto;
        break-after: auto;
      }
      .block { border: 0.2mm solid #222; padding: 1.1mm; }
      .dash { border-style: dashed; }
      .header { display: grid; grid-template-columns: minmax(0, 38fr) minmax(0, 62fr); gap: 1.2mm; align-items: stretch; }
      .brand { display: grid; gap: 0.6mm; align-content: center; }
      .brand-title { font-size: 3.8mm; font-weight: 800; letter-spacing: 0.2px; text-transform: uppercase; line-height: 1; }
      .service { font-size: 4.3mm; font-weight: 800; letter-spacing: 0.3px; line-height: 1.05; }
      .barcode-wrap { display: grid; gap: 0.5mm; }
      .barcode {
        height: 12.5mm;
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
      .ship-code { font-size: 2.9mm; font-weight: 700; line-height: 1.1; }
      .two-col { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.2mm; height: 100%; }
      .label { font-size: 2.35mm; font-weight: 700; text-transform: uppercase; line-height: 1; margin-bottom: 0.45mm; }
      .name { font-size: 2.75mm; font-weight: 700; line-height: 1.08; margin-bottom: 0.25mm; }
      .text { font-size: 2.25mm; line-height: 1.16; word-break: break-word; overflow-wrap: anywhere; }
      .route { display: grid; grid-template-columns: minmax(0, 72fr) minmax(0, 28fr); gap: 1.2mm; height: 100%; }
      .route-main, .route-sub {
        border: 0.24mm solid #111;
        text-align: center;
        font-weight: 800;
        display: grid;
        place-items: center;
        padding: 0.8mm 1mm;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: clip;
      }
      .route-main { font-size: 6mm; letter-spacing: 0.25px; text-transform: uppercase; }
      .route-sub { font-size: 4.2mm; text-transform: uppercase; }
      .item-qr { display: grid; grid-template-columns: minmax(0, 70fr) 25mm; gap: 1.2mm; height: 100%; }
      .qr-box { border: 0.2mm solid #111; padding: 0.8mm; display: grid; justify-items: center; align-content: center; gap: 0.5mm; }
      .qr-svg {
        width: 20.5mm;
        height: 20.5mm;
        display: block;
        border: 0.15mm solid #111;
        background: #fff;
      }
      .qr-fallback {
        width: 20.5mm;
        height: 20.5mm;
        border: 0.15mm solid #111;
        display: grid;
        place-items: center;
        font-size: 3.2mm;
        font-weight: 700;
      }
      .big-row { display: grid; grid-template-columns: minmax(0, 66fr) minmax(0, 34fr); gap: 1.2mm; height: 100%; }
      .route-tag {
        border: 0.2mm solid #111;
        font-size: 7.4mm;
        font-weight: 900;
        letter-spacing: 0.2px;
        text-align: center;
        display: grid;
        place-items: center;
        padding: 0.8mm 1mm;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: clip;
      }
      .meta { border: 0.2mm solid #111; padding: 1mm; display: grid; align-content: center; }
      .cod-sign { display: grid; grid-template-columns: minmax(0, 70fr) minmax(0, 30fr); gap: 1.2mm; height: 100%; }
      .cod-value { font-size: 5.2mm; font-weight: 900; line-height: 1; margin: 0.25mm 0 0.7mm; }
      .signature {
        border: 0.2mm solid #111;
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-rows: auto 1fr auto;
        padding: 1.1mm;
      }
      .sign-hint { font-size: 2mm; line-height: 1.2; color: #222; }
      .footer {
        font-size: 2.05mm;
        border-top: 0.2mm dashed #333;
        padding-top: 0.7mm;
        line-height: 1.15;
        min-height: 0;
        overflow: hidden;
      }
      .header > *,
      .two-col > *,
      .route-courier-box > *,
      .route > *,
      .item-qr > *,
      .big-row > *,
      .cod-sign > * {
        min-width: 0;
        min-height: 0;
        overflow: hidden;
      }
      .route-courier-box { gap: 1mm; }
      .route-courier-card {
        background: #f8fafc;
        border: 0.25mm solid #1e293b;
        padding: 0.9mm 1.1mm;
        display: grid;
        grid-template-rows: auto auto auto;
        gap: 0.2mm;
        min-height: 0;
      }
      .route-courier-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 2.1mm;
        font-weight: 800;
        letter-spacing: 0.2px;
        color: #334155;
      }
      .route-courier-badge {
        font-size: 1.8mm;
        font-weight: 900;
        background: #0f172a;
        color: #ffffff;
        padding: 0.2mm 0.8mm;
        border-radius: 0.3mm;
      }
      .route-courier-badge--deliv {
        background: #0369a1;
      }
      .route-courier-val {
        font-size: 2.9mm;
        font-weight: 900;
        color: #0f172a;
        line-height: 1.15;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .route-courier-shipper {
        font-size: 2.2mm;
        color: #475569;
        line-height: 1.1;
      }
      .route-courier-shipper strong {
        color: #0369a1;
        font-weight: 800;
        font-size: 2.4mm;
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
      .item-qr .block {
        display: grid;
        align-content: start;
      }
      .screen-toolbar {
        position: sticky;
        top: 0;
        z-index: 9999;
        background: #0f172a;
        color: #ffffff;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: -12px auto 12px auto;
        max-width: 100mm;
        border-radius: 6px;
      }
      .toolbar-info strong {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: #f8fafc;
      }
      .toolbar-info span {
        display: block;
        font-size: 11px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .toolbar-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .btn-print {
        background: #2563eb;
        color: #ffffff;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
      }
      .btn-print:hover {
        background: #1d4ed8;
      }
      .btn-close {
        background: #334155;
        color: #cbd5e1;
        border: none;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      }
      .btn-close:hover {
        background: #475569;
        color: #ffffff;
      }
      @media print {
        .no-print {
          display: none !important;
        }
        @page { size: 100mm 150mm; margin: 0; }
        html, body { width: 100mm; height: auto; min-height: 0; margin: 0; padding: 0; background: #fff; }
        body { padding: 0; }
        .sheet {
          margin: 0;
          box-shadow: none;
          page-break-inside: avoid;
          break-inside: avoid;
          page-break-after: always;
          break-after: page;
        }
        .sheet:last-of-type {
          page-break-after: auto;
          break-after: auto;
        }
      }
    </style>
  </head>
  <body>
    <header class="no-print screen-toolbar">
      <div class="toolbar-info">
        <strong>Xuất / In Vận Đơn (${payloads.length} đơn)</strong>
        <span>Để lưu file PDF: chọn máy in <b>"Save as PDF"</b> hoặc <b>"Lưu dưới dạng PDF"</b></span>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="btn-print" onclick="window.print()">In / Lưu PDF</button>
        <button type="button" class="btn-close" onclick="window.close()">Đóng</button>
      </div>
    </header>
${sheets}
  </body>
</html>`;
}

function buildLabelHtml(payload: ShippingLabelPrintPayload): string {
  return buildMultiLabelHtml([payload]);
}

export function openMultiShippingLabelPrint(payloads: ShippingLabelPrintPayload[]): boolean {
  if (!payloads || payloads.length === 0) {
    return false;
  }

  const popup = window.open('', '_blank', 'width=480,height=900,scrollbars=yes,resizable=yes');
  if (!popup) {
    return false;
  }

  const html = buildMultiLabelHtml(payloads);
  try {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      popup.print();
    }, 280);
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

export function openShippingLabelPrint(payload: ShippingLabelPrintPayload): boolean {
  return openMultiShippingLabelPrint([payload]);
}

export interface RouteCourierResolution {
  routeName: string;
  courierId: string;
}

export function resolveRouteAndCourier(
  address?: string | null,
  ward?: string | null,
  district?: string | null,
  hubCode?: string | null,
  isPickup: boolean = true,
): RouteCourierResolution {
  const text = `${address || ''} ${ward || ''} ${district || ''} ${hubCode || ''}`.toLowerCase();

  // 1. Hà Nội
  if (
    text.includes('hàng bài') ||
    text.includes('hoàn kiếm') ||
    text.includes('tràng tiền') ||
    text.includes('00101w001') ||
    (text.includes('hub_hn_tx') && text.includes('hoàn kiếm'))
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HN-HK01 (Bắc Hàng Bài)', courierId: '30002001' }
      : { routeName: 'ROUTE-HN-HK02 (Nam Hàng Bài)', courierId: '30002002' };
  }
  if (
    text.includes('kim mã') ||
    text.includes('ba đình') ||
    text.includes('điện biên') ||
    text.includes('00102w001') ||
    text.includes('hub_hn_bd')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HN-BD01 (Đông Kim Mã)', courierId: '30002003' }
      : { routeName: 'ROUTE-HN-BD02 (Tây Kim Mã)', courierId: '30002004' };
  }
  if (
    text.includes('dịch vọng') ||
    text.includes('cầu giấy') ||
    text.includes('00103w001') ||
    text.includes('hub_hn_cg')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HN-CG01 (Bắc Dịch Vọng)', courierId: '30002005' }
      : { routeName: 'ROUTE-HN-CG02 (Nam Dịch Vọng)', courierId: '30002006' };
  }
  if (
    text.includes('trung liệt') ||
    text.includes('đống đa') ||
    text.includes('thái hà') ||
    text.includes('khương mai') ||
    text.includes('thanh xuân') ||
    text.includes('00104w001')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HN-DD01 (Đông Thái Hà)', courierId: '30002007' }
      : { routeName: 'ROUTE-HN-DD02 (Tây Thái Hà)', courierId: '30002008' };
  }

  // 2. Đà Nẵng
  if (
    text.includes('thạch thang') ||
    text.includes('hải châu 1') ||
    text.includes('bạch đằng') ||
    text.includes('04801w001') ||
    text.includes('hub_dn_hc')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-DN-HC01 (Bắc Bạch Đằng)', courierId: '30002009' }
      : { routeName: 'ROUTE-DN-HC02 (Nam Bạch Đằng)', courierId: '30002010' };
  }
  if (
    text.includes('thanh bình') ||
    text.includes('khuê trung') ||
    text.includes('cẩm lệ')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-DN-HC03 (Đông Thanh Bình)', courierId: '30002011' }
      : { routeName: 'ROUTE-DN-HC04 (Tây Thanh Bình)', courierId: '30002012' };
  }
  if (
    text.includes('an hải bắc') ||
    text.includes('sơn trà') ||
    text.includes('hub_dn_st')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-DN-ST01 (Bắc Sông Hàn)', courierId: '30002013' }
      : { routeName: 'ROUTE-DN-ST02 (Nam Sông Hàn)', courierId: '30002014' };
  }

  // 3. TP. Hồ Chí Minh
  if (
    text.includes('bến thành') ||
    text.includes('bến nghé') ||
    (text.includes('quận 1') && !text.includes('quận 12')) ||
    text.includes('07901w001') ||
    text.includes('hub_hcm_q1')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HCM-Q101 (Đông Bến Thành)', courierId: '30002015' }
      : { routeName: 'ROUTE-HCM-Q102 (Tây Bến Thành)', courierId: '30002016' };
  }
  if (
    text.includes('lê văn sỹ') ||
    (text.includes('quận 3') && text.includes('13')) ||
    text.includes('quận 4') ||
    text.includes('hoàng diệu') ||
    text.includes('07903w001') ||
    text.includes('hub_hcm_q4')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HCM-Q301 (Bắc Lê Văn Sỹ)', courierId: '30002017' }
      : { routeName: 'ROUTE-HCM-Q302 (Nam Lê Văn Sỹ)', courierId: '30002018' };
  }
  if (
    text.includes('cộng hòa') ||
    text.includes('tân bình') ||
    text.includes('quận 10') ||
    text.includes('07913w001') ||
    text.includes('hub_hcm_tb') ||
    text.includes('hub_hcm_q10')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HCM-TB01 (Đông Cộng Hòa)', courierId: '30002019' }
      : { routeName: 'ROUTE-HCM-TB02 (Tây Cộng Hòa)', courierId: '30002020' };
  }
  if (
    text.includes('an phú đông') ||
    text.includes('quận 12') ||
    text.includes('thủ đức') ||
    text.includes('bình thọ') ||
    text.includes('003079b001')
  ) {
    return isPickup
      ? { routeName: 'ROUTE-HCM-Q1201 (Bắc Hà Huy Giáp)', courierId: '30002021' }
      : { routeName: 'ROUTE-HCM-Q1202 (Nam Hà Huy Giáp)', courierId: '30002022' };
  }

  // Fallbacks theo vùng
  if (text.includes('hà nội') || text.includes('ha noi')) {
    return isPickup
      ? { routeName: 'ROUTE-HN-GEN01 (Tuyến Lấy HN)', courierId: '30002001' }
      : { routeName: 'ROUTE-HN-GEN02 (Tuyến Phát HN)', courierId: '30002002' };
  }
  if (text.includes('đà nẵng') || text.includes('da nang')) {
    return isPickup
      ? { routeName: 'ROUTE-DN-GEN01 (Tuyến Lấy ĐN)', courierId: '30002009' }
      : { routeName: 'ROUTE-DN-GEN02 (Tuyến Phát ĐN)', courierId: '30002010' };
  }

  return isPickup
    ? { routeName: 'ROUTE-HCM-GEN01 (Tuyến Lấy HCM)', courierId: '30002015' }
    : { routeName: 'ROUTE-HCM-GEN02 (Tuyến Phát HCM)', courierId: '30002016' };
}

