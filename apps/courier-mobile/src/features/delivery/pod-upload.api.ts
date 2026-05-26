import { ApiClientError, courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';

interface MediaUploadUrlResponse {
  success: true;
  data: {
    uploadUrl: string;
    fileKey: string;
    bucket: string;
    publicUrl: string;
  };
}

interface UploadPodImageInput {
  accessToken: string;
  uri: string;
  shipmentCode: string;
}

const DEFAULT_CONTENT_TYPE = 'image/jpeg';

export function isLocalPodImageUri(
  value: string | null | undefined,
): value is string {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  return (
    normalizedValue.startsWith('file:') ||
    normalizedValue.startsWith('content:') ||
    normalizedValue.startsWith('ph:') ||
    normalizedValue.startsWith('assets-library:') ||
    normalizedValue.startsWith('data:image/')
  );
}

export async function uploadPodImage(
  input: UploadPodImageInput,
): Promise<string> {
  const filename = buildPodFilename(input.uri, input.shipmentCode);
  const contentType = resolveContentType(filename, input.uri);
  const uploadDescriptor = await courierApiClient.request<MediaUploadUrlResponse>(
    courierEndpoints.media.uploadUrl(filename, contentType),
    {
      method: 'GET',
      accessToken: input.accessToken,
    },
  );

  if (!uploadDescriptor.success || !uploadDescriptor.data.uploadUrl) {
    throw new ApiClientError({
      message: 'Gateway did not return a valid POD upload URL.',
      status: null,
    });
  }

  const imageResponse = await fetch(input.uri);
  if (!imageResponse.ok) {
    throw new ApiClientError({
      message: `Could not read local POD image (${imageResponse.status}).`,
      status: imageResponse.status,
    });
  }

  const imageBlob = await imageResponse.blob();
  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(uploadDescriptor.data.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: imageBlob,
    });
  } catch (error) {
    throw new ApiClientError({
      message:
        error instanceof Error ? error.message : 'Could not upload POD image.',
      isNetworkError: true,
    });
  }

  if (!uploadResponse.ok) {
    throw new ApiClientError({
      message: `Could not upload POD image (${uploadResponse.status}).`,
      status: uploadResponse.status,
    });
  }

  return uploadDescriptor.data.publicUrl;
}

function buildPodFilename(uri: string, shipmentCode: string): string {
  const rawName = uri.split(/[\\/]/).pop()?.split('?')[0] ?? '';
  const hasExtension = /\.[a-z0-9]+$/i.test(rawName);
  const safeShipmentCode = shipmentCode.replace(/[^a-zA-Z0-9_-]/g, '') || 'shipment';
  const baseName = hasExtension ? rawName : `${safeShipmentCode}-pod.jpg`;

  return baseName.replace(/[^a-zA-Z0-9.\-_]/g, '') || `${safeShipmentCode}-pod.jpg`;
}

function resolveContentType(filename: string, uri: string): string {
  const filenameValue = filename.toLowerCase();
  const uriValue = uri.toLowerCase();

  if (filenameValue.includes('.png') || uriValue.startsWith('data:image/png')) {
    return 'image/png';
  }

  if (filenameValue.includes('.webp') || uriValue.startsWith('data:image/webp')) {
    return 'image/webp';
  }

  if (filenameValue.includes('.heic') || filenameValue.includes('.heif')) {
    return 'image/heic';
  }

  return DEFAULT_CONTENT_TYPE;
}
