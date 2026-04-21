import qrcode from 'qrcode-generator';

export type BagTransportMethod = 'T' | 'A';

export interface BagLabelPrintPayload {
  bagCode: string;
  originHubCode: string;
  destinationHubCode: string;
  status: string;
  createdAtText: string;
  transportMethod?: BagTransportMethod;
}

export interface BagLabelDisplayModel {
  methodLetter: BagTransportMethod;
  packingHubCode: string;
  printedAtText: string;
  largeCode: string;
  routeCode: string;
  barcodeText: string;
  destinationText: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function toDigits(value: string): string {
  return (value.match(/\d/g) ?? []).join('');
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

function getHubTriplet(hubCode: string): string {
  const digits = toDigits(hubCode);
  if (digits.length >= 3) {
    return digits.slice(0, 3);
  }

  return digits.padStart(3, '0');
}

function getLargeCode(payload: BagLabelPrintPayload): string {
  const bagDigits = toDigits(payload.bagCode);
  if (bagDigits.length >= 3) {
    return bagDigits.slice(-3);
  }

  const destinationDigits = toDigits(payload.destinationHubCode);
  if (destinationDigits.length >= 3) {
    return destinationDigits.slice(-3);
  }

  return '000';
}

function getRouteCode(payload: BagLabelPrintPayload): string {
  const hubTriplet = getHubTriplet(payload.destinationHubCode);
  const suffix = payload.transportMethod === 'A' ? 'AW1' : 'GW1';
  return `${hubTriplet}${suffix}`;
}

function getBarcodeText(payload: BagLabelPrintPayload): string {
  const normalized = normalizeCode(payload.bagCode);
  const digits = toDigits(normalized).padStart(10, '0').slice(-10);
  if (normalized.startsWith('MB')) {
    return `MB${digits}`;
  }
  return `MB${digits}`;
}

export function formatBagTransportMethodLabel(method?: BagTransportMethod): string {
  if (method === 'A') {
    return 'A (Air)';
  }

  if (method === 'T') {
    return 'T (Trucking)';
  }

  return 'T (Trucking)';
}

export function buildBagLabelDisplayModel(payload: BagLabelPrintPayload): BagLabelDisplayModel {
  const methodLetter = payload.transportMethod === 'A' ? 'A' : 'T';

  return {
    methodLetter,
    packingHubCode: normalizeCode(payload.originHubCode || 'HUB-NA'),
    printedAtText: payload.createdAtText || '-',
    largeCode: getLargeCode(payload),
    routeCode: getRouteCode(payload),
    barcodeText: getBarcodeText(payload),
    destinationText: normalizeCode(payload.destinationHubCode || 'KHONG_CO'),
  };
}

function buildSheetHtml(payload: BagLabelPrintPayload): string {
  const display = buildBagLabelDisplayModel(payload);
  const qr = buildQrSvg(payload.bagCode);

  return `
    <article class="sheet">
      <div class="top-row">
        <div class="top-text">
          <div>TTC dong bao: ${escapeHtml(display.packingHubCode)}</div>
          <div>In: ${escapeHtml(display.printedAtText)}</div>
        </div>
        <div class="method-letter">${escapeHtml(display.methodLetter)}</div>
      </div>

      <div class="main-row">
        <div class="large-code">${escapeHtml(display.largeCode)}</div>
        <div class="qr-box">${qr}</div>
      </div>

      <div class="route-code">${escapeHtml(display.routeCode)}</div>
      <div class="barcode" aria-hidden="true"></div>
      <div class="barcode-text">${escapeHtml(display.barcodeText)}</div>
      <div class="destination-line">Dich den: ${escapeHtml(display.destinationText)}</div>
    </article>
  `;
}

function buildHtml(payloads: BagLabelPrintPayload[]): string {
  const title =
    payloads.length > 1
      ? `In ${payloads.length} tem bao`
      : `In tem bao ${payloads[0]?.bagCode ?? ''}`;

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: 76mm 112mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #fff; }
      body {
        font-family: "Segoe UI", Arial, Helvetica, sans-serif;
        color: #111;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .sheet {
        width: 76mm;
        height: 112mm;
        margin: 0 auto;
        border: 0.25mm solid #111;
        padding: 2.5mm;
        display: grid;
        grid-template-rows: auto auto auto auto auto 1fr;
        gap: 1.8mm;
        page-break-after: always;
        overflow: hidden;
      }
      .sheet:last-child { page-break-after: auto; }
      .top-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 2mm;
        align-items: start;
        border-bottom: 0.2mm solid #111;
        padding-bottom: 1.4mm;
      }
      .top-text {
        font-size: 2.8mm;
        line-height: 1.22;
      }
      .method-letter {
        font-size: 8mm;
        font-weight: 900;
        line-height: 1;
      }
      .main-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 26mm;
        align-items: center;
        gap: 2mm;
      }
      .large-code {
        font-size: 18mm;
        font-weight: 900;
        line-height: 1;
        text-align: center;
      }
      .qr-box {
        min-height: 26mm;
        display: grid;
        place-items: center;
      }
      .bag-qr {
        width: 24mm;
        height: 24mm;
        display: block;
        background: #fff;
      }
      .bag-qr-fallback {
        width: 24mm;
        height: 24mm;
        border: 0.2mm solid #111;
        display: grid;
        place-items: center;
        font-size: 3.6mm;
        font-weight: 700;
      }
      .route-code {
        text-align: center;
        font-size: 8.5mm;
        font-weight: 900;
        letter-spacing: 0.2mm;
        line-height: 1;
      }
      .barcode {
        height: 12mm;
        border: 0.2mm solid #111;
        background:
          repeating-linear-gradient(
            90deg,
            #111 0mm,
            #111 0.35mm,
            #fff 0.35mm,
            #fff 0.75mm,
            #111 0.75mm,
            #111 0.95mm,
            #fff 0.95mm,
            #fff 1.3mm
          );
      }
      .barcode-text {
        text-align: center;
        font-size: 6.1mm;
        line-height: 1;
        font-weight: 800;
      }
      .destination-line {
        font-size: 4.8mm;
        line-height: 1.15;
        font-weight: 700;
      }
      @media print {
        html, body { width: 76mm; height: 112mm; }
        .sheet { margin: 0; }
      }
    </style>
  </head>
  <body>
    ${payloads.map((payload) => buildSheetHtml(payload)).join('\n')}
  </body>
</html>`;
}

function openPrintWindow(html: string): boolean {
  const popup = window.open('', '_blank', 'width=640,height=860');
  if (!popup) {
    return false;
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    popup.print();
  }, 220);

  return true;
}

export function openBagLabelBatchPrint(payloads: BagLabelPrintPayload[]): boolean {
  if (payloads.length === 0) {
    return false;
  }

  return openPrintWindow(buildHtml(payloads));
}

export function openBagLabelPrint(payload: BagLabelPrintPayload): boolean {
  return openBagLabelBatchPrint([payload]);
}

