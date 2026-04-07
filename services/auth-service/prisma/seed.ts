import 'dotenv/config';

import { createHash } from 'crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function ensureAuthCodeRules(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "UserAccount"
    DROP CONSTRAINT IF EXISTS user_account_username_8_digits_chk;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "UserAccount"
    ADD CONSTRAINT user_account_username_8_digits_chk
    CHECK ("username" ~ '^[0-9]{8}$') NOT VALID;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "UserAccount"
    DROP CONSTRAINT IF EXISTS user_account_username_by_role_chk;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "UserAccount"
    ADD CONSTRAINT user_account_username_by_role_chk
    CHECK (
      CASE
        WHEN "roles" && ARRAY['SYSTEM_ADMIN']::text[] THEN "username" ~ '^10000[0-9]{3}$'
        WHEN "roles" && ARRAY['OPS_ADMIN', 'OPS_VIEWER']::text[] THEN "username" ~ '^20000[0-9]{3}$'
        WHEN "roles" && ARRAY['COURIER']::text[] THEN "username" ~ '^3000[0-9]{4}$'
        WHEN "roles" && ARRAY['MERCHANT']::text[] THEN "username" ~ '^411[0-9]{5}$'
        ELSE "username" ~ '^[0-9]{8}$'
      END
    ) NOT VALID;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "UserAccount"
    DROP CONSTRAINT IF EXISTS user_account_id_equals_username_chk;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "UserAccount"
    ADD CONSTRAINT user_account_id_equals_username_chk
    CHECK ("id" = "username") NOT VALID;
  `);
}

async function main(): Promise<void> {
  await ensureAuthCodeRules();

  const legacyUsernameMap: ReadonlyArray<{ from: string; to: string }> = [
    { from: 'admin.hcm', to: '10000001' },
    { from: 'admin.hn', to: '10000002' },
    { from: 'ops.hcm', to: '20000001' },
    { from: 'ops.hn', to: '20000002' },
    { from: 'merchant.hcm', to: '41100001' },
    { from: 'merchant.hn', to: '41100002' },
    { from: 'courier.hcm', to: '30000001' },
    { from: 'courier.hn', to: '30000002' },
  ];

  for (const { from, to } of legacyUsernameMap) {
    const targetAccount = await prisma.userAccount.findUnique({
      where: { username: to },
      select: { id: true },
    });

    if (targetAccount) {
      await prisma.userAccount.deleteMany({
        where: { username: from },
      });
      continue;
    }

    await prisma.userAccount.updateMany({
      where: { username: from },
      data: { username: to },
    });
  }

  await prisma.authSession.deleteMany({});

  await prisma.$executeRawUnsafe(`
    UPDATE "UserAccount"
    SET "id" = "username"
    WHERE "id" <> "username";
  `);

  const users = [
    // Admins
    {
      username: '10000001',
      plainPassword: 'password',
      roles: ['SYSTEM_ADMIN', 'OPS_ADMIN'],
      displayName: 'Admin HCM',
      phone: '0900001001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: '10000002',
      plainPassword: 'password',
      roles: ['SYSTEM_ADMIN', 'OPS_ADMIN'],
      displayName: 'Admin HN',
      phone: '0900001002',
      hubCodes: ['HUB_HN_01'],
    },
    // OPS
    {
      username: '20000001',
      plainPassword: 'password',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops HCM',
      phone: '0900002001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: '20000002',
      plainPassword: 'password',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops HN',
      phone: '0900002002',
      hubCodes: ['HUB_HN_01'],
    },
    // Merchants
    {
      username: '41100001',
      plainPassword: 'merchant123456',
      roles: ['MERCHANT'],
      displayName: 'Merchant HCM',
      phone: '0900003001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: '41100002',
      plainPassword: 'merchant123456',
      roles: ['MERCHANT'],
      displayName: 'Merchant HN',
      phone: '0900003002',
      hubCodes: ['HUB_HN_01'],
    },
    // Couriers
    {
      username: '30000001',
      plainPassword: 'password',
      roles: ['COURIER'],
      displayName: 'Courier HCM',
      phone: '0900004001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: '30000002',
      plainPassword: 'password',
      roles: ['COURIER'],
      displayName: 'Courier HN',
      phone: '0900004002',
      hubCodes: ['HUB_HN_01'],
    },
  ] as const;

  for (const user of users) {
    await prisma.userAccount.upsert({
      where: { username: user.username },
      update: {
        passwordHash: sha256(user.plainPassword),
        roles: [...user.roles],
        status: 'ACTIVE',
        displayName: user.displayName,
        phone: user.phone,
        hubCodes: [...user.hubCodes],
      },
      create: {
        id: user.username,
        username: user.username,
        passwordHash: sha256(user.plainPassword),
        roles: [...user.roles],
        status: 'ACTIVE',
        displayName: user.displayName,
        phone: user.phone,
        hubCodes: [...user.hubCodes],
      },
    });
  }

  console.log('auth-service seed completed');
}

main()
  .catch((error) => {
    console.error('auth-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
