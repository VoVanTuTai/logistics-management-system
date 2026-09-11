import type { TaskDto } from '../features/tasks/tasks.types';

// ─────────────────────────────────────────────
// SLA Pickup Calculation Utility
// Quy chuẩn:
//   - Đơn tạo TRƯỚC 12:00 trưa → Hạn chót 22:00 cùng ngày
//   - Đơn tạo TỪ 12:00 trưa trở đi → Hạn chót 12:00 trưa ngày hôm sau
// ─────────────────────────────────────────────

export type SlaStatus = 'OVERDUE' | 'NEAR_OVERDUE' | 'ON_TIME' | 'DONE';

export interface PickupSlaInfo {
  /** Trạng thái SLA */
  status: SlaStatus;
  /** Thời điểm hạn chót */
  deadline: Date;
  /** Số phút quá hạn (> 0 nếu quá hạn) hoặc còn lại (> 0 nếu chưa quá hạn) */
  minutesDiff: number;
  /** Thông điệp ngắn gọn dành cho UI */
  message: string;
  /** Nhãn quy tắc: giải thích cho shipper */
  ruleLabel: string;
}

const NEAR_OVERDUE_THRESHOLD_MINUTES = 120; // 2 giờ

/**
 * Tính toán thông tin SLA cho một task PICKUP.
 * Trả về null nếu task không phải loại PICKUP.
 */
export function computePickupSla(
  task: TaskDto,
  now?: Date,
): PickupSlaInfo | null {
  // Chỉ tính SLA cho đơn PICKUP
  if (task.taskType !== 'PICKUP') {
    return null;
  }

  // Đơn đã hoàn tất / hủy → không cần cảnh báo
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    const deadline = computeDeadline(new Date(task.createdAt));
    return {
      status: 'DONE',
      deadline,
      minutesDiff: 0,
      message: task.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đã hủy',
      ruleLabel: buildRuleLabel(new Date(task.createdAt)),
    };
  }

  const currentTime = now ?? new Date();
  const createdAt = new Date(task.createdAt);
  const deadline = computeDeadline(createdAt);

  const diffMs = deadline.getTime() - currentTime.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  let status: SlaStatus;
  let message: string;

  if (diffMinutes <= 0) {
    // ĐÃ QUÁ HẠN
    status = 'OVERDUE';
    const overdueMinutes = Math.abs(diffMinutes);
    message = `Quá hạn ${formatDuration(overdueMinutes)} (Hạn: ${formatDeadlineShort(deadline)})`;
  } else if (diffMinutes <= NEAR_OVERDUE_THRESHOLD_MINUTES) {
    // SẮP QUÁ HẠN (≤ 2 giờ)
    status = 'NEAR_OVERDUE';
    message = `Sắp quá hạn - Còn ${formatDuration(diffMinutes)} (Hạn: ${formatDeadlineShort(deadline)})`;
  } else {
    // TRONG HẠN AN TOÀN
    status = 'ON_TIME';
    message = `Trong hạn - Còn ${formatDuration(diffMinutes)} (Hạn: ${formatDeadlineShort(deadline)})`;
  }

  return {
    status,
    deadline,
    minutesDiff: Math.abs(diffMinutes),
    message,
    ruleLabel: buildRuleLabel(createdAt),
  };
}

/**
 * Lọc danh sách tasks theo trạng thái SLA.
 */
export function filterTasksBySlaStatus(
  tasks: TaskDto[],
  filter: 'ALL_ALERTS' | 'OVERDUE' | 'NEAR_OVERDUE',
  now?: Date,
): { task: TaskDto; sla: PickupSlaInfo }[] {
  const currentTime = now ?? new Date();
  const results: { task: TaskDto; sla: PickupSlaInfo }[] = [];

  for (const task of tasks) {
    const sla = computePickupSla(task, currentTime);
    if (!sla || sla.status === 'ON_TIME' || sla.status === 'DONE') {
      continue;
    }

    if (filter === 'ALL_ALERTS') {
      results.push({ task, sla });
    } else if (filter === 'OVERDUE' && sla.status === 'OVERDUE') {
      results.push({ task, sla });
    } else if (filter === 'NEAR_OVERDUE' && sla.status === 'NEAR_OVERDUE') {
      results.push({ task, sla });
    }
  }

  // Sắp xếp: Quá hạn nặng nhất lên đầu, sắp quá hạn (ít thời gian nhất) tiếp theo
  results.sort((a, b) => {
    if (a.sla.status === 'OVERDUE' && b.sla.status !== 'OVERDUE') return -1;
    if (a.sla.status !== 'OVERDUE' && b.sla.status === 'OVERDUE') return 1;
    // Cùng trạng thái → sắp xếp theo minutesDiff
    if (a.sla.status === 'OVERDUE') {
      // Quá hạn nhiều nhất lên đầu
      return b.sla.minutesDiff - a.sla.minutesDiff;
    }
    // Sắp quá hạn: ít thời gian nhất lên đầu
    return a.sla.minutesDiff - b.sla.minutesDiff;
  });

  return results;
}

/**
 * Đếm nhanh số lượng đơn quá hạn và sắp quá hạn.
 */
export function countSlaSummary(
  tasks: TaskDto[],
  now?: Date,
): { overdueCount: number; nearOverdueCount: number } {
  const currentTime = now ?? new Date();
  let overdueCount = 0;
  let nearOverdueCount = 0;

  for (const task of tasks) {
    const sla = computePickupSla(task, currentTime);
    if (!sla) continue;
    if (sla.status === 'OVERDUE') overdueCount++;
    else if (sla.status === 'NEAR_OVERDUE') nearOverdueCount++;
  }

  return { overdueCount, nearOverdueCount };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function computeDeadline(createdAt: Date): Date {
  const hour = createdAt.getHours();
  const deadline = new Date(createdAt);

  if (hour < 12) {
    // Tạo trước 12h trưa → hạn chót 22:00 cùng ngày
    deadline.setHours(22, 0, 0, 0);
  } else {
    // Tạo từ 12h trưa trở đi → hạn chót 12:00 trưa ngày hôm sau
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(12, 0, 0, 0);
  }

  return deadline;
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} phút`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} giờ`;
  }

  return `${hours}h ${minutes}p`;
}

function formatDeadlineShort(deadline: Date): string {
  const day = String(deadline.getDate()).padStart(2, '0');
  const month = String(deadline.getMonth() + 1).padStart(2, '0');
  const hours = String(deadline.getHours()).padStart(2, '0');
  const mins = String(deadline.getMinutes()).padStart(2, '0');
  return `${hours}:${mins} ${day}/${month}`;
}

function buildRuleLabel(createdAt: Date): string {
  const hour = createdAt.getHours();

  if (hour < 12) {
    return 'Tạo trước 12h trưa → Phải lấy trước 22h tối nay';
  }

  return 'Tạo sau 12h trưa → Phải lấy trước 12h trưa mai';
}
