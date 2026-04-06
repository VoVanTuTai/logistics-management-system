import 'dotenv/config';

import { createHash } from 'crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function main(): Promise<void> {
  const users = [
    // Admins
    {
      username: 'admin.hcm',
      plainPassword: 'admin123456',
      roles: ['SYSTEM_ADMIN', 'OPS_ADMIN'],
      displayName: 'Admin HCM',
      phone: '0900001001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: 'admin.hn',
      plainPassword: 'admin123456',
      roles: ['SYSTEM_ADMIN', 'OPS_ADMIN'],
      displayName: 'Admin HN',
      phone: '0900001002',
      hubCodes: ['HUB_HN_01'],
    },
    // OPS
    {
      username: 'ops.hcm',
      plainPassword: 'ops123456',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops HCM',
      phone: '0900002001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: 'ops.hn',
      plainPassword: 'ops123456',
      roles: ['OPS_ADMIN'],
      displayName: 'Ops HN',
      phone: '0900002002',
      hubCodes: ['HUB_HN_01'],
    },
    // Merchants
    {
      username: 'merchant.hcm',
      plainPassword: 'merchant123456',
      roles: ['MERCHANT'],
      displayName: 'Merchant HCM',
      phone: '0900003001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: 'merchant.hn',
      plainPassword: 'merchant123456',
      roles: ['MERCHANT'],
      displayName: 'Merchant HN',
      phone: '0900003002',
      hubCodes: ['HUB_HN_01'],
    },
    // Couriers
    {
      username: 'courier.hcm',
      plainPassword: 'courier123456',
      roles: ['COURIER'],
      displayName: 'Courier HCM',
      phone: '0900004001',
      hubCodes: ['HUB_HCM_01'],
    },
    {
      username: 'courier.hn',
      plainPassword: 'courier123456',
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
