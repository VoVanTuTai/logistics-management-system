export type CskhTicketCategory =
  | 'DELIVERY_EXPEDITE'    // Giục giao hàng gấp trong ca
  | 'ADDRESS_CHANGE'       // Yêu cầu đổi địa chỉ / SĐT người nhận
  | 'DAMAGE_COMPLAINT'     // Báo hàng bể vỡ / hư hỏng
  | 'COURIER_ATTITUDE'     // Phản ánh thái độ bưu tá
  | 'AI_HANDOVER'          // Khách yêu cầu gặp người thật từ Chatbot AI
  | 'COD_DISCREPANCY'      // Thắc mắc / Khiếu nại tiền thu hộ COD
  | 'GENERAL_INQUIRY';     // Tư vấn chính sách / Hỗ trợ chung

export type CskhTicketStatus =
  | 'NEW'                  // Mới tiếp nhận
  | 'IN_PROGRESS'          // Đang phối hợp bưu cục/shipper xử lý
  | 'WAITING_CUSTOMER'     // Chờ khách phản hồi / gửi thêm chứng từ
  | 'ESCALATED_CLAIMS'     // Đã chuyển thành hồ sơ Bồi thường CLM
  | 'RESOLVED'             // Đã giải quyết xong (chờ đóng)
  | 'CLOSED';              // Đã đóng hoàn tất

export type CskhTicketPriority =
  | 'P1_CRITICAL'          // Khẩn cấp (< 4h SLA)
  | 'P2_HIGH'              // Cao (< 12h SLA)
  | 'P3_NORMAL';           // Bình thường (< 24h SLA)

export type CskhTicketSource =
  | 'AI_CHATBOT'           // Chuyển từ Chatbot AI
  | 'HOTLINE_1900'         // Cuộc gọi tổng đài 1900
  | 'MERCHANT_PORTAL'      // Gửi từ giao diện Shop
  | 'CUSTOMER_MOBILE';     // Khách gửi từ app mobile

export interface CskhInternalNote {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface CskhTicket {
  id: string;
  ticketCode: string;          // e.g. TCK-202609-001
  shipmentCode: string;        // e.g. NX-88992211
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  source: CskhTicketSource;
  category: CskhTicketCategory;
  priority: CskhTicketPriority;
  status: CskhTicketStatus;
  title: string;
  description: string;
  assignedHubCode: string;
  assignedHubName: string;
  assignedAgent?: string;
  
  // SLA Tracking (24h / 48h limit)
  createdAt: string;
  slaDeadline: string;
  slaLimitHours: number;       // e.g. 24 or 48
  resolvedAt?: string;
  closedAt?: string;
  isOverdue: boolean;

  // Linkage to Claims & Incident
  claimCode?: string;          // e.g. CLM-202609-001 if escalated
  incidentDamageNote?: string;

  // Audit and notes
  notes: CskhInternalNote[];
  resolutionSummary?: string;
}

export interface CskhSummaryStats {
  totalToday: number;
  inProgress: number;
  criticalP1: number;
  aiHandoverCount: number;
  slaComplianceRate: number;   // %
  avgResponseMinutes: number;
}
