import type { RequestOptions } from './types';
import { ApiClientError } from './errors';
import {
  getValidAccessToken,
  refreshAuthSession,
} from '../../features/auth/auth.session';
import { appEnv } from '../../utils/env';

export class OpsApiClient {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), appEnv.requestTimeoutMs);

    try {
      const preparedOptions = await this.prepareAuthOptions(options);
      const response = await this.fetch(path, preparedOptions, controller);
      const parsedResponse = await this.parseResponse(response);

      if (
        parsedResponse.response.status === 401 &&
        options.accessToken &&
        !options.skipAuthRefresh
      ) {
        const refreshedSession = await refreshAuthSession();
        const retryResponse = await this.fetch(
          path,
          {
            ...options,
            accessToken: refreshedSession.tokens.accessToken,
          },
          controller,
        );
        const parsedRetryResponse = await this.parseResponse(retryResponse);

        return this.resolveParsedResponse<T>(parsedRetryResponse);
      }

      return this.resolveParsedResponse<T>(parsedResponse);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new ApiClientError({
        message: error instanceof Error ? error.message : 'Yêu cầu mạng thất bại.',
        isNetworkError: true,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async prepareAuthOptions(
    options: RequestOptions,
  ): Promise<RequestOptions> {
    if (!options.accessToken || options.skipAuthRefresh) {
      return options;
    }

    const accessToken = await getValidAccessToken(options.accessToken);
    return {
      ...options,
      accessToken,
    };
  }

  private async fetch(
    path: string,
    options: RequestOptions,
    controller: AbortController,
  ): Promise<Response> {
    return fetch(`${appEnv.gatewayBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.accessToken
          ? { Authorization: `Bearer ${options.accessToken}` }
          : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal ?? controller.signal,
    });
  }

  private async parseResponse(response: Response): Promise<{
    response: Response;
    payload: unknown;
  }> {
    const text = await response.text();
    const payload = text.length > 0 ? safeParseJson(text) : null;

    return {
      response,
      payload,
    };
  }

  private resolveParsedResponse<T>(parsedResponse: {
    response: Response;
    payload: unknown;
  }): T {
    if (!parsedResponse.response.ok) {
      throw new ApiClientError({
        message: extractErrorMessage(
          parsedResponse.payload,
          parsedResponse.response.status,
        ),
        status: parsedResponse.response.status,
        payload: parsedResponse.payload as Record<string, unknown> | null,
      });
    }

    return parsedResponse.payload as T;
  }
}

function safeParseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return { message: input };
  }
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return `Yêu cầu thất bại với mã trạng thái ${status}.`;
}

export const opsApiClient = new OpsApiClient();
