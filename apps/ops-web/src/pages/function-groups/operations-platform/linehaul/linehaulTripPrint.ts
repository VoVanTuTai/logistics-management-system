import qrcode from 'qrcode-generator';

import { formatDateTime } from '../../../../utils/format';
import { LINEHAUL_TRIP_TYPE_LABELS } from './linehaulTrips';
import type { LinehaulTrip } from './linehaulTrips';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateBarcodeSvg(code: string): string {
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pattern = (hash % 100).toString(2).padStart(8, '0').repeat(5);
  const bars = pattern
    .split('')
    .map((bit, index) =>
      bit === '1'
        ? `<rect x="${index * (100 / pattern.length)}" y="0" width="1.4" height="46" fill="#000" />`
        : '',
    )
    .join('');

  return `<svg width="100%" height="46" viewBox="0 0 100 46" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="46" fill="#fff" />${bars}<rect x="0" y="0" width="2" height="46" fill="#000" /><rect x="97" y="0" width="3" height="46" fill="#000" /></svg>`;
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

function buildTripSealPrintHtml(trip: LinehaulTrip): string {
  const qrDataUrl = getQrDataUrl({
    vehicleCode: trip.tripCode,
    tripCode: trip.tripCode,
    originHubCode: trip.originHubCode,
    destinationHubCode: trip.destinationHubCode,
    fromHubCode: trip.originHubCode,
    toHubCode: trip.destinationHubCode,
    tripType: trip.tripType,
    licensePlate: trip.vehiclePlate ?? 'UNKNOWN',
  });

  return `
    <section class="seal-ticket">
      <header>
        <div>
          <h1>NEXUS EXPRESS</h1>
          <p>LINEHAUL VEHICLE LABEL</p>
        </div>
        <strong>${escapeHtml(LINEHAUL_TRIP_TYPE_LABELS[trip.tripType])}</strong>
      </header>
      <div class="seal-code">
        <span>Mã tem xe</span>
        <strong>${escapeHtml(trip.tripCode)}</strong>
      </div>
      <div class="barcode">${generateBarcodeSvg(trip.tripCode)}</div>
      <div class="route">
        <article>
          <span>Hub đi</span>
          <strong>${escapeHtml(trip.originHubCode)}</strong>
        </article>
        <article>
          <span>Hub đến</span>
          <strong>${escapeHtml(trip.destinationHubCode)}</strong>
        </article>
      </div>
      <div class="time-row">
        <article>
          <span>Bắt đầu</span>
          <strong>${escapeHtml(formatDateTime(trip.plannedStartAt))}</strong>
        </article>
        <article>
          <span>Kết thúc</span>
          <strong>${escapeHtml(formatDateTime(trip.plannedEndAt))}</strong>
        </article>
      </div>
      <div class="qr">
        <img src="${qrDataUrl}" alt="QR tem xe" />
      </div>
      <footer>Courier quét tem xe ở bước Xe đi, sau đó quét một hoặc nhiều seal xe để gắn seal với mã tem này.</footer>
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
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
          .seal-ticket { width: 100%; min-height: 185mm; box-sizing: border-box; border: 2px solid #111827; padding: 9mm; }
          header { display: flex; justify-content: space-between; gap: 12px; border-bottom: 3px solid #111827; padding-bottom: 8px; }
          h1 { margin: 0; font-size: 24px; letter-spacing: 0.04em; }
          p { margin: 4px 0 0; font-size: 12px; font-weight: 700; }
          header strong { align-self: start; border: 1px solid #111827; padding: 5px 8px; font-size: 12px; }
          .seal-code { display: grid; gap: 4px; margin: 14px 0 8px; text-align: center; }
          .seal-code span, .route span, .time-row span { color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .seal-code strong { font-size: 28px; letter-spacing: 0.05em; }
          .barcode { border: 1px solid #d1d5db; padding: 8px; }
          .route, .time-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
          .route article, .time-row article { border: 2px solid #111827; padding: 10px; text-align: center; }
          .route strong { display: block; margin-top: 6px; font-size: 24px; }
          .time-row strong { display: block; margin-top: 6px; font-size: 16px; }
          .qr { display: flex; justify-content: center; margin-top: 14px; }
          .qr img { width: 116px; height: 116px; border: 1px solid #111827; }
          footer { margin-top: 14px; border-top: 1px solid #d1d5db; padding-top: 8px; color: #475569; font-size: 11px; text-align: center; }
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
