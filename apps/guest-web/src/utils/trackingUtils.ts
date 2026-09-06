/**
 * Normalizes any MinIO image URL (including internal docker aliases or IP hosts)
 * to the configured public MinIO endpoint (https://minio.nexus-ex.site).
 */
export function normalizeMediaPublicUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('https://minio.nexus-ex.site')) {
    return trimmed;
  }

  return trimmed
    .replace(/^http:\/\/minio:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/localhost:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/127\.0\.0\.1:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/103\.82\.20\.51:19000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/103\.82\.20\.51:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/minio\.nexus-ex\.site\/?/i, 'https://minio.nexus-ex.site/');
}

/**
 * Clean internal noise (mã bao MB..., MANIFEST-..., Mã NV..., Biển xe..., URLs)
 * from notes so customer sees clean real notes without internal operational noise.
 */
export function cleanCustomerNote(note?: string | null): string | undefined {
  if (!note) return undefined;
  let cleaned = note.trim();

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s"'<>()]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Minh chứng:\s*Xem ảnh/gi, '');
  cleaned = cleaned.replace(/\|?\s*Minh chứng:\s*/gi, '');

  // Strip raw internal codes
  cleaned = cleaned.replace(/\|?\s*MB[0-9]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*MANIFEST-[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Mã\s+NV\s*:\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Mã\s+NV\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Biển\s+xe\s*:\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Courier\s+Bưu\s+cục[^\s|]+/gi, '');

  // Trim separators
  cleaned = cleaned.replace(/^\s*[-|•,]\s*/, '').replace(/\s*[-|•,]\s*$/, '').trim();

  if (
    cleaned.toLowerCase().includes('màn điều phối') ||
    cleaned.toLowerCase().includes('phân vùng shipper')
  ) {
    return undefined;
  }

  return cleaned.length > 0 ? cleaned : undefined;
}

export function formatVnd(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}
