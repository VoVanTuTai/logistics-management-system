import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerApiClient } from './client';

export type CskhTicketCategory =
  | 'DELIVERY_EXPEDITE'
  | 'ADDRESS_CHANGE'
  | 'DAMAGE_COMPLAINT'
  | 'COURIER_ATTITUDE'
  | 'AI_HANDOVER'
  | 'COD_DISCREPANCY'
  | 'GENERAL_INQUIRY';

export type CskhTicketPriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_NORMAL';

export type CskhTicketStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'ESCALATED_CLAIMS'
  | 'RESOLVED'
  | 'CLOSED';

export interface CskhTicketNote {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface CustomerCskhTicket {
  id: string;
  ticketCode: string;
  shipmentCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  source: string;
  category: CskhTicketCategory;
  priority: CskhTicketPriority;
  status: CskhTicketStatus;
  title: string;
  description: string;
  assignedHubCode: string;
  assignedHubName: string;
  assignedAgent: string;
  slaLimitHours: number;
  slaDeadline: string;
  isOverdue: boolean;
  claimCode?: string | null;
  notes: CskhTicketNote[];
  resolutionSummary?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface CreateCustomerTicketPayload {
  shipmentCode: string;
  customerName: string;
  customerPhone: string;
  category: CskhTicketCategory;
  title: string;
  description: string;
  priority?: CskhTicketPriority;
}

const STORAGE_KEY = '@customer_cskh_tickets';

const INITIAL_FALLBACK_TICKETS: CustomerCskhTicket[] = [
  {
    id: 'tck_seed_01',
    ticketCode: 'TCK-202609-001',
    shipmentCode: 'NX-88992211',
    customerName: 'Nguyễn Văn Hùng',
    customerPhone: '0912345678',
    source: 'AI_CHATBOT',
    category: 'AI_HANDOVER',
    priority: 'P1_CRITICAL',
    status: 'IN_PROGRESS',
    title: 'Khách cần giao gấp trước 11h sáng để kịp chuyến bay',
    description: 'Bưu kiện đang lưu tại Hub Tân Bình, đã yêu cầu shipper Lê Văn Bằng ưu tiên giao đầu ca.',
    assignedHubCode: 'HUB_TAN_BINH',
    assignedHubName: 'Hub Tân Bình (TP.HCM)',
    assignedAgent: 'Trần Thị Thu (CSKH-04)',
    slaLimitHours: 4,
    slaDeadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    isOverdue: false,
    notes: [
      {
        id: 'n1',
        author: 'AI Auto-Routing',
        authorRole: 'System',
        content: 'Chuyển giao từ AI Chatbot do khách yêu cầu gặp nhân viên.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'n2',
        author: 'Trần Thị Thu',
        authorRole: 'CSKH',
        content: 'Đã báo điều phối ưu tiên tuyến phát trước 11h00.',
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

async function getStoredLocalTickets(): Promise<CustomerCskhTicket[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FALLBACK_TICKETS));
      return INITIAL_FALLBACK_TICKETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FALLBACK_TICKETS;
  }
}

async function saveStoredLocalTickets(items: CustomerCskhTicket[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to cache cskh tickets locally:', err);
  }
}

export const cskhApi = {
  async getTickets(params?: { customerPhone?: string; shipmentCode?: string }): Promise<CustomerCskhTicket[]> {
    const query = new URLSearchParams();
    if (params?.customerPhone) query.append('customerPhone', params.customerPhone);
    if (params?.shipmentCode) query.append('shipmentCode', params.shipmentCode);
    const queryString = query.toString();
    const endpoint = queryString ? `/customer/shipment/cskh/tickets?${queryString}` : '/customer/shipment/cskh/tickets';

    try {
      const tickets = await customerApiClient.request<CustomerCskhTicket[]>(endpoint);
      if (Array.isArray(tickets) && tickets.length > 0) {
        await saveStoredLocalTickets(tickets);
        return tickets;
      }
    } catch (err) {
      console.warn('[cskhApi] Backend fetch failed, reading local fallback', err);
    }

    const local = await getStoredLocalTickets();
    if (params?.shipmentCode) {
      return local.filter((t) => t.shipmentCode.toLowerCase().includes(params.shipmentCode!.toLowerCase()));
    }
    return local;
  },

  async createTicket(payload: CreateCustomerTicketPayload): Promise<CustomerCskhTicket> {
    try {
      const created = await customerApiClient.request<CustomerCskhTicket>('/customer/shipment/cskh/tickets', {
        method: 'POST',
        body: {
          ...payload,
          source: 'CUSTOMER_MOBILE',
          priority: payload.priority || (payload.category === 'DAMAGE_COMPLAINT' ? 'P2_HIGH' : 'P3_NORMAL'),
          assignedHubCode: 'HUB_TAN_BINH',
          assignedHubName: 'Hub Tân Bình (TP.HCM)',
        },
      });
      if (created && created.id) {
        const local = await getStoredLocalTickets();
        await saveStoredLocalTickets([created, ...local]);
        return created;
      }
    } catch (err) {
      console.warn('[cskhApi] Backend create failed, creating in local fallback', err);
    }

    // Local fallback
    const local = await getStoredLocalTickets();
    const nextNum = local.length + 1;
    const ticketCode = `TCK-202610-${String(nextNum).padStart(3, '0')}`;
    const limitHours = payload.category === 'DAMAGE_COMPLAINT' ? 12 : 24;
    const now = new Date();
    const deadline = new Date(now.getTime() + limitHours * 3600 * 1000);

    const newTicket: CustomerCskhTicket = {
      id: `tck_local_${Date.now()}`,
      ticketCode,
      shipmentCode: payload.shipmentCode,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      source: 'CUSTOMER_MOBILE',
      category: payload.category,
      priority: payload.priority || (payload.category === 'DAMAGE_COMPLAINT' ? 'P2_HIGH' : 'P3_NORMAL'),
      status: 'NEW',
      title: payload.title,
      description: payload.description,
      assignedHubCode: 'HUB_TAN_BINH',
      assignedHubName: 'Hub tiếp nhận (TP.HCM)',
      assignedAgent: 'Đang xếp chuyên viên',
      slaLimitHours: limitHours,
      slaDeadline: deadline.toISOString(),
      isOverdue: false,
      notes: [
        {
          id: `note_${Date.now()}`,
          author: payload.customerName,
          authorRole: 'Khách hàng',
          content: payload.description,
          createdAt: now.toISOString(),
        },
      ],
      createdAt: now.toISOString(),
    };

    const updated = [newTicket, ...local];
    await saveStoredLocalTickets(updated);
    return newTicket;
  },

  async addNote(ticketId: string, content: string, customerName: string): Promise<CustomerCskhTicket> {
    try {
      const updated = await customerApiClient.request<CustomerCskhTicket>(
        `/customer/shipment/cskh/tickets/${encodeURIComponent(ticketId)}/notes`,
        {
          method: 'POST',
          body: {
            content,
            author: customerName,
            authorRole: 'Khách hàng',
          },
        }
      );
      if (updated && updated.id) {
        const local = await getStoredLocalTickets();
        const idx = local.findIndex((t) => t.id === ticketId);
        if (idx !== -1) {
          local[idx] = updated;
          await saveStoredLocalTickets(local);
        }
        return updated;
      }
    } catch (err) {
      console.warn('[cskhApi] Backend addNote failed, updating local fallback', err);
    }

    const local = await getStoredLocalTickets();
    const idx = local.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = { ...local[idx] };
    ticket.notes = [
      ...ticket.notes,
      {
        id: `note_${Date.now()}`,
        author: customerName,
        authorRole: 'Khách hàng',
        content,
        createdAt: new Date().toISOString(),
      },
    ];
    local[idx] = ticket;
    await saveStoredLocalTickets(local);
    return ticket;
  },
};
