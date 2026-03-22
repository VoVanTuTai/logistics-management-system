export type PickupScanCodeFormat = 'QR' | 'BARCODE' | 'UNKNOWN';

export interface PickupScanCodeResult {
  value: string;
  format: PickupScanCodeFormat;
}

export interface PickupScannerAdapter {
  scanShipmentCode: () => Promise<PickupScanCodeResult | null>;
}

interface RawScanPayload {
  data: string;
  type?: string | null;
}

class PlaceholderPickupScannerAdapter implements PickupScannerAdapter {
  async scanShipmentCode(): Promise<PickupScanCodeResult | null> {
    // TODO(pickup-scan): wire camera/scanner SDK adapter here.
    throw new Error('Scanner adapter is not configured yet.');
  }
}

let activePickupScannerAdapter: PickupScannerAdapter =
  new PlaceholderPickupScannerAdapter();

export function getPickupScannerAdapter(): PickupScannerAdapter {
  return activePickupScannerAdapter;
}

export function setPickupScannerAdapter(adapter: PickupScannerAdapter): void {
  activePickupScannerAdapter = adapter;
}

export function parsePickupScannedCode(
  payload: RawScanPayload,
): PickupScanCodeResult | null {
  const value = payload.data.trim();
  if (!value) {
    return null;
  }

  const rawType = payload.type?.toLowerCase() ?? '';
  const format: PickupScanCodeFormat =
    rawType === 'qr' ? 'QR' : rawType.length > 0 ? 'BARCODE' : 'UNKNOWN';

  return {
    value,
    format,
  };
}
