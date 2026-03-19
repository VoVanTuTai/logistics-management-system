import type { ApiProblem } from '../../types/api';
import { appEnv } from '../../utils/env';

export type HttpMethod = 'GET' | 'POST' | 'PATCH';

export interface RequestOptions {
  method?: HttpMethod;
  accessToken?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiClientError extends Error implements ApiProblem {
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

export class CourierApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options.accessToken
            ? { Authorization: `Bearer ${options.accessToken}` }
            : {}),
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
        message: error instanceof Error ? error.message : 'Network request failed.',
        isNetworkError: true,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function safeParseJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.length > 0) {
    return payload;
  }

  if (
    payload !== null &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return `Gateway request failed with status ${status}.`;
}

export function shouldQueueOffline(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  return error.isNetworkError || error.status === 408;
}

export const courierApiClient = new CourierApiClient(
  appEnv.gatewayBaseUrl,
  appEnv.requestTimeoutMs,
);
