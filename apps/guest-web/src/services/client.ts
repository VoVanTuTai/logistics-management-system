const rawGatewayBaseUrl = (
  import.meta.env.VITE_GATEWAY_BFF_URL ||
  import.meta.env.VITE_GATEWAY_BASE_URL ||
  ''
).trim();

function resolveGatewayBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (
      window.location.hostname === 'tracking.nexus-ex.site' ||
      window.location.hostname === 'guest.nexus-ex.site'
    ) {
      return '';
    }
    if (window.location.protocol === 'https:' && rawGatewayBaseUrl.startsWith('http://')) {
      return '';
    }
  }
  return rawGatewayBaseUrl || 'http://localhost:3000';
}

export const GATEWAY_BASE_URL = resolveGatewayBaseUrl();

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  accessToken?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number | null;
  details?: unknown;

  constructor(params: {
    message: string;
    status?: number | null;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status ?? null;
    this.details = params.details;
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${GATEWAY_BASE_URL.replace(/\/+$/, '')}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    ...(options.headers ?? {}),
  };

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      let errorMessage = `Yêu cầu thất bại (${response.status})`;
      if (data && typeof data === 'object') {
        if (typeof data.message === 'string') errorMessage = data.message;
        else if (Array.isArray(data.message) && data.message.length > 0) errorMessage = data.message.join(', ');
        else if (typeof data.error === 'string') errorMessage = data.error;
      }
      throw new ApiError({
        message: errorMessage,
        status: response.status,
        details: data,
      });
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      message: error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.',
      status: null,
    });
  }
}
