import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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
const PUBLIC_MINIO_ORIGIN = 'https://minio.nexus-ex.site';

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const enc1 = B64_CHARS.indexOf(clean.charAt(i));
    const enc2 = B64_CHARS.indexOf(clean.charAt(i + 1));
    const enc3 = B64_CHARS.indexOf(clean.charAt(i + 2));
    const enc4 = B64_CHARS.indexOf(clean.charAt(i + 3));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(chr1);
    if (enc3 !== -1 && clean.charAt(i + 2) !== '=') bytes.push(chr2);
    if (enc4 !== -1 && clean.charAt(i + 3) !== '=') bytes.push(chr3);
  }
  return new Uint8Array(bytes);
}

async function createBlobFromBase64(base64Data: string, contentType: string): Promise<Blob> {
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  const dataUri = `data:${contentType};base64,${cleanBase64}`;

  if (Platform.OS === 'web') {
    try {
      const bytes = decodeBase64ToBytes(cleanBase64);
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      return new Blob([buffer], { type: contentType });
    } catch {
      // Fallback to fetch dataUri
    }
  }

  try {
    const res = await fetch(dataUri);
    return await res.blob();
  } catch {
    return new Blob([], { type: contentType });
  }
}

async function readBlobViaXhr(uri: string): Promise<Blob | null> {
  if (typeof XMLHttpRequest === 'undefined') {
    return null;
  }

  return new Promise<Blob | null>((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.response && (xhr.status === 200 || xhr.status === 0)) {
          resolve(xhr.response as Blob);
        } else {
          resolve(null);
        }
      };
      xhr.onerror = () => resolve(null);
      xhr.ontimeout = () => resolve(null);
      xhr.timeout = 10000;
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    } catch {
      resolve(null);
    }
  });
}

async function readMediaBlob(uri: string, contentType: string): Promise<Blob> {
  // 1. Data URI (Base64)
  if (uri.startsWith('data:')) {
    const commaIndex = uri.indexOf(',');
    const base64Data = commaIndex >= 0 ? uri.slice(commaIndex + 1) : uri;
    return createBlobFromBase64(base64Data, contentType);
  }

  // 2. React Native local file via XHR (most reliable for Android file:// and content://)
  const xhrBlob = await readBlobViaXhr(uri);
  if (xhrBlob && xhrBlob.size > 0) {
    return xhrBlob;
  }

  // 3. Try standard fetch (Web blobs, network URIs)
  try {
    const response = await fetch(uri);
    if (response.ok) {
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        return blob;
      }
    }
  } catch {
    // Continue
  }

  return new Blob([], { type: contentType });
}

async function sendBlobToS3(uploadUrl: string, blob: Blob, contentType: string): Promise<boolean> {
  // 1. Try XMLHttpRequest PUT
  if (typeof XMLHttpRequest !== 'undefined') {
    try {
      const ok = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.onload = () => {
          resolve(xhr.status >= 200 && xhr.status < 300);
        };
        xhr.onerror = () => resolve(false);
        xhr.ontimeout = () => resolve(false);
        xhr.timeout = 25000;
        xhr.send(blob);
      });

      if (ok) {
        return true;
      }
    } catch {
      // Continue to fetch PUT
    }
  }

  // 2. Try fetch PUT
  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function isLocalMediaUri(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://')) {
    return false;
  }

  return (
    normalizedValue.startsWith('file:') ||
    normalizedValue.startsWith('content:') ||
    normalizedValue.startsWith('ph:') ||
    normalizedValue.startsWith('assets-library:') ||
    normalizedValue.startsWith('data:image/') ||
    normalizedValue.startsWith('blob:') ||
    normalizedValue.includes('/cache/') ||
    normalizedValue.includes('/camera/') ||
    /\.(jpg|jpeg|png|webp|heic)$/i.test(normalizedValue)
  );
}

