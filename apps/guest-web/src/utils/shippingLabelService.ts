import qrcode from 'qrcode-generator';
import type { ShipmentResponse } from '../services/api/shipment.api';

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function newlineToBreaks(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function formatVnd(val?: number): string {
  if (!val || val <= 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
}

function formatDate(val?: string): string {
  if (!val) return new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
  const d = new Date(val);
  return `${d.toLocaleTimeString('vi-VN')} ${d.toLocaleDateString('vi-VN')}`;
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

export function buildShippingLabelHtml(shipment: ShipmentResponse): string {
  const meta = shipment.metadata || {};
  const sender = meta.sender || {};
  const receiver = meta.receiver || {};
  const pkg = meta.package || {};
  const service = meta.service || {};

  const codeText = escapeHtml(shipment.code);
  const senderName = escapeHtml(sender.name || 'Người gửi');
  const senderPhone = escapeHtml(sender.phone || '');
  const senderAddress = newlineToBreaks(
    sender.address ||
    [sender.addressDetail, sender.ward, sender.district, sender.province].filter(Boolean).join(', ') ||
    'Chưa có địa chỉ gửi'
  );

  const receiverName = escapeHtml(receiver.name || 'Người nhận');
  const receiverPhone = escapeHtml(receiver.phone || '');
  const receiverAddress = newlineToBreaks(
    receiver.address ||
    [receiver.addressDetail, receiver.ward, receiver.district, receiver.province].filter(Boolean).join(', ') ||
    'Chưa có địa chỉ nhận'
  );

  const senderHub = escapeHtml(
    sender.hubCode || meta.senderHubCode || meta.originHubCode || meta.routing?.originHubCode || 'HUB-HCM-001'
  );
  const receiverHub = escapeHtml(
    receiver.hubCode || meta.receiverHubCode || meta.destinationHubCode || meta.routing?.destinationHubCode || 'HUB-HN-001'
  );

  const receiverProvinceUpper = escapeHtml(
    (receiver.province || 'VIỆT NAM').toUpperCase()
  );

  const itemTypeStr = escapeHtml(pkg.itemName || pkg.itemType || 'Hàng hóa bưu gửi');
  const weightKgStr = `${pkg.weightKg || meta.weightKg || 1} kg`;
  const codVal = Number(meta.codAmount || pkg.codAmount || 0);
  const codAmountText = formatVnd(codVal);
  const shippingFeeText = formatVnd(Number(meta.shippingFee || meta.estimatedFee || 22000));

  const pickupType = meta.pickupType || service.pickupType || 'PICKUP';
  const pickupTypeLabel = pickupType === 'DROP_OFF' ? 'GỬI TẠI BƯU CỤC' : 'LẤY HÀNG TẬN NƠI';

  const createdAtText = formatDate(shipment.createdAt);
  const deliveryInstruction = newlineToBreaks(
    meta.deliveryNote || meta.notes || 'Cho xem hàng, không cho thử. Chuyển phát nhanh Nexus.'
  );

  const qrSvg = buildQrSvg(`${window.location.origin}/?track=${encodeURIComponent(shipment.code)}`);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Phiếu gửi hàng #${codeText} - Nexus Express</title>
    <style>
      @page { size: 100mm 150mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 100mm; height: 150mm; margin: 0; padding: 0; background: #fff; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet {
        width: 100mm;
        height: 150mm;
        margin: 0 auto;
        padding: 3mm;
        border: 0.35mm solid #111;
        display: flex;
        flex-direction: column;
        gap: 1.5mm;
        overflow: hidden;
        background: #fff;
      }
      .block { border: 0.25mm solid #222; padding: 1.5mm; }
      .header {
        height: 20mm;
        display: grid;
        grid-template-columns: 38% 62%;
        gap: 1.5mm;
        align-items: center;
      }
      .brand { display: flex; flex-direction: column; gap: 0.5mm; }
      .brand-title { font-size: 3.4mm; font-weight: 900; letter-spacing: 0.3px; text-transform: uppercase; color: #1e3a8a; line-height: 1.1; }
      .service { font-size: 4mm; font-weight: 800; color: #0f172a; line-height: 1.1; }
      .badge-type { font-size: 2.2mm; font-weight: 800; background: #e0e7ff; color: #3730a3; padding: 0.8mm 1.5mm; border-radius: 1mm; width: fit-content; text-transform: uppercase; margin-top: 0.5mm; }
      .barcode-wrap { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5mm; }
      .barcode {
        width: 96%;
        height: 11mm;
        border: 0.2mm solid #000;
        background: repeating-linear-gradient(
          90deg,
          #000 0mm, #000 0.5mm,
          #fff 0.5mm, #fff 0.9mm,
          #000 0.9mm, #000 1.2mm,
          #fff 1.2mm, #fff 1.6mm
        );
      }
      .ship-code { font-size: 2.8mm; font-weight: 800; line-height: 1.1; margin-top: 0.5mm; font-family: monospace; }
      .two-col {
        height: 30mm;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5mm;
      }
      .two-col .block {
        padding: 1.5mm;
        overflow: hidden;
      }
      .label { font-size: 2.3mm; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 0.5mm; }
      .name { font-size: 2.9mm; font-weight: 800; line-height: 1.2; margin-bottom: 0.5mm; color: #0f172a; }
      .text { font-size: 2.3mm; line-height: 1.25; word-break: break-word; overflow: hidden; color: #1e293b; }
      .route {
        height: 14mm;
        display: grid;
        grid-template-columns: 66% 34%;
        gap: 1.5mm;
      }
      .route-main {
        border: 0.25mm solid #111;
        font-size: 6.5mm;
        font-weight: 900;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: #f8fafc;
        color: #0f172a;
      }
      .route-sub {
        border: 0.25mm solid #111;
        font-size: 2.8mm;
        font-weight: 800;
        text-transform: uppercase;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        line-height: 1.2;
        background: #fff;
      }
      .cod-grid {
        height: 20mm;
        display: grid;
        grid-template-columns: 55% 45%;
        gap: 1.5mm;
      }
      .cod-box {
        border: 0.3mm solid #1e3a8a;
        background: #eff6ff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 1mm;
      }
      .cod-title { font-size: 2.6mm; font-weight: 800; color: #1e40af; text-transform: uppercase; }
      .cod-amount { font-size: 5.5mm; font-weight: 900; color: #1d4ed8; font-family: monospace; }
      .fee-box {
        border: 0.25mm solid #334155;
        padding: 1.2mm;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        font-size: 2.2mm;
      }
      .fee-row { display: flex; justify-content: space-between; align-items: center; }
      .goods-box {
        height: 16mm;
        border: 0.25mm solid #222;
        padding: 1.5mm;
        font-size: 2.3mm;
        line-height: 1.25;
      }
      .instruction-box {
        height: 18mm;
        border: 0.25mm solid #222;
        padding: 1.5mm;
        font-size: 2.3mm;
        line-height: 1.3;
        background: #fffbeb;
      }
      .footer-row {
        height: 18mm;
        display: grid;
        grid-template-columns: 22mm 1fr;
        gap: 1.5mm;
        align-items: center;
      }
      .qr-wrap {
        width: 18mm;
        height: 18mm;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr-svg { width: 100%; height: 100%; }
      .sign-box {
        height: 100%;
        border: 0.25mm dashed #475569;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1mm 2mm;
        font-size: 2.2mm;
        text-align: center;
      }
      .meta-footer { font-size: 2mm; color: #64748b; display: flex; justify-content: space-between; padding: 0 1mm; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <!-- 1. HEADER: BRAND & BARCODE -->
      <div class="block header">
        <div class="brand">
          <div class="brand-title">NEXUS LOGISTICS</div>
          <div class="service">CHUYỂN PHÁT NHANH</div>
          <div class="badge-type">${pickupTypeLabel}</div>
        </div>
        <div class="barcode-wrap">
          <div class="barcode"></div>
          <div class="ship-code">#${codeText}</div>
        </div>
      </div>

      <!-- 2. ROUTE INFO -->
      <div class="route">
        <div class="route-main">${receiverProvinceUpper}</div>
        <div class="route-sub">
          <span style="font-size: 2mm; color: #64748b;">TUYẾN PHÁT</span>
          <span style="font-size: 3.2mm; color: #0284c7;">${receiverHub}</span>
        </div>
      </div>

      <!-- 3. SENDER & RECEIVER -->
      <div class="two-col">
        <div class="block">
          <div class="label">NGƯỜI GỬI (FROM)</div>
          <div class="name">${senderName}</div>
          <div class="text" style="font-weight: 700; margin-bottom: 0.5mm;">SĐT: ${senderPhone || 'N/A'}</div>
          <div class="text">${senderAddress}</div>
          <div class="text" style="margin-top: 0.5mm; font-size: 2mm; color: #64748b;">Hub gửi: ${senderHub}</div>
        </div>

        <div class="block">
          <div class="label">NGƯỜI NHẬN (TO)</div>
          <div class="name">${receiverName}</div>
          <div class="text" style="font-weight: 700; margin-bottom: 0.5mm;">SĐT: ${receiverPhone || 'N/A'}</div>
          <div class="text">${receiverAddress}</div>
        </div>
      </div>

      <!-- 4. COD & FINANCIAL BLOCK -->
      <div class="cod-grid">
        <div class="cod-box">
          <div class="cod-title">TIỀN THU HỘ (COD)</div>
          <div class="cod-amount">${codAmountText}</div>
        </div>
        <div class="fee-box">
          <div class="fee-row">
            <span style="color: #64748b;">Trọng lượng:</span>
            <span style="font-weight: 800;">${weightKgStr}</span>
          </div>
          <div class="fee-row">
            <span style="color: #64748b;">Cước phí:</span>
            <span style="font-weight: 800;">${shippingFeeText}</span>
          </div>
          <div class="fee-row">
            <span style="color: #64748b;">Người trả cước:</span>
            <span style="font-weight: 700;">Người gửi</span>
          </div>
        </div>
      </div>

      <!-- 5. GOODS & INSTRUCTION -->
      <div class="goods-box">
        <div class="label">NỘI DUNG HÀNG HÓA</div>
        <div><strong>${itemTypeStr}</strong> - Khối lượng: ${weightKgStr}</div>
      </div>

      <div class="instruction-box">
        <div class="label">CHỈ DẪN CỦA NGƯỜI GỬI</div>
        <div>${deliveryInstruction}</div>
      </div>

      <!-- 6. QR & SIGNATURE -->
      <div class="footer-row">
        <div class="qr-wrap">${qrSvg}</div>
        <div class="sign-box">
          <span style="font-weight: 800;">CHỮ KÝ NGƯỜI NHẬN</span>
          <span style="font-size: 2mm; color: #64748b;">(Xác nhận hàng nguyên vẹn, không móp méo)</span>
          <span style="margin-top: 4mm;"></span>
        </div>
      </div>

      <div class="meta-footer">
        <span>Ngày tạo: ${createdAtText}</span>
        <span>Hotline: 1900-1234 | Tra cứu: nexus-ex.site</span>
      </div>
    </div>

    <script>
      window.onload = function() {
        window.print();
      };
    </script>
  </body>
</html>`;
}

export function printShippingLabel(shipment: ShipmentResponse): void {
  const html = buildShippingLabelHtml(shipment);
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // Fallback if popup blocked: use iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
  }
}
