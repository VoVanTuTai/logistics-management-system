import type {
  CskhInternalNote,
  CskhSummaryStats,
  CskhTicket,
  CskhTicketCategory,
  CskhTicketPriority,
  CskhTicketSource,
  CskhTicketStatus,
} from './cskh.types';

export const CSKH_CATEGORY_LABELS: Record<CskhTicketCategory, { label: string; icon: string; color: string }> = {
  DELIVERY_EXPEDITE: { label: 'Giục giao khẩn cấp', icon: 'truck', color: 'blue' },
  ADDRESS_CHANGE: { label: 'Đổi địa chỉ / SĐT', icon: 'map-pin', color: 'purple' },
  DAMAGE_COMPLAINT: { label: 'Khiếu nại bể vỡ / Hư hỏng', icon: 'alert-triangle', color: 'red' },
  COURIER_ATTITUDE: { label: 'Phản ánh thái độ bưu tá', icon: 'user-x', color: 'amber' },
  AI_HANDOVER: { label: 'Chuyển tiếp từ AI Chatbot', icon: 'bot', color: 'indigo' },
  COD_DISCREPANCY: { label: 'Khiếu nại tiền COD', icon: 'dollar-sign', color: 'emerald' },
  GENERAL_INQUIRY: { label: 'Tư vấn / Hỗ trợ khác', icon: 'help-circle', color: 'slate' },
};

