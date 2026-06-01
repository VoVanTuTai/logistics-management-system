import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';

type RequestWithRawBody = Request & { rawBody?: Buffer };

interface RequestWindow {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipPaths: string[];
}

interface HttpPayloadError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

interface MetricSample {
  count: number;
  sum: number;
}

const DEFAULT_BODY_LIMIT = '1mb';
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX = 120;
const DEFAULT_RATE_LIMIT_SKIP_PATHS = ['/health', '/metrics'];

export function gatewayBodyLimit(): string {
  return process.env.GATEWAY_BODY_LIMIT?.trim() || DEFAULT_BODY_LIMIT;
}

export function captureRawBody(request: RequestWithRawBody, _response: Response, buffer: Buffer): void {
  request.rawBody = Buffer.from(buffer);
}

export function createPayloadErrorHandler(): ErrorRequestHandler {
  return (error: HttpPayloadError, _request: Request, response: Response, next: NextFunction): void => {
    const status = error.status ?? error.statusCode;
    if (status === 413 || error.type === 'entity.too.large') {
      response.status(413).json({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds the gateway body limit.',
      });
      return;
    }

    next(error);
  };
}

export class GatewayHttpMetrics {
  private readonly startedAt = Date.now();
  private readonly requestTotals = new Map<string, number>();
  private readonly requestDurations = new Map<string, MetricSample>();
  private rateLimitRejections = 0;

  middleware(): RequestHandler {
    return (request: Request, response: Response, next: NextFunction): void => {
      const startedAt = process.hrtime.bigint();

      response.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
        const route = normalizeRoute(request.originalUrl ?? request.url);
        const labels = labelsKey({
          method: request.method.toUpperCase(),
          route,
          status_class: `${Math.floor(response.statusCode / 100)}xx`,
        });

        this.requestTotals.set(labels, (this.requestTotals.get(labels) ?? 0) + 1);
        const sample = this.requestDurations.get(labels) ?? { count: 0, sum: 0 };
        sample.count += 1;
        sample.sum += durationSeconds;
        this.requestDurations.set(labels, sample);
      });

      next();
    };
  }

  incrementRateLimitRejection(): void {
    this.rateLimitRejections += 1;
  }

  renderPrometheus(): string {
    const lines: string[] = [
      '# HELP gateway_http_requests_total Total HTTP requests handled by the gateway.',
      '# TYPE gateway_http_requests_total counter',
    ];

    for (const [labels, value] of sortedEntries(this.requestTotals)) {
      lines.push(`gateway_http_requests_total{${labels}} ${value}`);
    }

    lines.push(
      '# HELP gateway_http_request_duration_seconds_sum Total gateway HTTP request duration in seconds.',
      '# TYPE gateway_http_request_duration_seconds_sum counter',
    );
    for (const [labels, sample] of sortedEntries(this.requestDurations)) {
      lines.push(`gateway_http_request_duration_seconds_sum{${labels}} ${sample.sum.toFixed(6)}`);
    }

    lines.push(
      '# HELP gateway_http_request_duration_seconds_count Total gateway HTTP request duration observations.',
      '# TYPE gateway_http_request_duration_seconds_count counter',
    );
    for (const [labels, sample] of sortedEntries(this.requestDurations)) {
      lines.push(`gateway_http_request_duration_seconds_count{${labels}} ${sample.count}`);
    }

    lines.push(
      '# HELP gateway_rate_limit_rejections_total Total requests rejected by gateway rate limiting.',
      '# TYPE gateway_rate_limit_rejections_total counter',
      `gateway_rate_limit_rejections_total ${this.rateLimitRejections}`,
      '# HELP gateway_uptime_seconds Gateway process uptime in seconds.',
      '# TYPE gateway_uptime_seconds gauge',
      `gateway_uptime_seconds ${Math.floor((Date.now() - this.startedAt) / 1000)}`,
    );

    return `${lines.join('\n')}\n`;
  }
}

export function createRateLimitMiddleware(metrics: GatewayHttpMetrics): RequestHandler {
  const options = rateLimitOptionsFromEnv();
  const windows = new Map<string, RequestWindow>();

  if (!options.enabled) {
    return (_request: Request, _response: Response, next: NextFunction): void => next();
  }

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of windows.entries()) {
      if (value.resetAt <= now) {
        windows.delete(key);
      }
    }
  }, options.windowMs);
  cleanupTimer.unref();

  return (request: Request, response: Response, next: NextFunction): void => {
    const path = normalizePath(request.originalUrl ?? request.url);
    if (request.method === 'OPTIONS' || shouldSkipRateLimit(path, options.skipPaths)) {
      next();
      return;
    }

    const now = Date.now();
    const clientKey = clientIdentifier(request);
    const currentWindow = windows.get(clientKey);
    const requestWindow =
      currentWindow && currentWindow.resetAt > now
        ? currentWindow
        : { count: 0, resetAt: now + options.windowMs };

    requestWindow.count += 1;
    windows.set(clientKey, requestWindow);

    const remaining = Math.max(options.maxRequests - requestWindow.count, 0);
    const resetSeconds = Math.ceil((requestWindow.resetAt - now) / 1000);
    response.setHeader('RateLimit-Limit', String(options.maxRequests));
    response.setHeader('RateLimit-Remaining', String(remaining));
    response.setHeader('RateLimit-Reset', String(resetSeconds));

    if (requestWindow.count > options.maxRequests) {
      metrics.incrementRateLimitRejection();
      response.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please retry after the rate limit window resets.',
        retryAfterSeconds: resetSeconds,
      });
      return;
    }

    next();
  };
}

function rateLimitOptionsFromEnv(): RateLimitOptions {
  return {
    enabled: process.env.GATEWAY_RATE_LIMIT_ENABLED !== 'false',
    windowMs: positiveInteger(process.env.GATEWAY_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    maxRequests: positiveInteger(process.env.GATEWAY_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    skipPaths: parseSkipPaths(process.env.GATEWAY_RATE_LIMIT_SKIP_PATHS),
  };
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSkipPaths(value: string | undefined): string[] {
  const paths = (value ?? DEFAULT_RATE_LIMIT_SKIP_PATHS.join(','))
    .split(',')
    .map((path) => path.trim())
    .filter((path) => path.length > 0)
    .map((path) => (path.startsWith('/') ? path : `/${path}`));

  return paths.length > 0 ? paths : DEFAULT_RATE_LIMIT_SKIP_PATHS;
}

function shouldSkipRateLimit(path: string, skipPaths: string[]): boolean {
  return skipPaths.some((skipPath) => path === skipPath || path.startsWith(`${skipPath}/`));
}

function clientIdentifier(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  const forwardedHeader = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const forwardedIp = forwardedHeader?.split(',')[0]?.trim();

  return forwardedIp || request.ip || request.socket.remoteAddress || 'unknown';
}

function normalizeRoute(url: string): string {
  const path = normalizePath(url);
  if (path === '/') {
    return '/';
  }

  const [first, second] = path.split('/').filter(Boolean);
  if (!first) {
    return '/';
  }

  if (first === 'health' || first === 'metrics') {
    return `/${first}`;
  }

  if (first === 'api' && second) {
    return `/api/${second}/*`;
  }

  return `/${first}/*`;
}

function normalizePath(url: string): string {
  try {
    return new URL(url, 'http://gateway.local').pathname || '/';
  } catch {
    return '/';
  }
}

function labelsKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
    .join(',');
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function sortedEntries<T>(map: Map<string, T>): Array<[string, T]> {
  return [...map.entries()].sort(([left], [right]) => left.localeCompare(right));
}
