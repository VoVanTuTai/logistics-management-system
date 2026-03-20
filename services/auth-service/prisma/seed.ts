import 'dotenv/config';

import { createHash } from 'crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function main(): Promise<void> {
  const users = [
    {
      username: 'admin.root',
      plainPassword: 'admin123456',
      roles: ['SYSTEM_ADMIN', 'OPS_ADMIN'],
      displayName: 'System Administrator',
      phone: '0900000001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: 'ops.admin',
      plainPassword: 'ops123456',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops Admin',
      phone: '0900000002',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: 'ops.viewer',
      plainPassword: 'ops123456',
      roles: ['OPS_VIEWER'],
      displayName: 'Ops Viewer',
      phone: '0900000003',
      hubCodes: ['HUB_HCM_02'],
    },
    {
      username: 'merchant.demo',
      plainPassword: 'merchant123456',
      roles: ['MERCHANT'],
      displayName: 'Merchant Demo',
      phone: '0900000004',
      hubCodes: [],
    },
    {
      username: 'courier.hcm1',
      plainPassword: 'courier123456',
      roles: ['COURIER'],
      displayName: 'Courier HCM 1',
      phone: '0900000005',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: 'courier.hcm2',
      plainPassword: 'courier123456',
      roles: ['COURIER'],
      displayName: 'Courier HCM 2',
      phone: '0900000006',
      hubCodes: ['HUB_HCM_02'],
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