export const CSKH_STATUS_LABELS: Record<CskhTicketStatus, { label: string; badgeClass: string }> = {
  NEW: { label: 'Mới tiếp nhận', badgeClass: 'bg-sky-100 text-sky-800 border-sky-200' },
  IN_PROGRESS: { label: 'Đang xử lý', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  WAITING_CUSTOMER: { label: 'Chờ khách phản hồi', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  ESCALATED_CLAIMS: { label: 'Đã chuyển Bồi thường CLM', badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  RESOLVED: { label: 'Đã giải quyết', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CLOSED: { label: 'Đã đóng hoàn tất', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const CSKH_PRIORITY_LABELS: Record<CskhTicketPriority, { label: string; dotColor: string; badgeClass: string }> = {
  P1_CRITICAL: { label: 'P1 - Khẩn cấp (< 4h)', dotColor: 'bg-rose-500', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' },
  P2_HIGH: { label: 'P2 - Cao (< 12h)', dotColor: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium' },
  P3_NORMAL: { label: 'P3 - Tiêu chuẩn (< 24h)', dotColor: 'bg-blue-500', badgeClass: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const CSKH_SOURCE_LABELS: Record<CskhTicketSource, { label: string; icon: string }> = {
  AI_CHATBOT: { label: 'AI Chatbot Handover', icon: 'bot' },
  HOTLINE_1900: { label: 'Hotline 1900 0000', icon: 'phone-call' },
  MERCHANT_PORTAL: { label: 'Cổng Merchant', icon: 'store' },
  CUSTOMER_MOBILE: { label: 'Khách hàng Mobile', icon: 'smartphone' },
};

const STORAGE_KEY = 'nexus_cskh_tickets_v1';

const INITIAL_MOCK_TICKETS: CskhTicket[] = [
  {
    id: 'tck_001',
    ticketCode: 'TCK-202609-001',
    shipmentCode: 'NX-88992211',
    customerName: 'Nguyễn Văn Hùng',
    customerPhone: '0912 345 678',
    customerEmail: 'hung.nguyen@example.com',
    source: 'AI_CHATBOT',
    category: 'AI_HANDOVER',
    priority: 'P1_CRITICAL',
    status: 'IN_PROGRESS',
    title: 'Khách cần giao gấp trước 11h sáng để kịp chuyến bay đi công tác',
    description: 'Người nhận yêu cầu gặp trực tiếp tổng đài viên từ khung chat AI. Bưu kiện đang lưu tại Hub Tân Bình, khách yêu cầu bưu tá ưu tiên giao trước 11h00.',
    assignedHubCode: 'HUB_TAN_BINH',
    assignedHubName: 'Hub Tân Bình (TP.HCM)',
    assignedAgent: 'Trần Thị Thu (CSKH-04)',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    slaLimitHours: 4,
    isOverdue: false,
    notes: [
      {
        id: 'n1',
        author: 'AI Auto-Routing',
        authorRole: 'System Bot',
        content: 'Chuyển giao tự động từ Web Floating Chatbot do khách bấm "Gặp nhân viên hỗ trợ".',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'n2',
        author: 'Trần Thị Thu',
        authorRole: 'CSKH Ca Sáng',
        content: 'Đã gọi điện cho Điều phối viên Hub Tân Bình ưu tiên xếp kiện này lên chuyến phát đầu ca của shipper Lê Văn Bằng.',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'tck_002',
    ticketCode: 'TCK-202609-002',
    shipmentCode: '333000000001',
    customerName: 'Hoàng Minh Tuấn (Shop Coolmate)',
    customerPhone: '0988 777 666',
    customerEmail: 'support@coolmate.vn',
    source: 'MERCHANT_PORTAL',
    category: 'DAMAGE_COMPLAINT',
    priority: 'P2_HIGH',
    status: 'ESCALATED_CLAIMS',
    title: 'Đơn hàng giá trị cao bị nứt vỡ thùng khi nhận, yêu cầu đền bù 100%',
    description: 'Shop phản ánh đơn hàng thiết bị điện tử giá trị 15.000.000đ có mua gói Bảo hiểm Toàn diện, người nhận kiểm tra thấy móp nứt vỏ hộp. Đã có biên bản đồng kiểm có chữ ký bưu tá.',
    assignedHubCode: 'HUB_TAN_BINH',
    assignedHubName: 'Hub Tân Bình (TP.HCM)',
    assignedAgent: 'Lê Hoàng Nam (Trưởng nhóm CSKH)',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    slaLimitHours: 24,
    isOverdue: false,
    claimCode: 'CLM-202609-001',
    incidentDamageNote: 'Thùng ngoài nứt rách góc đáy do va đập trong quá trình bốc dỡ tại băng chuyền phân loại Hub Tân Bình.',
    notes: [
      {
        id: 'n3',
        author: 'Lê Hoàng Nam',
        authorRole: 'CSKH Senior',
        content: 'Đã kiểm tra chứng từ bảo hiểm và biên bản đồng kiểm hợp lệ. Đã chuyển hồ sơ sang Ban Giám Định Trách Nhiệm (CLM-202609-001) để ra phán quyết bồi thường 15.000.000đ.',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'tck_003',
    ticketCode: 'TCK-202609-003',
    shipmentCode: 'NX-77665544',
    customerName: 'Phạm Thị Lan',
    customerPhone: '0903 111 222',
    source: 'HOTLINE_1900',
    category: 'ADDRESS_CHANGE',
    priority: 'P2_HIGH',
    status: 'NEW',
    title: 'Khách đổi địa chỉ nhận từ Quận 1 sang Quận 7 (Cùng TP.HCM)',
    description: 'Khách gọi hotline 1900 thông báo đột xuất chuyển văn phòng sang 105 Nguyễn Thị Thập, P. Tân Phú, Quận 7. Đơn hàng hiện đang ở trạng thái OUT_BOUND tại Hub Tân Bình.',
    assignedHubCode: 'HUB_QUAN_7',
    assignedHubName: 'Hub Quận 7 (TP.HCM)',
    assignedAgent: 'Chưa phân công',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
    slaLimitHours: 24,
    isOverdue: false,
    notes: [
      {
        id: 'n4',
        author: 'Tổng Đài Viên 102',
        authorRole: 'Hotline Agent',
        content: 'Khách hàng đồng ý giữ nguyên cước phí do cùng nội đô TP.HCM. Chờ Điều phối Hub cập nhật tuyến phát.',
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'tck_004',
    ticketCode: 'TCK-202609-004',
    shipmentCode: 'NX-99112233',
    customerName: 'Võ Minh Khang',
    customerPhone: '0938 999 888',
    source: 'CUSTOMER_MOBILE',
    category: 'COURIER_ATTITUDE',
    priority: 'P3_NORMAL',
    status: 'RESOLVED',
    title: 'Phản ánh shipper không gọi điện trước khi cập nhật "Khách hẹn lại"',
    description: 'Người nhận ở nhà cả ngày nhưng thấy app báo "Giao không thành công lần 1 - Khách hẹn ngày khác". Khách yêu cầu bưu tá phải gọi điện trước.',
    assignedHubCode: 'HUB_LONG_BIEN',
    assignedHubName: 'Hub Long Biên (Hà Nội)',
    assignedAgent: 'Đỗ Văn Cường',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    slaLimitHours: 24,
    isOverdue: true,
    resolvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    resolutionSummary: 'Đã làm việc với Đội trưởng bưu tá Long Biên. Shipper nhận lỗi do hết pin điện thoại, đã phát lại thành công sáng nay kèm lời xin lỗi khách hàng.',
    notes: [
      {
        id: 'n5',
        author: 'Đỗ Văn Cường',
        authorRole: 'CSKH',
        content: 'Đã gọi điện chăm sóc khách hàng sau phát, khách hài lòng và đồng ý đóng khiếu nại.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'tck_005',
    ticketCode: 'TCK-202609-005',
    shipmentCode: 'NX-33445566',
    customerName: 'Đặng Mai Phương (Shop Mẹ & Bé)',
    customerPhone: '0977 444 333',
    source: 'MERCHANT_PORTAL',
    category: 'COD_DISCREPANCY',
    priority: 'P2_HIGH',
    status: 'CLOSED',
    title: 'Thắc mắc khoản cấn trừ 50% cước hoàn trong bảng kê đối soát COD',
    description: 'Chủ shop thắc mắc vì sao đơn hàng bị bom lại bị trừ 18.500đ cước chuyển hoàn trong kỳ thanh toán tuần này.',
    assignedHubCode: 'HUB_DA_NANG',
    assignedHubName: 'Hub Đà Nẵng (Hải Châu)',
    assignedAgent: 'Võ Thị Hồng',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    slaLimitHours: 24,
    isOverdue: false,
    closedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    resolutionSummary: 'Đã giải thích rõ Quy chuẩn Cước chuyển hoàn bưu chính: Khách lẻ & Shop thường chịu 50% cước chiều đi khi bị bom hàng để bù đắp xe tải chiều về, tự động cấn trừ đối soát COD. Khách đã hiểu và vui vẻ đồng thuận.',
    notes: [
      {
        id: 'n6',
        author: 'Võ Thị Hồng',
        authorRole: 'CSKH Finance',
        content: 'Gửi kèm tài liệu trích dẫn quy chuẩn SOP bưu chính cho Shop qua Zalo OA.',
        createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

export function readCskhTickets(): CskhTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_TICKETS));
      return INITIAL_MOCK_TICKETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_TICKETS;
  }
}

export function saveCskhTickets(tickets: CskhTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('Failed to save CSKH tickets:', err);
  }
}

export async function fetchCskhTicketsApi(): Promise<CskhTicket[]> {
  await new Promise((r) => setTimeout(r, 120));
  return readCskhTickets();
}

export async function createCskhTicketApi(input: Partial<CskhTicket>): Promise<CskhTicket> {
  await new Promise((r) => setTimeout(r, 150));
  const current = readCskhTickets();
  const nextNum = current.length + 1;
  const ticketCode = `TCK-202609-${String(nextNum).padStart(3, '0')}`;
  const now = new Date();
  const limitHours = input.priority === 'P1_CRITICAL' ? 4 : input.priority === 'P2_HIGH' ? 12 : 24;
  const deadline = new Date(now.getTime() + limitHours * 3600 * 1000);

  const newTicket: CskhTicket = {
    id: 'tck_' + Date.now(),
    ticketCode,
    shipmentCode: input.shipmentCode || 'NX-UNKNOWN',
    customerName: input.customerName || 'Khách hàng',
    customerPhone: input.customerPhone || '---',
    customerEmail: input.customerEmail,
    source: input.source || 'HOTLINE_1900',
    category: input.category || 'GENERAL_INQUIRY',
    priority: input.priority || 'P3_NORMAL',
    status: 'NEW',
    title: input.title || 'Yêu cầu hỗ trợ CSKH',
    description: input.description || 'Chưa có mô tả chi tiết.',
    assignedHubCode: input.assignedHubCode || 'HUB_TAN_BINH',
    assignedHubName: input.assignedHubName || 'Hub Tân Bình (TP.HCM)',
    assignedAgent: input.assignedAgent || 'Đang phân công',
    createdAt: now.toISOString(),
    slaDeadline: deadline.toISOString(),
    slaLimitHours: limitHours,
    isOverdue: false,
    notes: [
      {
        id: 'n_' + Date.now(),
        author: 'Hệ thống',
        authorRole: 'System',
        content: 'Tiếp nhận Ticket khiếu nại mới vào hệ thống.',
        createdAt: now.toISOString(),
      },
    ],
  };

  const updated = [newTicket, ...current];
  saveCskhTickets(updated);
  return newTicket;
}

export async function updateCskhTicketStatusApi(
  ticketId: string,
  newStatus: CskhTicketStatus,
  resolutionNote?: string
): Promise<CskhTicket> {
  await new Promise((r) => setTimeout(r, 120));
  const current = readCskhTickets();
  const index = current.findIndex((t) => t.id === ticketId);
  if (index === -1) throw new Error('Ticket not found');

  const ticket = { ...current[index], status: newStatus };
  const nowStr = new Date().toISOString();

  if (newStatus === 'RESOLVED') {
    ticket.resolvedAt = nowStr;
    if (resolutionNote) ticket.resolutionSummary = resolutionNote;
  } else if (newStatus === 'CLOSED') {
    ticket.closedAt = nowStr;
  }

  if (resolutionNote) {
    ticket.notes = [
      ...ticket.notes,
      {
        id: 'n_' + Date.now(),
        author: 'Nhân viên CSKH',
        authorRole: 'CSKH Specialist',
        content: `Chuyển trạng thái sang [${CSKH_STATUS_LABELS[newStatus].label}]: ${resolutionNote}`,
        createdAt: nowStr,
      },
    ];
  }

  current[index] = ticket;
  saveCskhTickets(current);
  return ticket;
}

export async function addCskhInternalNoteApi(ticketId: string, content: string): Promise<CskhTicket> {
  await new Promise((r) => setTimeout(r, 80));
  const current = readCskhTickets();
  const index = current.findIndex((t) => t.id === ticketId);
  if (index === -1) throw new Error('Ticket not found');

  const ticket = { ...current[index] };
  const newNote: CskhInternalNote = {
    id: 'n_' + Date.now(),
    author: 'Trực nhật CSKH',
    authorRole: 'CSKH Operator',
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  ticket.notes = [...ticket.notes, newNote];
  current[index] = ticket;
  saveCskhTickets(current);
  return ticket;
}

export function computeCskhStats(tickets: CskhTicket[]): CskhSummaryStats {
  const totalToday = tickets.length;
  const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'NEW').length;
  const criticalP1 = tickets.filter((t) => t.priority === 'P1_CRITICAL' && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
  const aiHandoverCount = tickets.filter((t) => t.source === 'AI_CHATBOT').length;

  const closedCount = tickets.filter((t) => t.status === 'CLOSED' || t.status === 'RESOLVED').length;
  const ontimeClosed = tickets.filter((t) => (t.status === 'CLOSED' || t.status === 'RESOLVED') && !t.isOverdue).length;
  const slaComplianceRate = closedCount > 0 ? Math.round((ontimeClosed / closedCount) * 1000) / 10 : 95.8;

  return {
    totalToday,
    inProgress,
    criticalP1,
    aiHandoverCount,
    slaComplianceRate,
    avgResponseMinutes: 4.8,
  };
}
