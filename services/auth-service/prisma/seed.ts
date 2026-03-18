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
      username: 'ops.admin',
      plainPassword: 'ops123456',
      roles: ['OPS_ADMIN'],
    },
    {
      username: 'ops.viewer',
      plainPassword: 'ops123456',
      roles: ['OPS_VIEWER'],
    },
    {
      username: 'merchant.demo',
      plainPassword: 'merchant123456',
      roles: ['MERCHANT'],
    },
  ] as const;

  for (const user of users) {
    await prisma.userAccount.upsert({
      where: { username: user.username },
      update: {
        passwordHash: sha256(user.plainPassword),
        roles: [...user.roles],
        status: 'ACTIVE',
      },
      create: {
        username: user.username,
        passwordHash: sha256(user.plainPassword),
        roles: [...user.roles],
        status: 'ACTIVE',
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
