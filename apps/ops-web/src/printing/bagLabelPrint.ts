import qrcode from 'qrcode-generator';

export interface BagLabelPrintPayload {
  bagCode: string;
  originHubCode: string;
  destinationHubCode: string;
  status: string;
  createdAtText: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildQrSvg(value: string): string {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(value || 'N/A', 'Byte');
    qr.make();
    return qr
      .createSvgTag({ cellSize: 3, margin: 0, scalable: true })
      .replace('<svg ', '<svg class="bag-qr" ');
  } catch {
    return '<div class="bag-qr-fallback">QR</div>';
  }
}

function buildHtml(payload: BagLabelPrintPayload): string {
  const bagCode = escapeHtml(payload.bagCode);
  const qr = buildQrSvg(payload.bagCode);
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nhan in bao tai ${bagCode}</title>
    <style>
      @page { size: 100mm 100mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
      body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; background: #fff; color: #000; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .sheet {
        width: 100mm;
        height: 100mm;
        border: 0.25mm solid #111;
        padding: 3mm;
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto auto auto 1fr;
        gap: 2mm;
        overflow: hidden;
      }
      .title {
        font-size: 5.2mm;
        font-weight: 800;
        letter-spacing: 0.2px;
      }
      .code {
        border: 0.25mm solid #111;
        padding: 2mm;
        text-align: center;
        font-size: 6.6mm;
        font-weight: 900;
        line-height: 1.05;
        word-break: break-all;
      }
      .meta {
        border: 0.2mm dashed #333;
        padding: 1.6mm 2mm;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 1mm 2mm;
        font-size: 3.1mm;
      }
      .meta b { font-size: 3.2mm; }
      .qr-wrap {
        border: 0.2mm solid #111;
        display: grid;
        place-items: center;
        padding: 2mm;
        gap: 1mm;
      }
      .bag-qr {
        width: 44mm;
        height: 44mm;
        display: block;
        background: #fff;
      }
      .bag-qr-fallback {
        width: 44mm;
        height: 44mm;
        border: 0.2mm solid #111;
        display: grid;
        place-items: center;
        font-size: 4mm;
        font-weight: 700;
      }
      .hint {
        font-size: 2.8mm;
        text-align: center;
      }
      @media print {
        html, body { width: 100mm; height: 100mm; }
        .sheet { margin: 0; }
      }
    </style>
  </head>
  <body>
    <article class="sheet">
      <div class="title">JMS NHAN BAO TAI</div>
      <div class="code">${bagCode}</div>
      <div class="meta">
        <div><b>Hub đi:</b> ${escapeHtml(payload.originHubCode)}</div>
        <div><b>Hub đích:</b> ${escapeHtml(payload.destinationHubCode)}</div>
        <div><b>Trạng thái:</b> ${escapeHtml(payload.status)}</div>
        <div><b>Tạo lúc:</b> ${escapeHtml(payload.createdAtText)}</div>
      </div>
      <div class="qr-wrap">
        ${qr}
        <div class="hint">Dán nhãn này lên bao và dùng để quét mã bao</div>
      </div>
    </article>
  </body>
</html>`;
}

export function openBagLabelPrint(payload: BagLabelPrintPayload): boolean {
  const popup = window.open('', '_blank', 'width=520,height=760');
  if (!popup) {
    return false;
  }

  const html = buildHtml(payload);
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    popup.print();
  }, 220);
  return true;
}

