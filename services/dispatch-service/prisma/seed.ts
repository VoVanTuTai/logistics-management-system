import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const taskStatusPattern = [
  'CREATED',
  'CREATED',
  'CREATED',
  'ASSIGNED',
  'ASSIGNED',
  'ASSIGNED',
  'COMPLETED',
  'COMPLETED',
  'CANCELLED',
  'CANCELLED',
] as const;

const hubFixtures = [
  {
    key: 'hn',
    hubCode: '001A001',
    hubName: 'Hub Hà Nội',
    couriers: ['30000001', '30000002'],
  },
  {
    key: 'hcm',
    hubCode: '003A001',
    hubName: 'Hub Hồ Chí Minh',
    couriers: ['30000003', '30000004'],
  },
] as const;

type TaskSeedStatus = (typeof taskStatusPattern)[number];
type TaskSeedType = 'DELIVERY' | 'PICKUP';

function buildShipmentCode(
  hubCode: string,
  flow: 'delivery' | 'pickup',
  index: number,
): string {
  const hubSegment = hubCode.slice(0, 3);
  const flowSegment = flow === 'delivery' ? '10' : '20';
  return `101${hubSegment}${flowSegment}${String(index).padStart(4, '0')}`;
}

function buildTaskCode(
  hubCode: string,
  taskType: TaskSeedType,
  index: number,
): string {
  const typeSegment = taskType === 'DELIVERY' ? 'D' : 'P';
  return `TASK${typeSegment}${hubCode}${String(index).padStart(3, '0')}`;
}

function resolveCourierId(
  status: TaskSeedStatus,
  couriers: readonly string[],
  index: number,
): string | null {
  if (status === 'ASSIGNED' || status === 'COMPLETED') {
    return couriers[index % couriers.length];
  }

  return null;
}

function buildTasks() {
  return hubFixtures.flatMap((hub) => {
    const deliveryTasks = taskStatusPattern.map((status, itemIndex) => {
      const index = itemIndex + 1;

      return {
        taskCode: buildTaskCode(hub.hubCode, 'DELIVERY', index),
        taskType: 'DELIVERY' as const,
        status,
        shipmentCode: buildShipmentCode(hub.hubCode, 'delivery', index),
        pickupRequestId: null,
        note: `Seed ${hub.hubName}: đơn giao ${index} trạng thái ${status}.`,
        assignmentCourierId: resolveCourierId(status, hub.couriers, itemIndex),
      };
    });

    const pickupTasks = taskStatusPattern.map((status, itemIndex) => {
      const index = itemIndex + 1;

      return {
        taskCode: buildTaskCode(hub.hubCode, 'PICKUP', index),
        taskType: 'PICKUP' as const,
        status,
        shipmentCode: buildShipmentCode(hub.hubCode, 'pickup', index),
        pickupRequestId: `seed-pickup-${hub.key}-${String(index).padStart(2, '0')}`,
        note:
          status === 'CANCELLED'
            ? `Seed ${hub.hubName}: lấy hàng thất bại đơn ${index}.`
            : `Seed ${hub.hubName}: đơn lấy ${index} trạng thái ${status}.`,
        assignmentCourierId: resolveCourierId(status, hub.couriers, itemIndex),
      };
    });

    return [...deliveryTasks, ...pickupTasks];
  });
}

async function main(): Promise<void> {
  const tasks = buildTasks();

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

  console.log(`dispatch-service seed completed: ${tasks.length} tasks`);
}

main()
  .catch((error) => {
    console.error('dispatch-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
