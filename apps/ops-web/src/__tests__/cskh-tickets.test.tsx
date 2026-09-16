import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addCskhInternalNoteApi,
  computeCskhStats,
  createCskhTicketApi,
  fetchCskhTicketsApi,
  readCskhTickets,
  updateCskhTicketStatusApi,
} from '../features/cskh/cskh.data';
import CustomerServiceTicketsPage from '../pages/function-groups/service-quality/cskh/CustomerServiceTicketsPage';

describe('Customer Service (CSKH) & Ticket Management Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes seed tickets and computes operational SLA stats correctly', () => {
    const tickets = readCskhTickets();
    expect(tickets.length).toBeGreaterThanOrEqual(5);

    const stats = computeCskhStats(tickets);
    expect(stats.totalToday).toBe(tickets.length);
    expect(stats.inProgress).toBeGreaterThan(0);
    expect(stats.aiHandoverCount).toBeGreaterThanOrEqual(1);
    expect(stats.slaComplianceRate).toBeGreaterThan(0);
  });

  it('supports creating a new ticket, adding internal note, and updating status', async () => {
    // 1. Create ticket
    const newTicket = await createCskhTicketApi({
      shipmentCode: 'NX-99887766',
      customerName: 'Trần Đại Nghĩa',
      customerPhone: '0909123456',
      source: 'AI_CHATBOT',
      category: 'DELIVERY_EXPEDITE',
      priority: 'P1_CRITICAL',
      assignedHubCode: 'HUB_TAN_BINH',
      assignedHubName: 'Hub Tân Bình (TP.HCM)',
      title: 'Khách cần nhận trước 12h',
      description: 'Yêu cầu bưu tá gọi trước khi tới.',
      slaLimitHours: 4,
    });

    expect(newTicket.ticketCode).toMatch(/^TCK-202609-\d+/);
    expect(newTicket.status).toBe('NEW');
    expect(newTicket.priority).toBe('P1_CRITICAL');

    // 2. Add note
    const notedTicket = await addCskhInternalNoteApi(newTicket.id, 'Đã điều phối shipper giao gấp.');
    expect(notedTicket.notes.length).toBe(2);
    expect(notedTicket.notes[1].content).toContain('Đã điều phối shipper');

    // 3. Update status to IN_PROGRESS
    const inProgressTicket = await updateCskhTicketStatusApi(
      newTicket.id,
      'IN_PROGRESS',
      'Đang trên đường giao hàng'
    );
    expect(inProgressTicket.status).toBe('IN_PROGRESS');

    // 4. Resolve ticket
    const resolvedTicket = await updateCskhTicketStatusApi(
      newTicket.id,
      'RESOLVED',
      'Khách đã nhận kiện hàng lúc 11h20'
    );
    expect(resolvedTicket.status).toBe('RESOLVED');
    expect(resolvedTicket.resolvedAt).toBeDefined();
  });

  it('renders CustomerServiceTicketsPage with header, KPI cards, and ticket table', async () => {
    render(
      <BrowserRouter>
        <CustomerServiceTicketsPage />
      </BrowserRouter>
    );

    // Check title
    expect(screen.getByText(/Trung tâm CSKH & Khiếu nại Vận hành/i)).toBeInTheDocument();

    // Check KPI cards
    expect(screen.getByText(/Tổng Ticket tiếp nhận/i)).toBeInTheDocument();
    expect(screen.getByText(/P1 Khẩn cấp \/ Quá hạn/i)).toBeInTheDocument();
    expect(screen.getAllByText(/AI Chatbot Handover/i).length).toBeGreaterThanOrEqual(1);

    // Wait for tickets to load in table
    await waitFor(() => {
      expect(screen.getByText(/TCK-202609-001/i)).toBeInTheDocument();
    });

    // Check ticket code and details
    expect(screen.getByText(/Nguyễn Văn Hùng/i)).toBeInTheDocument();
    expect(screen.getByText(/NX-88992211/i)).toBeInTheDocument();

    // Click category tab "AI Chatbot Handover"
    const aiTab = screen.getByRole('button', { name: /AI Chatbot Handover/i });
    fireEvent.click(aiTab);

    // Should filter and show AI Chatbot tickets
    expect(screen.getByText(/TCK-202609-001/i)).toBeInTheDocument();
  });
});
