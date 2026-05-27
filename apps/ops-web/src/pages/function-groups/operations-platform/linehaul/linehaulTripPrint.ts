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
      <rect x="0" y="0" width="200" height="200" rx="36" fill="#ffffff" />
      <rect x="18" y="18" width="164" height="164" rx="24" fill="#185FA5" />
      <text x="100" y="142" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="800" fill="#ffffff">N</text>
      <circle cx="100" cy="168" r="5" fill="#85B7EB" />
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

  return `
    <section class="seal-ticket">
      <header class="ticket-header">
        <div class="brand-lockup">
          ${buildNexusLogoSvg()}
          <div>
            <h1>NEXUS EXPRESS</h1>
            <p>LINEHAUL VEHICLE LABEL</p>
          </div>
        </div>
        <div class="trip-type">${escapeHtml(LINEHAUL_TRIP_TYPE_LABELS[trip.tripType])}</div>
      </header>

      <div class="trip-code-card">
        <span>Mã chuyến / mã tem xe</span>
        <strong>${escapeHtml(trip.tripCode)}</strong>
      </div>

      <div class="barcode-card">
        ${generateBarcodeSvg(trip.tripCode)}
        <span>${escapeHtml(trip.tripCode)}</span>
      </div>

      <section class="route-row">
        <article>
          <span>Hub đi</span>
          <strong>${escapeHtml(trip.originHubCode)}</strong>
        </article>
        <article>
          <span>Hub đến</span>
          <strong>${escapeHtml(trip.destinationHubCode)}</strong>
        </article>
      </section>

      <section class="main-grid">
        <div class="info-grid">
          <article>
            <span>Bắt đầu</span>
            <strong>${escapeHtml(formatDateTime(trip.plannedStartAt))}</strong>
          </article>
          <article>
            <span>Kết thúc</span>
            <strong>${escapeHtml(formatDateTime(trip.plannedEndAt))}</strong>
          </article>
          <article>
            <span>Tài xế</span>
            <strong>${escapeHtml(driverName)}</strong>
          </article>
          <article>
            <span>Số điện thoại</span>
            <strong>${escapeHtml(driverPhone)}</strong>
          </article>
          <article class="vehicle-plate">
            <span>Biển số xe</span>
            <strong>${escapeHtml(vehiclePlate)}</strong>
          </article>
          <article>
            <span>Trạng thái</span>
            <strong>Sẵn sàng in tem</strong>
          </article>
        </div>
        <aside class="qr-card">
          <img src="${qrDataUrl}" alt="QR tem xe" />
          <span>Quét bằng Courier Mobile</span>
        </aside>
      </section>

      <footer>
        Courier quét tem xe ở bước Xe đi, sau đó quét một hoặc nhiều seal xe để gắn seal với mã tem này.
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
          @page { size: A5; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
          .seal-ticket {
            width: 100%;
            min-height: 185mm;
            border: 2px solid #0f172a;
            border-radius: 6px;
            padding: 7mm;
            display: grid;
            grid-template-rows: auto auto auto auto 1fr auto;
            gap: 5mm;
          }
          .ticket-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 4mm;
          }
          .brand-lockup { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .brand-mark { width: 40px; height: 40px; flex: 0 0 40px; }
          h1 { margin: 0; color: #0f172a; font-size: 21px; line-height: 1; letter-spacing: 0.03em; }
          p { margin: 4px 0 0; color: #475569; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; }
          .trip-type {
            flex: 0 0 auto;
            border: 1px solid #185fa5;
            border-radius: 999px;
            background: #eff6ff;
            color: #185fa5;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
          }
          .trip-code-card {
            display: grid;
            gap: 4px;
            border: 2px solid #0f172a;
            border-radius: 6px;
            padding: 4mm;
            text-align: center;
          }
          .trip-code-card span,
          .barcode-card span,
          .route-row span,
          .info-grid span,
          .qr-card span {
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .trip-code-card strong {
            display: block;
            color: #0f172a;
            font-family: "Courier New", monospace;
            font-size: 17px;
            line-height: 1.2;
            letter-spacing: 0;
            overflow-wrap: anywhere;
          }
          .barcode-card {
            display: grid;
            gap: 2mm;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 3mm;
            text-align: center;
          }
          .barcode-card svg { display: block; width: 100%; height: 52px; }
          .barcode-card span {
            font-family: "Courier New", monospace;
            color: #0f172a;
            font-size: 10px;
            letter-spacing: 0;
            text-transform: none;
            overflow-wrap: anywhere;
          }
          .route-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4mm;
          }
          .route-row article {
            min-height: 24mm;
            display: grid;
            align-content: center;
            gap: 3mm;
            border: 2px solid #0f172a;
            border-radius: 6px;
            padding: 4mm;
            text-align: center;
          }
          .route-row strong {
            color: #0f172a;
            font-size: 27px;
            line-height: 1;
            overflow-wrap: anywhere;
          }
          .main-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 37mm;
            gap: 4mm;
            align-items: stretch;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3mm;
          }
          .info-grid article {
            min-height: 20mm;
            display: grid;
            align-content: center;
            gap: 2mm;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 3mm;
            background: #f8fafc;
          }
          .info-grid strong {
            color: #0f172a;
            font-size: 14px;
            line-height: 1.2;
            overflow-wrap: anywhere;
          }
          .vehicle-plate strong {
            font-size: 18px;
            letter-spacing: 0.04em;
          }
          .qr-card {
            display: grid;
            align-content: center;
            justify-items: center;
            gap: 3mm;
            border: 2px solid #0f172a;
            border-radius: 6px;
            padding: 3mm;
            text-align: center;
          }
          .qr-card img {
            width: 31mm;
            height: 31mm;
            border: 1px solid #cbd5e1;
            image-rendering: crisp-edges;
          }
          .qr-card span {
            color: #0f172a;
            font-size: 9px;
            line-height: 1.25;
          }
          footer {
            border-top: 1px solid #cbd5e1;
            padding-top: 3mm;
            color: #475569;
            font-size: 10px;
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
