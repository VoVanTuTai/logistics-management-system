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

interface UploadCourierImageInput {
  accessToken: string;
  uri: string;
  filename: string;
}

const DEFAULT_CONTENT_TYPE = 'image/jpeg';

export function isLocalMediaUri(value: string | null | undefined): value is string {
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

export async function uploadCourierImage(
  input: UploadCourierImageInput,
): Promise<string> {
  const filename = buildMediaFilename(input.filename);
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
      message: 'Gateway did not return a valid media upload URL.',
      status: null,
    });
  }

  const imageResponse = await fetch(input.uri);
  if (!imageResponse.ok) {
    throw new ApiClientError({
      message: `Could not read local image (${imageResponse.status}).`,
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
      message: error instanceof Error ? error.message : 'Could not upload image.',
      isNetworkError: true,
    });
  }

  if (!uploadResponse.ok) {
    throw new ApiClientError({
      message: `Could not upload image (${uploadResponse.status}).`,
      status: uploadResponse.status,
    });
  }

  return uploadDescriptor.data.publicUrl;
}

function buildMediaFilename(filename: string): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const normalizedFilename = safeFilename || `courier-proof-${Date.now()}.jpg`;

  if (/\.[a-z0-9]+$/i.test(normalizedFilename)) {
    return normalizedFilename;
  }

  return `${normalizedFilename}.jpg`;
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
