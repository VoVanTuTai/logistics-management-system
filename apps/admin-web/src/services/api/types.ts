export interface ApiErrorPayload {
  message?: string;
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  signal?: AbortSignal;
}

