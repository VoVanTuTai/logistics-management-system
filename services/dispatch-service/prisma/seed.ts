import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tasks = [
    {
      taskCode: 'TSK1001',
      taskType: 'PICKUP' as const,
      status: 'ASSIGNED' as const,
      shipmentCode: 'SHP1001',
      pickupRequestId: null,
      note: 'Seed assigned pickup task',
      // Align with auth-service seed user "30000001"
      assignmentCourierId: '30000001',
    },
    {
      taskCode: 'TSK1002',
      taskType: 'DELIVERY' as const,
      status: 'CREATED' as const,
      shipmentCode: 'SHP1002',
      pickupRequestId: null,
      note: 'Seed created delivery task',
      assignmentCourierId: null,
    },
    {
      taskCode: 'TSK1003',
      taskType: 'RETURN' as const,
      status: 'ASSIGNED' as const,
      shipmentCode: 'SHP1003',
      pickupRequestId: null,
      note: 'Seed assigned return task',
      // Align with auth-service seed user "30000002"
      assignmentCourierId: '30000002',
    },
  ] as const;

  for (const task of tasks) {
    const record = await prisma.task.upsert({
      where: { taskCode: task.taskCode },
      update: {
        taskType: task.taskType,
        status: task.status,
        shipmentCode: task.shipmentCode,
        pickupRequestId: task.pickupRequestId,
        note: task.note,
      },
      create: {
        taskCode: task.taskCode,
        taskType: task.taskType,
        status: task.status,
        shipmentCode: task.shipmentCode,
        pickupRequestId: task.pickupRequestId,
        note: task.note,
      },
    });

    await prisma.taskAssignment.deleteMany({ where: { taskId: record.id } });

    if (task.assignmentCourierId) {
      await prisma.taskAssignment.create({
        data: {
          taskId: record.id,
          courierId: task.assignmentCourierId,
        },
      });
    }
  }

  console.log('dispatch-service seed completed');
}

main()
  .catch((error) => {
    console.error('dispatch-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
