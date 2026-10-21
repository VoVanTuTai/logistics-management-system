import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CskhTicket, Prisma } from '@prisma/client';
import { ClaimsService } from './claims.service';

export interface CreateCskhTicketInput {
  shipmentCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  source?: string;
  category?: string;
  priority?: string;
  title: string;
  description: string;
  assignedHubCode?: string;
  assignedHubName?: string;
  assignedAgent?: string;
  notes?: Array<{
    id: string;
    author: string;
    authorRole: string;
    content: string;
    createdAt: string;
  }>;
}

export interface AddCskhNoteInput {
  author: string;
  authorRole: string;
  content: string;
}

export interface EscalateToClaimInput {
  reportedBy: string;
  declaredValue?: number;
  codAmount?: number;
  claimRequestedAmount?: number;
  packageDescription?: string;
  damageDescription?: string;
}

const INITIAL_SEED_TICKETS = [
  {
    ticketCode: 'TCK-202609-001',
    shipmentCode: 'NX-88992211',
    customerName: 'Nguyễn Văn Hùng',
    customerPhone: '0912345678',
    customerEmail: 'hung.nguyen@example.com',
    source: 'AI_CHATBOT',
    category: 'AI_HANDOVER',
    priority: 'P1_CRITICAL',
    status: 'IN_PROGRESS',
    title: 'Khách cần giao gấp trước 11h sáng để kịp chuyến bay đi công tác',
    description: 'Người nhận yêu cầu gặp trực tiếp tổng đài viên từ khung chat AI. Bưu kiện đang lưu tại Hub Tân Bình, khách yêu cầu bưu tá ưu tiên giao trước 11h00.',
    assignedHubCode: 'HUB_TAN_BINH',
    assignedHubName: 'Hub Tân Bình (TP.HCM)',
    assignedAgent: 'Trần Thị Thu Thảo',
    slaLimitHours: 4,
    notes: [
      {
        id: 'n1',
        author: 'Nexus AI Agent',
        authorRole: 'AI Assistant',
        content: 'Khách hàng nhắn qua chat: "Đơn của tôi đang ở đâu? Sáng nay tôi cần gấp trước 11h vì có chuyến bay, làm ơn giục bưu tá giúp tôi". AI đã nhận diện intent GIUC_GIAO_KHAN_CAP và tạo ticket P1.',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    ticketCode: 'TCK-202609-002',
    shipmentCode: 'NXS000520',
    customerName: 'Trần Đình Trọng',
    customerPhone: '0988777666',
    source: 'CUSTOMER_MOBILE',
    category: 'DAMAGE_COMPLAINT',
    priority: 'P1_CRITICAL',
    status: 'ESCALATED_CLAIMS',
    title: 'Hàng điện tử đắt tiền bị vỡ màn hình khi mở hộp kiểm tra',
    description: 'Khách nhận kiện hàng đồng hồ Seiko Presage, phát hiện mặt kính vỡ rạn, ngoại quan hộp carton có vết móp méo va đập mạnh. Khách yêu cầu bồi thường 100% giá trị.',
    assignedHubCode: 'HUB_HCM_001',
    assignedHubName: 'Hub HCM 01 (Bình Thạnh)',
    assignedAgent: 'Lê Văn Quyết',
    slaLimitHours: 4,
    linkedClaimCode: 'CLM-202609-005',
    notes: [
      {
        id: 'n2',
        author: 'Lê Văn Quyết',
        authorRole: 'CSKH Lead',
        content: 'Đã tiếp nhận ảnh chụp hiện trường vỡ mặt kính của khách từ App Mobile. Vụ việc đủ điều kiện chuyển thẳng sang Phân hệ Giám định bồi thường CLM.',
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    ticketCode: 'TCK-202609-003',
    shipmentCode: 'NX-99112233',
    customerName: 'Hoàng Kim Yến',
    customerPhone: '0903111222',
    source: 'HOTLINE_1900',
    category: 'ADDRESS_CHANGE',
    priority: 'P2_HIGH',
    status: 'NEW',
    title: 'Đổi địa chỉ nhận sang toà nhà Landmark 81 do chuyển văn phòng',
    description: 'Khách gọi hotline 1900 0000 thông báo chuyển địa chỉ nhận từ Vinhomes Central Park sang Landmark 81 cùng phường 22 Bình Thạnh.',
    assignedHubCode: 'HUB_HCM_001',
    assignedHubName: 'Hub HCM 01 (Bình Thạnh)',
    assignedAgent: 'Trần Thị Thu Thảo',
    slaLimitHours: 12,
  },
  {
    ticketCode: 'TCK-202609-004',
    shipmentCode: 'NX-55667788',
    customerName: 'Phạm Minh Khôi',
    customerPhone: '0938999888',
    source: 'CUSTOMER_MOBILE',
    category: 'COURIER_ATTITUDE',
    priority: 'P3_NORMAL',
    status: 'RESOLVED',
    title: 'Phản ánh shipper không gọi điện trước khi cập nhật "Khách hẹn lại"',
    description: 'Người nhận ở nhà cả ngày nhưng thấy app báo "Giao không thành công lần 1 - Khách hẹn ngày khác". Khách yêu cầu bưu tá phải gọi điện trước.',
    assignedHubCode: 'HUB_LONG_BIEN',
    assignedHubName: 'Hub Long Biên (Hà Nội)',
    assignedAgent: 'Đỗ Văn Cường',
    slaLimitHours: 24,
    resolutionSummary: 'Đã làm việc với Đội trưởng bưu tá Long Biên. Shipper nhận lỗi do hết pin điện thoại, đã phát lại thành công sáng nay kèm lời xin lỗi khách hàng.',
    notes: [
      {
        id: 'n3',
        author: 'Đỗ Văn Cường',
        authorRole: 'CSKH',
        content: 'Đã gọi điện chăm sóc khách hàng sau phát, khách hài lòng và đồng ý đóng khiếu nại.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

@Injectable()
export class CskhService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly claimsService: ClaimsService,
  ) {}

  private async ensureSeedData(): Promise<void> {
    const count = await this.prisma.cskhTicket.count();
    if (count > 0) return;

    for (const seed of INITIAL_SEED_TICKETS) {
      await this.prisma.shipment.upsert({
        where: { code: seed.shipmentCode },
        update: {},
        create: {
          code: seed.shipmentCode,
          currentStatus: 'EXCEPTION',
        },
      });

      const now = new Date();
      const deadline = new Date(now.getTime() + seed.slaLimitHours * 3600 * 1000);

      await this.prisma.cskhTicket.create({
        data: {
          ticketCode: seed.ticketCode,
          shipmentCode: seed.shipmentCode,
          customerName: seed.customerName,
          customerPhone: seed.customerPhone,
          customerEmail: seed.customerEmail,
          source: seed.source,
          category: seed.category,
          priority: seed.priority,
          status: seed.status,
          title: seed.title,
          description: seed.description,
          assignedHubCode: seed.assignedHubCode,
          assignedHubName: seed.assignedHubName,
          assignedAgent: seed.assignedAgent,
          slaLimitHours: seed.slaLimitHours,
          slaDeadline: deadline,
          linkedClaimCode: seed.linkedClaimCode,
          resolutionSummary: seed.resolutionSummary,
          notes: seed.notes ?? [],
        },
      });
    }
  }

  async list(filters?: {
    search?: string;
    status?: string;
    category?: string;
    priority?: string;
    customerPhone?: string;
    shipmentCode?: string;
  }): Promise<CskhTicket[]> {
    await this.ensureSeedData();

    const where: Prisma.CskhTicketWhereInput = {};

    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters?.category && filters.category !== 'ALL') where.category = filters.category;
    if (filters?.priority && filters.priority !== 'ALL') where.priority = filters.priority;
    if (filters?.customerPhone) where.customerPhone = filters.customerPhone;
    if (filters?.shipmentCode) where.shipmentCode = filters.shipmentCode;

    if (filters?.search) {
      const term = filters.search.trim();
      where.OR = [
        { ticketCode: { contains: term, mode: 'insensitive' } },
        { shipmentCode: { contains: term, mode: 'insensitive' } },
        { customerName: { contains: term, mode: 'insensitive' } },
        { customerPhone: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
      ];
    }

    return this.prisma.cskhTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<CskhTicket> {
    await this.ensureSeedData();

    const found = await this.prisma.cskhTicket.findFirst({
      where: {
        OR: [{ id }, { ticketCode: id }],
      },
    });

    if (!found) {
      throw new NotFoundException(`CSKH Ticket ${id} not found.`);
    }

    return found;
  }

  async create(input: CreateCskhTicketInput): Promise<CskhTicket> {
    const count = await this.prisma.cskhTicket.count();
    const ticketCode = `TCK-202609-${String(count + 1).padStart(3, '0')}`;

    // Ensure shipment exists
    await this.prisma.shipment.upsert({
      where: { code: input.shipmentCode },
      update: {},
      create: {
        code: input.shipmentCode,
        currentStatus: 'EXCEPTION',
      },
    });

    const priority = input.priority || 'P3_NORMAL';
    const limitHours = priority === 'P1_CRITICAL' ? 4 : priority === 'P2_HIGH' ? 12 : 24;
    const deadline = new Date(Date.now() + limitHours * 3600 * 1000);

    return this.prisma.cskhTicket.create({
      data: {
        ticketCode,
        shipmentCode: input.shipmentCode,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        source: input.source || 'HOTLINE_1900',
        category: input.category || 'GENERAL_INQUIRY',
        priority,
        status: 'NEW',
        title: input.title,
        description: input.description,
        assignedHubCode: input.assignedHubCode,
        assignedHubName: input.assignedHubName,
        assignedAgent: input.assignedAgent,
        slaLimitHours: limitHours,
        slaDeadline: deadline,
        notes: input.notes || [],
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    resolutionSummary?: string,
  ): Promise<CskhTicket> {
    const item = await this.getById(id);

    const data: Prisma.CskhTicketUpdateInput = { status };
    if (resolutionSummary) {
      data.resolutionSummary = resolutionSummary;
    }
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    return this.prisma.cskhTicket.update({
      where: { id: item.id },
      data,
    });
  }

  async addNote(id: string, noteInput: AddCskhNoteInput): Promise<CskhTicket> {
    const item = await this.getById(id);
    const existingNotes = Array.isArray(item.notes) ? (item.notes as any[]) : [];

    const newNote = {
      id: `n_${Date.now()}`,
      author: noteInput.author,
      authorRole: noteInput.authorRole,
      content: noteInput.content,
      createdAt: new Date().toISOString(),
    };

    return this.prisma.cskhTicket.update({
      where: { id: item.id },
      data: {
        notes: [...existingNotes, newNote],
      },
    });
  }

  /**
   * GAP #5: Automatic bridge from CSKH Ticket -> CompensationClaim (Claims & Liability Matrix)
   */
  async escalateToClaim(
    id: string,
    claimInput: EscalateToClaimInput,
  ): Promise<{ ticket: CskhTicket; claim: any }> {
    const ticket = await this.getById(id);

    // 1. Determine IncidentType: DAMAGED vs LOST_IN_TRANSIT
    const incidentType = ticket.category === 'DAMAGE_COMPLAINT' ? 'DAMAGED' : 'LOST_IN_TRANSIT';

    // 2. Automatically create CompensationClaim in PostgreSQL
    const claim = await this.claimsService.create({
      shipmentCode: ticket.shipmentCode,
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      originHubCode: ticket.assignedHubCode || 'HUB-HCM-001',
      destinationHubCode: ticket.assignedHubCode || 'HUB-HN-001',
      incidentType,
      declaredValue: claimInput.declaredValue ?? 1000000,
      codAmount: claimInput.codAmount ?? 0,
      claimRequestedAmount: claimInput.claimRequestedAmount ?? claimInput.declaredValue ?? 1000000,
      reportedBy: `${claimInput.reportedBy} (Chuyển tiếp tự động từ CSKH Ticket [${ticket.ticketCode}])`,
      packageDescription: claimInput.packageDescription || ticket.title,
      damageDescription: claimInput.damageDescription || ticket.description,
    });

    // 3. Update Ticket status to ESCALATED_CLAIMS and link claimCode
    const existingNotes = Array.isArray(ticket.notes) ? (ticket.notes as any[]) : [];
    const bridgeNote = {
      id: `n_clm_${Date.now()}`,
      author: 'Hệ Thống Tự Động',
      authorRole: 'System Pipeline',
      content: `⚡ Đã tự động kích hoạt Hồ sơ Đền bù & Phân định trách nhiệm [${claim.claimCode}]. Chuyển quyền giám định cho QA Lead trên Ma trận Bồi thường 4 ô.`,
      createdAt: new Date().toISOString(),
    };

    const updatedTicket = await this.prisma.cskhTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'ESCALATED_CLAIMS',
        linkedClaimCode: claim.claimCode,
        notes: [...existingNotes, bridgeNote],
      },
    });

    return { ticket: updatedTicket, claim };
  }
}
