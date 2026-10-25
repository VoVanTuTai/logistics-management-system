/**
 * MinIO Object Storage Utility for Nexus Logistics Management System
 * Official Endpoint: https://minio.nexus-ex.site
 * Official Bucket: nexus-pod-images
 *
 * Folder Conventions:
 * - deliveries/        : Shipper Proof of Delivery (POD) photos & digital signatures
 * - cskh-evidence/     : Customer Service Ticket attachments (unboxing videos, package damage photos)
 * - claims-evidence/   : Compensation claims & physical inspection photos
 */

export const MINIO_PUBLIC_ORIGIN = 'https://minio.nexus-ex.site';
export const MINIO_DEFAULT_BUCKET = 'nexus-pod-images';

/**
 * Normalizes any MinIO URL (including docker internal hosts or localhost:9000)
 * to the official public HTTPS MinIO endpoint.
 */
export function normalizeMinioMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith(MINIO_PUBLIC_ORIGIN)) {
    return trimmed;
  }

  return trimmed
    .replace(/^http:\/\/minio:9000\/?/i, `${MINIO_PUBLIC_ORIGIN}/`)
    .replace(/^http:\/\/localhost:9000\/?/i, `${MINIO_PUBLIC_ORIGIN}/`)
    .replace(/^http:\/\/127\.0\.0\.1:9000\/?/i, `${MINIO_PUBLIC_ORIGIN}/`)
    .replace(/^http:\/\/103\.82\.20\.51:19000\/?/i, `${MINIO_PUBLIC_ORIGIN}/`)
    .replace(/^http:\/\/103\.82\.20\.51:9000\/?/i, `${MINIO_PUBLIC_ORIGIN}/`)
    .replace(/^http:\/\/minio\.nexus-ex\.site\/?/i, `${MINIO_PUBLIC_ORIGIN}/`);
}

/**
 * Builds the canonical MinIO public URL for an evidence asset.
 */
export function buildMinioEvidenceUrl(
  category: 'cskh-evidence' | 'claims-evidence' | 'deliveries',
  ticketOrClaimCode: string,
  fileName: string,
): string {
  const safeCode = ticketOrClaimCode.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const safeFile = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
  return `${MINIO_PUBLIC_ORIGIN}/${MINIO_DEFAULT_BUCKET}/${category}/${safeCode}/${safeFile}`;
}
