import qrcode from 'qrcode-generator';

import { formatDateTime } from '../../../../utils/format';
import { LINEHAUL_TRIP_TYPE_LABELS } from './linehaulTrips';
import type { LinehaulTrip } from './linehaulTrips';

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateBarcodeSvg(code: string): string {
  const normalizedCode = code
    .split('')
    .map((char) => {
      const charCode = char.charCodeAt(0);
      return charCode >= 32 && charCode <= 126 ? char : '-';
    })
    .join('');
  const codes = [104, ...normalizedCode.split('').map((char) => char.charCodeAt(0) - 32)];
  const checksum =
    codes.reduce((sum, value, index) => sum + (index === 0 ? value : value * index), 0) % 103;
  const barcodeCodes = [...codes, checksum, 106];
  let cursor = 0;
  const bars: string[] = [];

  for (const value of barcodeCodes) {
    const pattern = CODE128_PATTERNS[value] ?? CODE128_PATTERNS[0];
    pattern.split('').forEach((rawWidth, index) => {
      const width = Number(rawWidth);
      if (index % 2 === 0) {
        bars.push(`<rect x="${cursor}" y="0" width="${width}" height="52" fill="#111827" />`);
      }
      cursor += width;
    });
  }

  return `<svg width="100%" height="52" viewBox="0 0 ${cursor} 52" preserveAspectRatio="none" role="img" aria-label="Barcode ${escapeHtml(normalizedCode)}"><rect width="${cursor}" height="52" fill="#ffffff" />${bars.join('')}</svg>`;
}

function getQrDataUrl(data: Record<string, unknown>): string {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(JSON.stringify(data));
    qr.make();
    return qr.createDataURL(5);
  } catch {
    return '';
  }
}

function buildNexusLogoSvg(): string {
  return `
    <svg class="brand-mark" viewBox="0 0 210 210" role="img" aria-label="NEXUS">
      <rect x="4" y="4" width="202" height="202" rx="40" fill="#ffffff" stroke="#0f172a" stroke-width="8" />
      <rect x="31" y="31" width="148" height="148" rx="28" fill="#185FA5" />
      <path d="M61 151V59h27l35 49V59h26v92h-26L88 102v49H61Z" fill="#ffffff" />
      <circle cx="155" cy="151" r="7" fill="#85B7EB" />
    </svg>
  `;
}

function formatPrintValue(value: string | null | undefined, fallback = 'N/A'): string {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : fallback;
}

