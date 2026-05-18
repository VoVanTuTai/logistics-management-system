import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const gatewayUrl = process.env.E2E_GATEWAY_URL ?? 'http://127.0.0.1:3000';
const adminUsername = process.env.E2E_ADMIN_USERNAME ?? '10000001';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'password';

interface LoginResponse {
  tokens: {
    accessToken: string;
  };
}

interface AdminUser {
  username: string;
}

interface Hub {
  code: string;
}

interface Zone {
  code: string;
}

let accessToken = '';
let opsUsername = '';
let shipperUsername = '';
let runId = '';

function authHeaders() {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseJson<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  return (await response.json()) as T;
}

async function expectBackendReady(request: APIRequestContext) {
  const health = await request.get(`${gatewayUrl}/health`, {
    timeout: 5_000,
  }).catch((error: unknown) => {
    throw new Error(
      `Gateway/backend is not reachable at ${gatewayUrl}. Start backend services before running npm run test:e2e. ${error instanceof Error ? error.message : ''}`,
    );
  });

  if (!health.ok()) {
    throw new Error(
      `Gateway/backend health check failed at ${gatewayUrl}/health with status ${health.status()}. Start services and retry.`,
    );
  }
}

async function loginByApi(request: APIRequestContext) {
  const response = await request.post(`${gatewayUrl}/ops/auth/auth/login`, {
    data: {
      username: adminUsername,
      password: adminPassword,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Admin seed login failed for ${adminUsername}. Run auth-service db:seed and verify DEMO_PASSWORD/admin credentials. Status: ${response.status()}.`,
    );
  }

  const payload = await parseJson<LoginResponse>(response);
  accessToken = payload.tokens.accessToken;
}

async function listUsers(request: APIRequestContext, roleGroup: 'OPS' | 'SHIPPER') {
  const response = await request.get(
    `${gatewayUrl}/ops/auth/auth/users?roleGroup=${roleGroup}`,
    { headers: authHeaders() },
  );

  if (!response.ok()) {
    throw new Error(`Cannot list ${roleGroup} users from backend. Status: ${response.status()}.`);
  }

  return parseJson<AdminUser[]>(response);
}

function pickUnusedCode(users: AdminUser[], start: number, end: number) {
  const used = new Set(users.map((user) => user.username));

  for (let code = start; code <= end; code += 1) {
    const candidate = String(code);
    if (!used.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No unused user code found between ${start} and ${end}. Clean demo data or widen the E2E range.`);
}

async function assertSeedMasterdata(request: APIRequestContext) {
  const [hubsResponse, zonesResponse, auditResponse] = await Promise.all([
    request.get(`${gatewayUrl}/ops/masterdata/hubs`, { headers: authHeaders() }),
    request.get(`${gatewayUrl}/ops/masterdata/zones`, { headers: authHeaders() }),
    request.get(`${gatewayUrl}/ops/admin/audit-logs?source=all&limit=1&offset=0`, {
      headers: authHeaders(),
    }),
  ]);

  if (!hubsResponse.ok() || !zonesResponse.ok()) {
    throw new Error('Cannot read seeded masterdata. Run masterdata-service db:seed and ensure gateway routes are healthy.');
  }

  const hubs = await parseJson<Hub[]>(hubsResponse);
  const zones = await parseJson<Zone[]>(zonesResponse);

  if (!hubs.some((hub) => hub.code === 'HCM-001')) {
    throw new Error('Seed hub HCM-001 is missing. Run services/masterdata-service npm run db:seed.');
  }

  if (!zones.some((zone) => zone.code === 'VN')) {
    throw new Error('Seed zone VN is missing. Run services/masterdata-service npm run db:seed.');
  }

  if (!auditResponse.ok()) {
    throw new Error(`Cannot read unified audit logs. Status: ${auditResponse.status()}.`);
  }
}

async function loginViaUi(page: Page) {
  await page.goto('/login');
  await page.getByTestId('admin-login-username').fill(adminUsername);
  await page.getByTestId('admin-login-password').fill(adminPassword);
  await page.getByTestId('admin-login-submit').click();
  await expect(page.getByTestId('admin-main')).toBeVisible();
}

async function createUpdateAndToggleStandardUser(
  page: Page,
  options: {
    navTestId: string;
    username: string;
    displayName: string;
    updatedName: string;
    phone: string;
    heading: RegExp;
  },
) {
  await page.getByTestId(options.navTestId).click();
  await expect(page.getByRole('heading', { name: options.heading })).toBeVisible();

  await page.getByLabel('Tên đăng nhập').fill(options.username);
  await page.getByLabel('Tên hiển thị').fill(options.displayName);
  await page.getByLabel('Số điện thoại').fill(options.phone);
  await page.getByLabel('Hub được gán').selectOption('HCM-001');
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã tạo tài khoản ${options.username}`);

  let row = page.getByRole('row', { name: new RegExp(options.username) });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Sửa' }).click();
  await page.getByLabel('Tên hiển thị').fill(options.updatedName);
  await page.getByRole('button', { name: 'Lưu tài khoản' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã cập nhật tài khoản ${options.username}`);
  await expect(page.getByRole('row', { name: new RegExp(options.updatedName) })).toBeVisible();

  row = page.getByRole('row', { name: new RegExp(options.username) });
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Vô hiệu hóa' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã vô hiệu hóa tài khoản ${options.username}`);

  row = page.getByRole('row', { name: new RegExp(options.username) });
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Kích hoạt lại' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã kích hoạt lại tài khoản ${options.username}`);
}

async function createUpdateAndToggleMerchant(page: Page) {
  const citizenId = `079${Date.now().toString().slice(-9)}`;
  const merchantName = `Merchant E2E ${runId}`;
  const merchantUpdatedName = `Merchant E2E Updated ${runId}`;

  await page.getByTestId('nav-users-merchants').click();
  await expect(page.getByRole('heading', { name: /quản trị - quản lý tài khoản merchant/i })).toBeVisible();

  const merchantPreview = page.getByText(/Mã merchant:\s*411\d{5}/);
  await expect(merchantPreview).toBeVisible();
  const merchantCode = (await merchantPreview.textContent())?.match(/411\d{5}/)?.[0];
  expect(merchantCode, 'Merchant auto-generated code should be visible').toBeTruthy();

  await page.getByLabel('Họ tên').fill(merchantName);
  await page.getByLabel('Số điện thoại').fill(`090${runId.slice(-7)}`);
  await page.getByLabel('Số CCCD').fill(citizenId);
  await page.getByLabel('Khu vực').selectOption('HO_CHI_MINH');
  await page.getByLabel('Mật khẩu').fill(adminPassword);
  await page.getByLabel('Xác nhận mật khẩu').fill(adminPassword);
  await page.getByRole('button', { name: 'Tạo merchant' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã tạo merchant ${merchantCode}`);

  let row = page.getByRole('row', { name: new RegExp(merchantCode!) });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Sửa' }).click();
  await page.getByLabel('Họ tên').fill(merchantUpdatedName);
  await page.getByRole('button', { name: 'Lưu merchant' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã cập nhật merchant ${merchantCode}`);

  row = page.getByRole('row', { name: new RegExp(merchantCode!) });
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Vô hiệu hóa' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã vô hiệu hóa merchant ${merchantCode}`);

  row = page.getByRole('row', { name: new RegExp(merchantCode!) });
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Kích hoạt lại' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã kích hoạt lại merchant ${merchantCode}`);
}

async function createZone(page: Page, zoneCode: string) {
  await page.getByTestId('nav-zones').click();
  await expect(page.getByRole('heading', { name: /quản lý zone/i })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo zone' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo zone' });
  await dialog.getByLabel('Mã zone').fill(zoneCode);
  await dialog.getByLabel('Tên zone').fill(`Zone E2E ${runId}`);
  await dialog.getByLabel('Mã zone cha').fill('VN');
  await dialog.getByRole('button', { name: 'Tạo zone' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã tạo zone "${zoneCode}"`);

  const row = page.getByRole('row', { name: new RegExp(zoneCode) });
  await row.getByRole('button', { name: 'Tắt' }).click();
  await expect(page.getByRole('status')).toContainText(`Zone "${zoneCode}" đã chuyển sang INACTIVE`);
  await page.getByRole('row', { name: new RegExp(zoneCode) }).getByRole('button', { name: 'Bật' }).click();
  await expect(page.getByRole('status')).toContainText(`Zone "${zoneCode}" đã chuyển sang ACTIVE`);
}

async function createHub(page: Page, hubCode: string, zoneCode: string) {
  await page.getByTestId('nav-hubs').click();
  await expect(page.getByRole('heading', { name: /quản lý bưu cục/i })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo bưu cục' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo hub' });
  await dialog.getByLabel('Mã hub').fill(hubCode);
  await dialog.getByLabel('Tên hub').fill(`Hub E2E ${runId}`);
  await dialog.getByLabel('Mã zone').selectOption(zoneCode);
  await dialog.getByLabel('Tỉnh/Thành').selectOption('Hồ Chí Minh');
  await dialog.getByLabel('Quận/Huyện').selectOption('Quận 1');
  await dialog.getByLabel('Đường / địa chỉ chi tiết').fill('99 E2E Test');
  await dialog.getByLabel('Phường/Xã').fill('Phường Bến Nghé');
  await dialog.getByLabel('Số điện thoại').fill('0281999000');
  await dialog.getByLabel('Tên liên hệ').fill('E2E Admin');
  await dialog.getByRole('button', { name: 'Tạo hub' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã tạo bưu cục "${hubCode}"`);

  const row = page.getByRole('row', { name: new RegExp(hubCode) });
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Vô hiệu hóa' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã vô hiệu hóa bưu cục "${hubCode}"`);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('row', { name: new RegExp(hubCode) }).getByRole('button', { name: 'Kích hoạt lại' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã kích hoạt lại bưu cục "${hubCode}"`);
}

async function createNdrReason(page: Page, reasonCode: string) {
  await page.getByTestId('nav-ndr-reasons').click();
  await expect(page.getByRole('heading', { name: /quản lý lý do ndr/i })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo lý do' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo lý do NDR' });
  await dialog.getByLabel('Mã lý do').fill(reasonCode);
  await dialog.getByLabel('Tên lý do').fill(`Lý do E2E ${runId}`);
  await dialog.getByLabel('Nhóm').selectOption('SYSTEM');
  await dialog.getByLabel('Mô tả').fill('Lý do tạo bởi Playwright E2E.');
  await dialog.getByRole('button', { name: 'Tạo lý do' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã tạo lý do NDR "${reasonCode}"`);

  const row = page.getByRole('row', { name: new RegExp(reasonCode) });
  await row.getByRole('button', { name: 'Tắt' }).click();
  await expect(page.getByRole('status')).toContainText(`Lý do NDR "${reasonCode}" đã chuyển sang INACTIVE`);
  await page.getByRole('row', { name: new RegExp(reasonCode) }).getByRole('button', { name: 'Bật' }).click();
  await expect(page.getByRole('status')).toContainText(`Lý do NDR "${reasonCode}" đã chuyển sang ACTIVE`);
}

async function createConfig(page: Page, configKey: string) {
  await page.getByTestId('nav-configs').click();
  await expect(page.getByRole('heading', { name: /quản lý config/i })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo config' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo config' });
  await dialog.getByLabel('Key').fill(configKey);
  await dialog.getByLabel('Tên').fill(`Config E2E ${runId}`);
  await dialog.getByLabel('Scope').fill('E2E');
  await dialog.getByLabel('Giá trị').fill('enabled');
  await dialog.getByLabel('Mô tả').fill('Config tạo bởi Playwright E2E.');
  await dialog.getByRole('button', { name: 'Tạo config' }).click();
  await expect(page.getByRole('status')).toContainText(`Đã tạo config "${configKey}"`);

  const row = page.getByRole('row', { name: new RegExp(configKey.replaceAll('.', '\\.')) });
  await row.getByRole('button', { name: 'Tắt' }).click();
  await expect(page.getByRole('status')).toContainText(`Config "${configKey}" đã chuyển sang INACTIVE`);
  await page.getByRole('row', { name: new RegExp(configKey.replaceAll('.', '\\.')) }).getByRole('button', { name: 'Bật' }).click();
  await expect(page.getByRole('status')).toContainText(`Config "${configKey}" đã chuyển sang ACTIVE`);
}

test.describe.serial('admin web real backend E2E', () => {
  test.beforeAll(async ({ request }) => {
    runId = Date.now().toString().slice(-8);
    await expectBackendReady(request);
    await loginByApi(request);
    await assertSeedMasterdata(request);

    const [opsUsers, shipperUsers] = await Promise.all([
      listUsers(request, 'OPS'),
      listUsers(request, 'SHIPPER'),
    ]);
    opsUsername = pickUnusedCode(opsUsers, 20000010, 20000999);
    shipperUsername = pickUnusedCode(shipperUsers, 30001000, 30009999);
  });

  test('runs admin workflows against gateway/backend and seeded database', async ({ page }) => {
    await loginViaUi(page);

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByRole('heading', { name: /tổng quan admin/i })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: /tổng quan admin/i })).toBeVisible();

    await createUpdateAndToggleStandardUser(page, {
      navTestId: 'nav-users-ops',
      username: opsUsername,
      displayName: `Ops E2E ${runId}`,
      updatedName: `Ops E2E Updated ${runId}`,
      phone: `0902${runId.slice(-6)}`,
      heading: /quản lý tài khoản ops/i,
    });

    await createUpdateAndToggleStandardUser(page, {
      navTestId: 'nav-users-shippers',
      username: shipperUsername,
      displayName: `Shipper E2E ${runId}`,
      updatedName: `Shipper E2E Updated ${runId}`,
      phone: `0903${runId.slice(-6)}`,
      heading: /quản trị - quản lý tài khoản shipper/i,
    });

    await createUpdateAndToggleMerchant(page);

    const zoneCode = `E2E_${runId}`;
    const hubCode = `E2E-${runId.slice(-5)}`;
    const reasonCode = `E2E_NDR_${runId}`;
    const configKey = `e2e.config.${runId}`;

    await createZone(page, zoneCode);
    await createHub(page, hubCode, zoneCode);
    await createNdrReason(page, reasonCode);
    await createConfig(page, configKey);

    await page.getByTestId('nav-permissions').click();
    await expect(page.getByRole('heading', { name: /ma trận phân quyền thao tác mobile/i })).toBeVisible();
    await expect(page.getByText(/UI prototype/i)).toHaveCount(0);
    await expect(page.getByText(/Đang tải ma trận phân quyền/i)).toHaveCount(0);

    const firstPermissionCheckbox = page.locator('tbody input[type="checkbox"]').first();
    const initialPermissionState = await firstPermissionCheckbox.isChecked();
    await firstPermissionCheckbox.click();
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByRole('status')).toContainText('Đã lưu ma trận phân quyền chung lên backend.');
    await page.reload();
    await expect(page.getByText(/UI prototype/i)).toHaveCount(0);
    expect(await page.locator('tbody input[type="checkbox"]').first().isChecked()).toBe(!initialPermissionState);

    await page.getByTestId('nav-audit').click();
    await expect(page.getByRole('heading', { name: /audit log quản trị/i })).toBeVisible();
    await page.getByLabel('Nguồn audit').selectOption('auth-service');
    await page.getByPlaceholder('Actor').fill(adminUsername);
    await page.getByPlaceholder('Action').fill('USER');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByText('Auth').first()).toBeVisible();
    await page.getByRole('button', { name: 'Xem' }).first().click();
    await expect(page.getByRole('heading', { name: /USER/i })).toBeVisible();
    await expect(page.getByText('Before')).toBeVisible();
    await expect(page.getByText('After')).toBeVisible();
  });
});