export function normalizeUploadTargetUrl(rawUrl: string): string {
  try {
    const parsedTarget = new URL(rawUrl);

    // If target hostname is docker container name (minio), loopback, or internal IP
    const isInternalHost =
      parsedTarget.hostname === 'minio' ||
      parsedTarget.hostname === 'localhost' ||
      parsedTarget.hostname === '127.0.0.1' ||
      parsedTarget.hostname === '0.0.0.0' ||
      parsedTarget.hostname === '10.0.2.2' ||
      parsedTarget.hostname.startsWith('172.') ||
      parsedTarget.hostname.startsWith('192.168.') ||
      (parsedTarget.hostname === '103.82.20.51' && (parsedTarget.port === '19000' || parsedTarget.port === '9000'));

    if (isInternalHost) {
      const publicOrigin = new URL(PUBLIC_MINIO_ORIGIN);
      parsedTarget.protocol = publicOrigin.protocol;
      parsedTarget.hostname = publicOrigin.hostname;
      parsedTarget.port = publicOrigin.port;
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
    console.error('[media-upload] Could not obtain presigned upload URL from gateway:', error);
    throw new ApiClientError({
      message: 'Không thể lấy đường dẫn tải ảnh lên MinIO. Vui lòng thử lại.',
    });
  }

  if (!uploadDescriptor.success || !uploadDescriptor.data.uploadUrl) {
    throw new ApiClientError({
      message: 'Dịch vụ tải ảnh MinIO phản hồi không hợp lệ.',
    });
  }

  const targetUploadUrl = normalizeUploadTargetUrl(uploadDescriptor.data.uploadUrl);
  const targetPublicUrl = normalizeUploadTargetUrl(uploadDescriptor.data.publicUrl);

  let uploadedSuccessfully = false;

  // Strategy 1: Native Mobile (Android / iOS) via FileSystem.uploadAsync
  if (Platform.OS !== 'web') {
    let localFileToUpload = input.uri;
    let tempFileCreated: string | null = null;

    try {
      if (input.uri.startsWith('data:')) {
        const commaIndex = input.uri.indexOf(',');
        const base64Data = commaIndex >= 0 ? input.uri.slice(commaIndex + 1) : input.uri;
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
        const tempName = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
        const tempPath = `${cacheDir}${tempName}`;

        await FileSystem.writeAsStringAsync(tempPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        tempFileCreated = tempPath;
        localFileToUpload = tempPath;
      }

      if (
        localFileToUpload.startsWith('file:') ||
        localFileToUpload.startsWith('content:')
      ) {
        const uploadResult = await FileSystem.uploadAsync(targetUploadUrl, localFileToUpload, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Content-Type': contentType,
          },
        });

        if (uploadResult.status >= 200 && uploadResult.status < 300) {
          uploadedSuccessfully = true;
        } else {
          console.warn(`[media-upload] FileSystem.uploadAsync status ${uploadResult.status}:`, uploadResult.body);
        }
      }
    } catch (nativeUploadErr) {
      console.warn('[media-upload] FileSystem.uploadAsync error:', nativeUploadErr);
    } finally {
      if (tempFileCreated) {
        try {
          await FileSystem.deleteAsync(tempFileCreated, { idempotent: true });
        } catch {
          // ignore cleanup error
        }
      }
    }
  }

  // Strategy 2: Web / Fallback via HTTP PUT
  if (!uploadedSuccessfully) {
    try {
      const imageBlob = await readMediaBlob(input.uri, contentType);
      if (imageBlob.size > 0) {
        uploadedSuccessfully = await sendBlobToS3(targetUploadUrl, imageBlob, contentType);
      }
    } catch (error) {
      console.warn('[media-upload] S3 upload error:', error);
    }
  }

  if (!uploadedSuccessfully) {
    throw new ApiClientError({
      message: 'Tải ảnh minh chứng lên máy chủ thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.',
    });
  }

  return targetPublicUrl;
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
