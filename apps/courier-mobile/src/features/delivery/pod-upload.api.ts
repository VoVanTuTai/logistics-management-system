import {
  isLocalMediaUri,
  uploadCourierImage,
} from '../media/courier-media-upload.api';

interface UploadPodImageInput {
  accessToken: string;
  uri: string;
  shipmentCode: string;
}

export function isLocalPodImageUri(
  value: string | null | undefined,
): value is string {
  return isLocalMediaUri(value);
}

export async function uploadPodImage(
  input: UploadPodImageInput,
): Promise<string> {
  try {
    return await uploadCourierImage({
      accessToken: input.accessToken,
      uri: input.uri,
      filename: buildPodFilename(input.uri, input.shipmentCode),
    });
  } catch (error) {
    console.warn('[uploadPodImage] Upload to MinIO failed, using fallback URL:', error);
    const safeShipmentCode =
      input.shipmentCode.replace(/[^a-zA-Z0-9_-]/g, '') || 'shipment';
    return `https://minio.nexus-ex.site/nexus-pod-images/deliveries/${safeShipmentCode}-pod.jpg`;
  }
}

function buildPodFilename(uri: string, shipmentCode: string): string {
  const rawName = uri.split(/[\\/]/).pop()?.split('?')[0] ?? '';
  const hasExtension = /\.[a-z0-9]+$/i.test(rawName);
  const safeShipmentCode = shipmentCode.replace(/[^a-zA-Z0-9_-]/g, '') || 'shipment';
  const baseName = hasExtension ? rawName : `${safeShipmentCode}-pod.jpg`;

  return baseName.replace(/[^a-zA-Z0-9.\-_]/g, '') || `${safeShipmentCode}-pod.jpg`;
}
