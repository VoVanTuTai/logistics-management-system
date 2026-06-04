export interface ResolvedShipmentScanCode {
  shipmentCode: string;
  scannedCode: string;
  isReturnLabel: boolean;
}

const COMPACT_RETURN_LABEL_REGEX = /^((?:111|101|222|333)\d{9})R$/;
const EXPLICIT_RETURN_LABEL_REGEX = /^(.+)-R$/;

export function normalizeShipmentScanCode(
  value: string | null | undefined,
): string {
  return (value ?? '').trim().toUpperCase();
}

export function resolveShipmentScanCode(
  value: string | null | undefined,
): ResolvedShipmentScanCode | null {
  const scannedCode = normalizeShipmentScanCode(value);
  if (!scannedCode) {
    return null;
  }

  const explicitReturnMatch = scannedCode.match(EXPLICIT_RETURN_LABEL_REGEX);
  if (explicitReturnMatch?.[1]) {
    return {
      shipmentCode: explicitReturnMatch[1],
      scannedCode,
      isReturnLabel: true,
    };
  }

  const compactReturnMatch = scannedCode.match(COMPACT_RETURN_LABEL_REGEX);
  if (compactReturnMatch?.[1]) {
    return {
      shipmentCode: compactReturnMatch[1],
      scannedCode,
      isReturnLabel: true,
    };
  }

  return {
    shipmentCode: scannedCode,
    scannedCode,
    isReturnLabel: false,
  };
}
