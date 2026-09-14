import { appEnv } from '../../utils/env';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  accessToken?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  status: number | null;
  isNetworkError: boolean;
  details?: unknown;

  constructor(params: {
    message: string;
    status?: number | null;
    isNetworkError?: boolean;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.status = params.status ?? null;
    this.isNetworkError = params.isNetworkError ?? false;
    this.details = params.details;
  }
}

export class CustomerApiClient {
  private readonly gatewayCandidates: string[];
  private activeBaseUrl: string | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    fallbackBaseUrls: string[] = [],
  ) {
    this.gatewayCandidates = [baseUrl, ...fallbackBaseUrls]
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter((candidate, index, array) => {
        if (candidate.length === 0 && typeof window === 'undefined') {
          return false;
        }
        return array.indexOf(candidate) === index;
      });
    if (this.gatewayCandidates.length > 0) {
      this.activeBaseUrl = this.gatewayCandidates[0];
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let lastNetworkError: unknown = null;

    const candidates = this.activeBaseUrl
      ? [this.activeBaseUrl, ...this.gatewayCandidates.filter((c) => c !== this.activeBaseUrl)]
      : this.gatewayCandidates;

    for (const candidateBaseUrl of candidates) {
      try {
        const result = await this.requestWithCandidateBaseUrl<T>(candidateBaseUrl, path, options);
        this.activeBaseUrl = candidateBaseUrl;
        return result;
      } catch (error) {
        if (error instanceof ApiClientError && !error.isNetworkError) {
          throw error;
        }
        lastNetworkError = error;
      }
    }

    const fallbackMessage =
      lastNetworkError instanceof Error ? lastNetworkError.message : 'Network request failed.';
    const candidateLabels = this.gatewayCandidates.map((c) => c || 'same-origin').join(', ');

    throw new ApiClientError({
      message: `${fallbackMessage} (gateway candidates: ${candidateLabels})`,
      isNetworkError: true,
    });
  }

  private async requestWithCandidateBaseUrl<T>(
    candidateBaseUrl: string,
    path: string,
    options: RequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const effectiveTimeout = this.timeoutMs || 15000;
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

    const trimmedBase = candidateBaseUrl.trim().replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = trimmedBase ? `${trimmedBase}${normalizedPath}` : normalizedPath;

    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
          ...(options.headers ?? {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal ?? controller.signal,
      });

      const text = await response.text();
      const payload = text ? safeParseJson(text) : null;

      if (!response.ok) {
        throw new ApiClientError({
          message: extractErrorMessage(payload, response.status),
          status: response.status,
          details: payload,
        });
      }

      return payload as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new ApiClientError({
        message: extractNetworkErrorMessage(error, candidateBaseUrl),
        status: null,
        isNetworkError: true,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === 'string' && record.message.trim().length > 0) {
      return record.message;
    }

    if (
      Array.isArray(record.message) &&
      record.message.length > 0 &&
      typeof record.message[0] === 'string'
    ) {
      return record.message.join(', ');
    }

    if (typeof record.error === 'string' && record.error.trim().length > 0) {
      return record.error;
    }
  }

  return `Yêu cầu máy chủ thất bại với mã ${status}.`;
}

function extractNetworkErrorMessage(error: unknown, candidateBaseUrl: string): string {
  const baseMessage = error instanceof Error && error.message ? error.message : 'Network request failed.';
  const gatewayLabel = candidateBaseUrl || 'same-origin';
  return `${baseMessage} (gateway: ${gatewayLabel})`;
}

export const customerApiClient = new CustomerApiClient(
  appEnv.gatewayBaseUrl,
  appEnv.requestTimeoutMs,
  appEnv.gatewayFallbackBaseUrls,
);
