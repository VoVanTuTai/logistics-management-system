import { ApiClientError, courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import { appEnv } from '../../utils/env';

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

function normalizeUploadTargetUrl(rawUrl: string): string {
  try {
    const parsedTarget = new URL(rawUrl);
    const parsedGateway = new URL(appEnv.gatewayBaseUrl);

    // If target hostname is docker container name (minio) or loopback, rewrite to reachable gateway host
    const isInternalHost =
      parsedTarget.hostname === 'minio' ||
      parsedTarget.hostname === 'localhost' ||
      parsedTarget.hostname === '127.0.0.1' ||
      parsedTarget.hostname === '0.0.0.0' ||
      parsedTarget.hostname.startsWith('10.');

    if (parsedGateway.hostname && parsedGateway.hostname !== 'minio' && isInternalHost) {
      parsedTarget.hostname = parsedGateway.hostname;
    }

    return parsedTarget.toString();
  } catch {
    return rawUrl;
  }
}

export async function uploadCourierImage(
  input: UploadCourierImageInput,
): Promise<string> {
  const filename = buildMediaFilename(input.filename);
  const contentType = resolveContentType(filename, input.uri);

  let uploadDescriptor: MediaUploadUrlResponse;
  try {
    uploadDescriptor = await courierApiClient.request<MediaUploadUrlResponse>(
      courierEndpoints.media.uploadUrl(filename, contentType),
      {
        method: 'GET',
        accessToken: input.accessToken,
      },
    );
  } catch (error) {
    console.warn('[media-upload] Could not obtain presigned upload URL from gateway:', error);
    return input.uri;
  }

  if (!uploadDescriptor.success || !uploadDescriptor.data.uploadUrl) {
    return input.uri;
  }

  try {
    const targetUploadUrl = normalizeUploadTargetUrl(uploadDescriptor.data.uploadUrl);
    const imageResponse = await fetch(input.uri);

    if (!imageResponse.ok) {
      console.warn(`[media-upload] Could not read local image (${imageResponse.status})`);
      return input.uri;
    }

    const imageBlob = await imageResponse.blob();
    let uploadResponse = await fetch(targetUploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: imageBlob,
    });

    if (!uploadResponse.ok) {
      // Retry direct PUT to publicUrl (works seamlessly with MinIO public bucket policy)
      const targetPublicUrl = normalizeUploadTargetUrl(uploadDescriptor.data.publicUrl);
      uploadResponse = await fetch(targetPublicUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: imageBlob,
      });
    }

    if (!uploadResponse.ok) {
      console.warn(`[media-upload] S3 PUT failed with status ${uploadResponse.status}`);
      return input.uri;
    }

    return normalizeUploadTargetUrl(uploadDescriptor.data.publicUrl);
  } catch (error) {
    console.warn('[media-upload] S3 upload error (fallback to local URI):', error);
    return input.uri;
  }
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
