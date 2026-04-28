import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tasks = [
    {
      taskCode: 'TASK001A001001',
      taskType: 'PICKUP' as const,
      status: 'ASSIGNED' as const,
      shipmentCode: '101000000001',
      pickupRequestId: null,
      note: 'Điều phối courier đi lấy hàng shop, route 001A00101.',
      assignmentCourierId: '30000001',
    },
    {
      taskCode: 'TASK001A001002',
      taskType: 'DELIVERY' as const,
      status: 'ASSIGNED' as const,
      shipmentCode: '333000000001',
      pickupRequestId: null,
      note: 'Phát hàng từ BC Hà Đông sang app courier.',
      assignmentCourierId: '30000002',
    },
    {
      taskCode: 'TASK001C001001',
      taskType: 'RETURN' as const,
      status: 'ASSIGNED' as const,
      shipmentCode: '222000000001',
      pickupRequestId: null,
      note: 'Điều phối thu hồi hàng trả, route 001C00101.',
      assignmentCourierId: '30000003',
    },
    {
      taskCode: 'TASK002A001001',
      taskType: 'DELIVERY' as const,
      status: 'COMPLETED' as const,
      shipmentCode: '333000000002',
      pickupRequestId: null,
      note: 'Đơn khách lẻ đã phát thành công tại Đà Nẵng.',
      assignmentCourierId: '30000004',
    },
    {
      taskCode: 'TASK001A001003',
      taskType: 'DELIVERY' as const,
      status: 'CREATED' as const,
      shipmentCode: '111000000001',
      pickupRequestId: null,
      note: 'Đơn đã quét hàng đến, chờ phát hàng.',
      assignmentCourierId: null,
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