function buildTripSealPrintHtml(trip: LinehaulTrip): string {
  const driverName = formatPrintValue(trip.driverName);
  const driverPhone = formatPrintValue(trip.driverPhone);
  const vehiclePlate = formatPrintValue(trip.vehiclePlate);
  const printedAt = formatDateTime(new Date().toISOString());
  const qrDataUrl = getQrDataUrl({
    vehicleCode: trip.tripCode,
    tripCode: trip.tripCode,
    originHubCode: trip.originHubCode,
    destinationHubCode: trip.destinationHubCode,
    fromHubCode: trip.originHubCode,
    toHubCode: trip.destinationHubCode,
    tripType: trip.tripType,
    licensePlate: vehiclePlate,
    driverName,
    driverPhone,
    plannedStartAt: trip.plannedStartAt,
    plannedEndAt: trip.plannedEndAt,
  });
  const qrMarkup = qrDataUrl
    ? `<img src="${qrDataUrl}" alt="QR tem xe" />`
    : '<div class="qr-fallback">QR</div>';

  return `
    <section class="seal-ticket">
      <header class="ticket-header">
        <div class="brand-lockup">
          ${buildNexusLogoSvg()}
          <div>
            <h1>NEXUS LOGISTICS</h1>
            <p>VEHICLE TRANSIT LABEL</p>
          </div>
        </div>
        <div class="header-meta">
          <strong>${escapeHtml(LINEHAUL_TRIP_TYPE_LABELS[trip.tripType])}</strong>
          <span>In lúc ${escapeHtml(printedAt)}</span>
        </div>
      </header>

      <section class="scan-row">
        <div class="code-panel">
          <div class="code-label">Mã tem xe / mã chuyến</div>
          <strong>${escapeHtml(trip.tripCode)}</strong>
          <div class="barcode-box">
            ${generateBarcodeSvg(trip.tripCode)}
          </div>
          <span>${escapeHtml(trip.tripCode)}</span>
        </div>
        <aside class="qr-card">
          ${qrMarkup}
          <span>QR Courier Mobile</span>
        </aside>
      </section>

      <section class="route-strip" aria-label="Hub đi đến">
        <article>
          <span>Hub đi</span>
          <strong>${escapeHtml(trip.originHubCode)}</strong>
        </article>
        <div class="route-arrow">-></div>
        <article>
          <span>Hub đến</span>
          <strong>${escapeHtml(trip.destinationHubCode)}</strong>
        </article>
      </section>

      <section class="schedule-grid">
        <article>
          <span>Ngày giờ bắt đầu</span>
          <strong>${escapeHtml(formatDateTime(trip.plannedStartAt))}</strong>
        </article>
        <article>
          <span>Ngày giờ kết thúc</span>
          <strong>${escapeHtml(formatDateTime(trip.plannedEndAt))}</strong>
        </article>
      </section>

      <section class="vehicle-grid">
        <article class="driver-card">
          <span>Tài xế</span>
          <strong>${escapeHtml(driverName)}</strong>
        </article>
        <article>
          <span>Số điện thoại</span>
          <strong>${escapeHtml(driverPhone)}</strong>
        </article>
        <article class="plate-card">
          <span>Biển số xe</span>
          <strong>${escapeHtml(vehiclePlate)}</strong>
        </article>
        <article>
          <span>Loại chuyến</span>
          <strong>${escapeHtml(LINEHAUL_TRIP_TYPE_LABELS[trip.tripType])}</strong>
        </article>
      </section>

      <footer>
        Tem dùng cho bước Xe đi / Xe đến. Courier quét QR hoặc barcode để lấy mã tem xe, hub đi,
        hub đến và biển số; sau đó quét seal xe theo quy trình vận hành.
      </footer>
    </section>
  `;
}

