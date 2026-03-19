export type HubScanCodeFormat = 'QR' | 'BARCODE' | 'UNKNOWN';

export interface HubScanCodeResult {
  value: string;
  format: HubScanCodeFormat;
}

export interface HubScannerAdapter {
  scanShipmentCode: () => Promise<HubScanCodeResult | null>;
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
