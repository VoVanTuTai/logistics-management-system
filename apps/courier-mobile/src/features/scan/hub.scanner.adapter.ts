export type HubScanCodeFormat = 'QR' | 'BARCODE' | 'UNKNOWN';

export interface HubScanCodeResult {
  value: string;
  format: HubScanCodeFormat;
}

export interface HubScannerAdapter {
  scanShipmentCode: () => Promise<HubScanCodeResult | null>;
}

interface RawScanPayload {
  data: string;
  type?: string | null;
}

class PlaceholderHubScannerAdapter implements HubScannerAdapter {
  async scanShipmentCode(): Promise<HubScanCodeResult | null> {
    // TODO(hub-scan): wire camera/scanner SDK adapter here.
    throw new Error('Hub scanner adapter is not configured yet.');
  }
}

let activeHubScannerAdapter: HubScannerAdapter = new PlaceholderHubScannerAdapter();

export function getHubScannerAdapter(): HubScannerAdapter {
  return activeHubScannerAdapter;
}

export function setHubScannerAdapter(adapter: HubScannerAdapter): void {
  activeHubScannerAdapter = adapter;
}

export function parseHubScannedCode(payload: RawScanPayload): HubScanCodeResult | null {
  const value = payload.data.trim();
  if (!value) {
    return null;
  }

  const rawType = payload.type?.toLowerCase() ?? '';
  const format: HubScanCodeFormat =
    rawType === 'qr' ? 'QR' : rawType.length > 0 ? 'BARCODE' : 'UNKNOWN';

  return {
    value,
    format,
  };
}