export function printLinehaulTripSeal(trip: LinehaulTrip): boolean {
  const printWindow = window.open('', 'linehaul-trip-seal-print', 'width=980,height=760');
  if (!printWindow) {
    return false;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>In tem xe ${escapeHtml(trip.tripCode)}</title>
        <style>
          @page { size: A5 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          html,
          body { margin: 0; padding: 0; background: #ffffff; }
          body {
            width: 132mm;
            min-height: 194mm;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          }
          .seal-ticket {
            width: 132mm;
            min-height: 194mm;
            border: 0.55mm solid #0f172a;
            border-radius: 3mm;
            padding: 5mm;
            display: grid;
            grid-template-rows: auto auto auto auto 1fr auto;
            gap: 3mm;
            overflow: hidden;
          }
          .ticket-header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 4mm;
            border-bottom: 0.45mm solid #0f172a;
            padding-bottom: 3mm;
          }
          .brand-lockup {
            display: grid;
            grid-template-columns: 13mm minmax(0, 1fr);
            align-items: center;
            gap: 3mm;
            min-width: 0;
          }
          .brand-mark { width: 13mm; height: 13mm; display: block; }
          h1 {
            margin: 0;
            color: #0f172a;
            font-size: 15pt;
            line-height: 1;
            font-weight: 800;
            letter-spacing: 0;
            white-space: nowrap;
          }
          p {
            margin: 1.2mm 0 0;
            color: #475569;
            font-size: 6.8pt;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }
          .header-meta {
            display: grid;
            gap: 1mm;
            justify-items: end;
            max-width: 38mm;
            text-align: right;
          }
          .header-meta strong {
            border: 0.3mm solid #185fa5;
            border-radius: 999px;
            background: #eff6ff;
            color: #185fa5;
            padding: 1.3mm 2.2mm;
            font-size: 8pt;
            line-height: 1;
            white-space: nowrap;
          }
          .header-meta span,
          .code-label,
          .code-panel > span,
          .route-strip span,
          .schedule-grid span,
          .vehicle-grid span,
          .qr-card span {
            color: #64748b;
            font-size: 6.7pt;
            line-height: 1.15;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          .scan-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 34mm;
            gap: 3mm;
            align-items: stretch;
          }
          .code-panel,
          .qr-card,
          .route-strip article,
          .schedule-grid article,
          .vehicle-grid article {
            min-width: 0;
            border: 0.3mm solid #cbd5e1;
            border-radius: 2mm;
            background: #ffffff;
          }
          .code-panel {
            display: grid;
            grid-template-rows: auto auto 16mm auto;
            gap: 1.6mm;
            padding: 3mm;
          }
          .code-panel strong {
            font-family: "Courier New", monospace;
            color: #0f172a;
            font-size: 12pt;
            line-height: 1.12;
            font-weight: 800;
            letter-spacing: 0;
            overflow-wrap: anywhere;
          }
          .barcode-box {
            display: grid;
            align-items: center;
            min-height: 16mm;
            border: 0.25mm solid #e2e8f0;
            background: #ffffff;
            padding: 1mm;
          }
          .barcode-box svg {
            display: block;
            width: 100%;
            height: 13mm;
          }
          .code-panel > span {
            font-family: "Courier New", monospace;
            color: #0f172a;
            font-size: 7pt;
            letter-spacing: 0;
            text-transform: none;
            text-align: center;
            overflow-wrap: anywhere;
          }
          .qr-card {
            display: grid;
            grid-template-rows: 1fr auto;
            align-content: center;
            justify-items: center;
            gap: 1.5mm;
            padding: 2.2mm;
            text-align: center;
          }
          .qr-card img,
          .qr-fallback {
            width: 28mm;
            height: 28mm;
            border: 0.25mm solid #cbd5e1;
            image-rendering: crisp-edges;
          }
          .qr-fallback {
            display: grid;
            place-items: center;
            color: #0f172a;
            font-size: 15pt;
            font-weight: 800;
          }
          .qr-card span {
            color: #0f172a;
            font-size: 6.5pt;
            letter-spacing: 0;
            text-transform: none;
          }
          .route-strip {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 10mm minmax(0, 1fr);
            gap: 2mm;
            align-items: stretch;
          }
          .route-strip article {
            min-height: 22mm;
            display: grid;
            align-content: center;
            gap: 2mm;
            border: 0.5mm solid #0f172a;
            background: #f8fafc;
            padding: 3mm;
            text-align: center;
          }
          .route-strip strong {
            color: #0f172a;
            font-size: 22pt;
            line-height: 1;
            font-weight: 900;
            overflow-wrap: anywhere;
          }
          .route-arrow {
            display: grid;
            place-items: center;
            color: #0f172a;
            font-size: 15pt;
            font-weight: 900;
          }
          .schedule-grid,
          .vehicle-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2mm;
          }
          .schedule-grid article,
          .vehicle-grid article {
            min-height: 15mm;
            display: grid;
            align-content: center;
            gap: 1.4mm;
            padding: 2.5mm;
            background: #f8fafc;
          }
          .schedule-grid strong,
          .vehicle-grid strong {
            color: #0f172a;
            font-size: 10pt;
            line-height: 1.15;
            font-weight: 800;
            overflow-wrap: anywhere;
          }
          .driver-card strong {
            font-size: 11pt;
          }
          .plate-card {
            border-color: #0f172a;
            background: #ffffff;
          }
          .plate-card strong {
            font-family: "Arial Black", Arial, Helvetica, sans-serif;
            color: #0f172a;
            font-size: 16pt;
            line-height: 1;
            letter-spacing: 0;
            text-transform: uppercase;
          }
          footer {
            border-top: 0.25mm solid #cbd5e1;
            padding-top: 2.2mm;
            color: #475569;
            font-size: 7.3pt;
            line-height: 1.35;
            text-align: center;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>${buildTripSealPrintHtml(trip)}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}
