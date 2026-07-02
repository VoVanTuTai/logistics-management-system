import { courierApiClient } from './api/client';
import { courierEndpoints } from './api/endpoints';

/**
 * Fire-and-forget GPS reporter service.
 *
 * Sends the courier's current GPS coordinates to the backend
 * at a debounced interval. Failures are silently logged —
 * they must never interrupt the courier's workflow.
 */

const MIN_REPORT_INTERVAL_MS = 10_000;

let lastReportedAt = 0;
let pendingReport: ReturnType<typeof setTimeout> | null = null;

export interface LocationReportInput {
  accessToken: string | null;
  courierId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
  taskId?: string | null;
  shipmentCode?: string | null;
  source?: 'GPS' | 'MANUAL' | 'SCAN';
}

async function sendLocationReport(input: LocationReportInput): Promise<void> {
  if (!input.accessToken || !input.courierId) {
    return;
  }

  try {
    await courierApiClient.request(
      courierEndpoints.scan.recordCourierLocation,
      {
        method: 'POST',
        accessToken: input.accessToken,
        body: {
          courierId: input.courierId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          capturedAt: input.capturedAt,
          taskId: input.taskId ?? null,
          shipmentCode: input.shipmentCode ?? null,
          source: input.source ?? 'GPS',
        },
      },
    );
  } catch (error) {
    // Fire-and-forget: log but never throw.
    if (__DEV__) {
      console.warn('[LocationReporter] Failed to report location:', error);
    }
  }
}

/**
 * Report the courier's current location to the backend.
 *
 * Debounces requests so they are sent at most once every
 * {@link MIN_REPORT_INTERVAL_MS} milliseconds. If a report
 * is already pending, the latest coordinates replace the
 * previously queued payload.
 */
export function reportLocationToServer(input: LocationReportInput): void {
  const now = Date.now();
  const elapsed = now - lastReportedAt;

  if (pendingReport !== null) {
    clearTimeout(pendingReport);
    pendingReport = null;
  }

  if (elapsed >= MIN_REPORT_INTERVAL_MS) {
    lastReportedAt = now;
    void sendLocationReport(input);
    return;
  }

  const delay = MIN_REPORT_INTERVAL_MS - elapsed;
  pendingReport = setTimeout(() => {
    pendingReport = null;
    lastReportedAt = Date.now();
    void sendLocationReport(input);
  }, delay);
}
