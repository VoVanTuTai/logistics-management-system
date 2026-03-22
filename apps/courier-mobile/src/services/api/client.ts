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
  private readonly gatewayCandidates: string[];

  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    fallbackBaseUrls: string[] = [],
  ) {
    this.gatewayCandidates = [baseUrl, ...fallbackBaseUrls].filter(
      (candidateBaseUrl, index, array) =>
        candidateBaseUrl.length > 0 && array.indexOf(candidateBaseUrl) === index,
    );
  }

  async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    let lastNetworkError: unknown = null;

    for (const candidateBaseUrl of this.gatewayCandidates) {
      try {
        return await this.requestWithCandidateBaseUrl(
          candidateBaseUrl,
          path,
          options,
        );
      } catch (error) {
        if (error instanceof ApiClientError && !error.isNetworkError) {
          throw error;
        }

        lastNetworkError = error;
      }
    }

    const fallbackMessage =
      lastNetworkError instanceof Error
        ? lastNetworkError.message
        : 'Network request failed.';

    throw new ApiClientError({
      message: `${fallbackMessage} (gateway candidates: ${this.gatewayCandidates.join(', ')})`,
      isNetworkError: true,
    });
  }

  private async requestWithCandidateBaseUrl<T>(
    candidateBaseUrl: string,
    path: string,
    options: RequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${candidateBaseUrl}${path}`, {
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

      const baseMessage =
        error instanceof Error ? error.message : 'Network request failed.';

      throw new ApiClientError({
        message: `${baseMessage} (gateway: ${candidateBaseUrl})`,
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
  appEnv.gatewayFallbackBaseUrls,
);
