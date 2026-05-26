import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.ADMIN_WEB_E2E_PORT ?? 5175);
const host = process.env.ADMIN_WEB_E2E_HOST ?? '127.0.0.1';
const baseURL = process.env.ADMIN_WEB_E2E_BASE_URL ?? `http://${host}:${port}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
