import type { ApiErrorPayload } from './types';

export class ApiClientError extends Error {
  status: number | null;
  isNetworkError: boolean;
  payload: ApiErrorPayload | null;

  constructor(params: {
    message: string;
    status?: number | null;
    isNetworkError?: boolean;
    payload?: ApiErrorPayload | null;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.status = params.status ?? null;
    this.isNetworkError = params.isNetworkError ?? false;
    this.payload = params.payload ?? null;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error.';
}

