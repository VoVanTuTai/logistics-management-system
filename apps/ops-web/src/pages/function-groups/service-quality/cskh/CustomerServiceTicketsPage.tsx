import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  Store,
  Truck,
  User,
  UserX,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  CSKH_CATEGORY_LABELS,
  CSKH_PRIORITY_LABELS,
  CSKH_SOURCE_LABELS,
  CSKH_STATUS_LABELS,
  addCskhInternalNoteApi,
  computeCskhStats,
  createCskhTicketApi,
  fetchCskhTicketsApi,
  updateCskhTicketStatusApi,
} from '../../../../features/cskh/cskh.data';
import type {
  CskhTicket,
  CskhTicketCategory,
  CskhTicketPriority,
  CskhTicketSource,
  CskhTicketStatus,
} from '../../../../features/cskh/cskh.types';
import { routePaths } from '../../../../navigation/routes';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import './CustomerServiceTicketsPage.css';

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSlaRemainingInfo(deadlineStr: string, isClosed: boolean): {
  text: string;
  isOverdue: boolean;
  isUrgent: boolean;
} {
  if (isClosed) {
    return { text: 'Đã hoàn tất', isOverdue: false, isUrgent: false };
  }

  const now = Date.now();
  const deadline = new Date(deadlineStr).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overdueMinutes = Math.abs(Math.floor(diffMs / 60000));
    const hours = Math.floor(overdueMinutes / 60);
    const mins = overdueMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} phút`;
    return { text: `Quá hạn ${timeStr}`, isOverdue: true, isUrgent: true };
  }

  const remainingMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  if (hours < 2) {
    return { text: `Còn ${hours > 0 ? `${hours}h ` : ''}${mins}m`, isOverdue: false, isUrgent: true };
  }

  return { text: `Còn ${hours}h ${mins}m`, isOverdue: false, isUrgent: false };
}

export function CustomerServiceTicketsPage(): React.JSX.Element {
  const navigate = useNavigate();

  // State
  const [tickets, setTickets] = useState<CskhTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<CskhTicket | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');

  // Drawer / Note input
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [resolutionInput, setResolutionInput] = useState<string>('');

  // Create Ticket Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTicketForm, setNewTicketForm] = useState<{
    shipmentCode: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    source: CskhTicketSource;
    category: CskhTicketCategory;
    priority: CskhTicketPriority;
    assignedHubCode: string;
    assignedHubName: string;
    title: string;
    description: string;
    slaLimitHours: number;
  }>({
    shipmentCode: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    source: 'HOTLINE_1900',
    category: 'GENERAL_INQUIRY',
    priority: 'P3_NORMAL',
    assignedHubCode: 'HUB_TAN_BINH',
    assignedHubName: 'Hub Tân Bình (TP.HCM)',
    title: '',
    description: '',
    slaLimitHours: 24,
  });

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCskhTicketsApi();
      setTickets(data);
      if (selectedTicket) {
        const refreshed = data.find((t) => t.id === selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Compute stats
  const stats = useMemo(() => computeCskhStats(tickets), [tickets]);

  // Unique hubs list for filter
  const hubOptions = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.assignedHubName) set.add(t.assignedHubName);
    });
    return Array.from(set);
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Category tab
      if (activeCategoryTab !== 'ALL' && t.category !== activeCategoryTab) {
        return false;
      }
      // Status
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
        return false;
      }
      // Priority
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) {
        return false;
      }
      // Hub
      if (selectedHub !== 'ALL' && t.assignedHubName !== selectedHub) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = t.ticketCode.toLowerCase().includes(q);
        const matchShipment = t.shipmentCode.toLowerCase().includes(q);
        const matchCustomer = t.customerName.toLowerCase().includes(q);
        const matchPhone = t.customerPhone.includes(q);
        const matchTitle = t.title.toLowerCase().includes(q);
        if (!matchCode && !matchShipment && !matchCustomer && !matchPhone && !matchTitle) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, activeCategoryTab, selectedStatus, selectedPriority, selectedHub, searchQuery]);

  // Handle Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const updated = await addCskhInternalNoteApi(selectedTicket.id, newNoteText);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setNewNoteText('');
    } catch (err) {
      alert('Không thể lưu ghi chú. Vui lòng thử lại!');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle Status Update
  const handleStatusChange = async (newStatus: CskhTicketStatus) => {
    if (!selectedTicket) return;

    let note = resolutionInput.trim();
    if (newStatus === 'RESOLVED' && !note) {
      note = 'Đã giải quyết yêu cầu hỗ trợ và thông báo tới khách hàng thành công.';
    }

    try {
      const updated = await updateCskhTicketStatusApi(selectedTicket.id, newStatus, note || undefined);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setResolutionInput('');
    } catch (err) {
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại!');
    }
  };

  // Escalate damage complaint to Claims Liability (CLM)
  const handleEscalateToClaims = async () => {
    if (!selectedTicket) return;
    const confirmEscalate = window.confirm(
      `Bạn có chắc chắn muốn chuyển Ticket [${selectedTicket.ticketCode}] thành Hồ sơ Bồi thường Khiếu nại (Claims)?\n\nHồ sơ sẽ được chuyển đến Bộ phận Pháp chế & Phân định rủi ro để thẩm định giá trị tổn thất.`
    );
    if (!confirmEscalate) return;

    const generatedClaimCode = selectedTicket.claimCode || `CLM-202609-${Math.floor(100 + Math.random() * 900)}`;
    const escalationNote = `Chuyển giao hồ sơ khiếu nại bể vỡ/hư hỏng sang Bộ phận Bồi thường CLM với mã tham chiếu: ${generatedClaimCode}`;

    try {
      const updated = await updateCskhTicketStatusApi(selectedTicket.id, 'ESCALATED_CLAIMS', escalationNote);
      updated.claimCode = generatedClaimCode;
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      alert(`Đã khởi tạo chuyển giao thành công sang Hồ sơ Đền bù: ${generatedClaimCode}`);
    } catch (err) {
      alert('Không thể chuyển tiếp sang CLM. Vui lòng thử lại!');
    }
  };

  // Handle Ticket Creation
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.shipmentCode.trim() || !newTicketForm.customerName.trim() || !newTicketForm.title.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
      return;
    }

    try {
      const created = await createCskhTicketApi(newTicketForm);
      setTickets((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedTicket(created);
      // Reset form
      setNewTicketForm({
        shipmentCode: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        source: 'HOTLINE_1900',
        category: 'GENERAL_INQUIRY',
        priority: 'P3_NORMAL',
        assignedHubCode: 'HUB_TAN_BINH',
        assignedHubName: 'Hub Tân Bình (TP.HCM)',
        title: '',
        description: '',
        slaLimitHours: 24,
      });
    } catch (err) {
      alert('Lỗi khi tạo Ticket mới. Vui lòng thử lại!');
    }
  };

  return (
    <div className="cskh-page-container">
      {/* Header */}
      <div className="cskh-page-header">
        <div className="cskh-header-title">
          <h1>
            <Headphones className="text-blue-600" size={26} />
            Trung tâm CSKH & Khiếu nại Vận hành
          </h1>
          <p>
            Tiếp nhận xử lý sự cố giao nhận, đổi địa chỉ, giục giao khẩn cấp, tiếp nhận từ AI Chatbot và chuyển giao
            hồ sơ bồi thường CLM (Cam kết SLA 24h - 48h)
          </p>
        </div>

        <div className="cskh-header-actions">
          <button
            type="button"
            className="cskh-btn-secondary"
            onClick={loadTickets}
            disabled={isLoading}
            title="Làm mới danh sách"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          <button
            type="button"
            className="cskh-btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            Tiếp nhận Ticket mới
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="cskh-metrics-grid">
        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Tổng Ticket tiếp nhận</span>
            <div className="cskh-metric-icon-wrap bg-blue-50 text-blue-600">
              <FileText size={18} />
            </div>
          </div>
          <div className="cskh-metric-value">{stats.totalToday}</div>
          <div className="cskh-metric-subtext">Đã ghi nhận trong 24h qua</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Đang phối hợp xử lý</span>
            <div className="cskh-metric-icon-wrap bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="cskh-metric-value text-amber-600">{stats.inProgress}</div>
          <div className="cskh-metric-subtext">Cần bưu cục/shipper phản hồi</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">P1 Khẩn cấp / Quá hạn</span>
            <div className="cskh-metric-icon-wrap bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="cskh-metric-value text-rose-600">{stats.criticalP1}</div>
          <div className="cskh-metric-subtext">Yêu cầu can thiệp &lt; 4 giờ</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">AI Chatbot Handover</span>
            <div className="cskh-metric-icon-wrap bg-indigo-50 text-indigo-600">
              <Bot size={18} />
            </div>
          </div>
          <div className="cskh-metric-value text-indigo-600">{stats.aiHandoverCount}</div>
          <div className="cskh-metric-subtext">Khách yêu cầu gặp người thật</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Đạt SLA chuẩn (&lt; 24h-48h)</span>
            <div className="cskh-metric-icon-wrap bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="cskh-metric-value text-emerald-600">{stats.slaComplianceRate}%</div>
          <div className="cskh-metric-subtext">Đóng phiếu trong hạn quy định</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Phản hồi trung bình</span>
            <div className="cskh-metric-icon-wrap bg-sky-50 text-sky-600">
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="cskh-metric-value">{stats.avgResponseMinutes} ph</div>
          <div className="cskh-metric-subtext">Từ lúc tiếp nhận đến ca trực</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="cskh-toolbar-card">
        <div className="cskh-search-row">
          <div className="cskh-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="cskh-search-input"
              placeholder="Tìm theo Mã Ticket, Mã vận đơn, Tên khách hàng, Số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="cskh-filter-selects">
            <select
              className="cskh-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">-- Tất cả Trạng thái --</option>
              <option value="NEW">Mới tiếp nhận</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="WAITING_CUSTOMER">Chờ khách phản hồi</option>
              <option value="ESCALATED_CLAIMS">Đã chuyển Bồi thường CLM</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="CLOSED">Đã đóng hoàn tất</option>
            </select>

            <select
              className="cskh-select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="ALL">-- Mức độ ưu tiên --</option>
              <option value="P1_CRITICAL">P1 - Khẩn cấp (&lt; 4h)</option>
              <option value="P2_HIGH">P2 - Cao (&lt; 12h)</option>
              <option value="P3_NORMAL">P3 - Tiêu chuẩn (&lt; 24h)</option>
            </select>

            <select
              className="cskh-select"
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
            >
              <option value="ALL">-- Tất cả Bưu cục phụ trách --</option>
              {hubOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="cskh-category-tabs">
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('ALL')}
          >
            Tất cả ({tickets.length})
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'AI_HANDOVER' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('AI_HANDOVER')}
          >
            <Bot size={14} />
            AI Chatbot Handover ({tickets.filter((t) => t.category === 'AI_HANDOVER').length})
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'DELIVERY_EXPEDITE' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('DELIVERY_EXPEDITE')}
          >
            <Truck size={14} />
            Giục giao gấp ({tickets.filter((t) => t.category === 'DELIVERY_EXPEDITE').length})
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'ADDRESS_CHANGE' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('ADDRESS_CHANGE')}
          >
            <MapPin size={14} />
            Đổi địa chỉ / SĐT ({tickets.filter((t) => t.category === 'ADDRESS_CHANGE').length})
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'DAMAGE_COMPLAINT' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('DAMAGE_COMPLAINT')}
          >
            <AlertTriangle size={14} />
            Khiếu nại bể vỡ ({tickets.filter((t) => t.category === 'DAMAGE_COMPLAINT').length})
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'COURIER_ATTITUDE' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('COURIER_ATTITUDE')}
          >
            <UserX size={14} />
            Thái độ bưu tá ({tickets.filter((t) => t.category === 'COURIER_ATTITUDE').length})
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'COD_DISCREPANCY' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('COD_DISCREPANCY')}
          >
            Khiếu nại COD ({tickets.filter((t) => t.category === 'COD_DISCREPANCY').length})
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="cskh-table-card">
        <div className="cskh-table-wrap">
          <table className="cskh-table">
            <thead>
              <tr>
                <th>Mã Ticket & Nguồn</th>
                <th>Mã vận đơn</th>
                <th>Khách hàng / SĐT</th>
                <th>Phân loại & Tiêu đề</th>
                <th>Mức độ ưu tiên</th>
                <th>Bưu cục & CSKH</th>
                <th>Thời hạn SLA</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <FileText size={32} className="text-slate-300" />
                      <span>Không tìm thấy Ticket khiếu nại nào phù hợp với điều kiện lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const isClosed = t.status === 'CLOSED' || t.status === 'RESOLVED';
                  const slaInfo = getSlaRemainingInfo(t.slaDeadline, isClosed);
                  const cat = CSKH_CATEGORY_LABELS[t.category] || CSKH_CATEGORY_LABELS.GENERAL_INQUIRY;
                  const priority = CSKH_PRIORITY_LABELS[t.priority];
                  const status = CSKH_STATUS_LABELS[t.status];
                  const source = CSKH_SOURCE_LABELS[t.source];

                  return (
                    <tr
                      key={t.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTicket(t)}
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className="cskh-ticket-code">{t.ticketCode}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {t.source === 'AI_CHATBOT' ? (
                              <Bot size={12} className="text-indigo-600" />
                            ) : t.source === 'HOTLINE_1900' ? (
                              <PhoneCall size={12} className="text-blue-600" />
                            ) : (
                              <Store size={12} className="text-emerald-600" />
                            )}
                            {source.label}
                          </span>
                        </div>
                      </td>

                      <td>
                        <CopyableShipmentCode code={t.shipmentCode} />
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.customerName}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{t.customerPhone}</span>
                        </div>
                      </td>

                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                            {cat.label}
                          </span>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={t.title}
                          >
                            {t.title}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${priority.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dotColor}`} />
                          {priority.label.split(' - ')[0]}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                            {t.assignedHubName}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {t.assignedAgent || 'Chưa phân công'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span
                            className={`cskh-sla-badge ${
                              isClosed ? 'ontime' : slaInfo.isOverdue ? 'overdue' : slaInfo.isUrgent ? 'warning' : 'ontime'
                            }`}
                          >
                            <Clock size={11} />
                            {slaInfo.text}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Hạn: {formatDateTime(t.slaDeadline)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="cskh-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                        >
                          Chi tiết & Xử lý
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedTicket && (
        <div className="cskh-drawer-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="cskh-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="cskh-drawer-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8' }}>
                    {selectedTicket.ticketCode}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      CSKH_STATUS_LABELS[selectedTicket.status].badgeClass
                    }`}
                  >
                    {CSKH_STATUS_LABELS[selectedTicket.status].label}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Tiếp nhận lúc: {formatDateTime(selectedTicket.createdAt)} (Thời hạn SLA:{' '}
                  {selectedTicket.slaLimitHours} giờ)
                </div>
              </div>

              <button
                type="button"
                className="cskh-btn-secondary"
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setSelectedTicket(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="cskh-drawer-body">
              {/* Overdue alert banner if applicable */}
              {selectedTicket.isOverdue && selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#991b1b',
                  }}
                >
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <div style={{ fontSize: '12px' }}>
                    <strong>Cảnh báo vi phạm SLA:</strong> Phiếu khiếu nại này đã quá thời hạn cam kết cam đoan với
                    khách hàng ({selectedTicket.slaLimitHours}h). CSKH vui lòng liên hệ bưu cục/shipper xử lý ngay!
                  </div>
                </div>
              )}

              {/* Customer & Shipment Info Box */}
              <div className="cskh-info-box">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  Thông tin Vận đơn & Khách hàng
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Mã vận đơn:</span>
                    <div style={{ marginTop: '2px' }}>
                      <CopyableShipmentCode code={selectedTicket.shipmentCode} />
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Nguồn tiếp nhận:</span>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: '#0f172a' }}>
                      {CSKH_SOURCE_LABELS[selectedTicket.source].label}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Khách hàng:</span>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: '#0f172a' }}>
                      {selectedTicket.customerName}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Số điện thoại:</span>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: '#0f172a' }}>
                      <a href={`tel:${selectedTicket.customerPhone}`} style={{ color: '#2563eb' }}>
                        {selectedTicket.customerPhone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Bưu cục điều phối:</span>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: '#0f172a' }}>
                      {selectedTicket.assignedHubName}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Chuyên viên trực:</span>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: '#0f172a' }}>
                      {selectedTicket.assignedAgent || 'Đang chờ phân bổ'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  {selectedTicket.title}
                </div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {selectedTicket.description}
                </div>
              </div>

              {/* Claims Escalation Link/Card */}
              {selectedTicket.claimCode ? (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={18} className="text-blue-600" />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
                          Hồ sơ Bồi thường Khiếu nại (CLM)
                        </span>
                        <div style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'monospace' }}>
                          Mã hồ sơ: {selectedTicket.claimCode}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cskh-btn-secondary"
                      style={{ fontSize: '11px', padding: '6px 10px', borderColor: '#93c5fd', color: '#1d4ed8' }}
                      onClick={() => navigate(routePaths.claimsLiabilityManagement)}
                    >
                      Mở hồ sơ CLM
                      <ExternalLink size={12} />
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
                    Hồ sơ này đã được chuyển lên Hội đồng Thẩm định Bồi thường để phân định trách nhiệm bưu cục/tài
                    xế theo quy định 7-10 ngày làm việc.
                  </div>
                </div>
              ) : selectedTicket.category === 'DAMAGE_COMPLAINT' ? (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} className="text-amber-600" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                      Khiếu nại bể vỡ / Hư hỏng hàng hóa
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#78350f' }}>
                    Khách hàng phản ánh kiện hàng bị tổn thất. Nếu đã có biên bản đồng kiểm xác nhận bể vỡ, hãy chuyển
                    Ticket này sang quy trình Thẩm định bồi thường chính thức (Claims Liability).
                  </div>
                  <div>
                    <button
                      type="button"
                      className="cskh-btn-primary"
                      style={{ backgroundColor: '#d97706', fontSize: '12px', padding: '6px 12px' }}
                      onClick={handleEscalateToClaims}
                    >
                      🚀 Khởi tạo Hồ sơ Bồi thường (CLM)
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Internal Notes & History */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  Nhật ký Xử lý & Ghi chú Phối hợp ({selectedTicket.notes.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                  {selectedTicket.notes.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                          {n.author} <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>({n.authorRole})</span>
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                        {n.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="cskh-search-input"
                    style={{ paddingLeft: '12px' }}
                    placeholder="Nhập ghi chú phản hồi của bưu tá/điều phối..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="cskh-btn-primary"
                    disabled={isSubmittingNote || !newNoteText.trim()}
                  >
                    <Send size={14} />
                    Gửi
                  </button>
                </form>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="cskh-drawer-footer">
              {selectedTicket.status !== 'IN_PROGRESS' && selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                <button
                  type="button"
                  className="cskh-btn-secondary"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                >
                  Nhận xử lý (In-Progress)
                </button>
              )}

              {selectedTicket.status !== 'WAITING_CUSTOMER' && selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                <button
                  type="button"
                  className="cskh-btn-secondary"
                  onClick={() => handleStatusChange('WAITING_CUSTOMER')}
                >
                  Chờ khách phản hồi
                </button>
              )}

              {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                <button
                  type="button"
                  className="cskh-btn-primary"
                  style={{ backgroundColor: '#059669' }}
                  onClick={() => handleStatusChange('RESOLVED')}
                >
                  <CheckCircle2 size={14} />
                  Giải quyết xong
                </button>
              )}

              {selectedTicket.status !== 'CLOSED' && (
                <button
                  type="button"
                  className="cskh-btn-secondary"
                  style={{ color: '#64748b' }}
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn đóng hoàn tất Ticket khiếu nại này?')) {
                      handleStatusChange('CLOSED');
                    }
                  }}
                >
                  Đóng Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="cskh-drawer-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '90%',
              margin: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cskh-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Headphones size={20} className="text-blue-600" />
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Tiếp nhận Yêu cầu / Khiếu nại Khách hàng mới
                </span>
              </div>
              <button
                type="button"
                className="cskh-btn-secondary"
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Mã vận đơn (*)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: NX-88992211"
                      className="cskh-search-input"
                      style={{ paddingLeft: '12px' }}
                      value={newTicketForm.shipmentCode}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, shipmentCode: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Nguồn tiếp nhận
                    </label>
                    <select
                      className="cskh-select"
                      style={{ width: '100%', height: '38px' }}
                      value={newTicketForm.source}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, source: e.target.value as CskhTicketSource })}
                    >
                      <option value="HOTLINE_1900">Tổng đài Hotline 1900</option>
                      <option value="AI_CHATBOT">AI Chatbot Handover</option>
                      <option value="MERCHANT_PORTAL">Cổng Merchant Shop</option>
                      <option value="CUSTOMER_MOBILE">Ứng dụng Khách hàng</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Họ tên người liên hệ (*)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn A"
                      className="cskh-search-input"
                      style={{ paddingLeft: '12px' }}
                      value={newTicketForm.customerName}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Số điện thoại (*)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0912 345 678"
                      className="cskh-search-input"
                      style={{ paddingLeft: '12px' }}
                      value={newTicketForm.customerPhone}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, customerPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Phân loại khiếu nại
                    </label>
                    <select
                      className="cskh-select"
                      style={{ width: '100%', height: '38px' }}
                      value={newTicketForm.category}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as CskhTicketCategory })}
                    >
                      <option value="DELIVERY_EXPEDITE">Giục giao khẩn cấp trong ca</option>
                      <option value="ADDRESS_CHANGE">Yêu cầu đổi địa chỉ / SĐT người nhận</option>
                      <option value="DAMAGE_COMPLAINT">Khiếu nại bể vỡ / Hư hỏng hàng hóa</option>
                      <option value="COURIER_ATTITUDE">Phản ánh thái độ bưu tá</option>
                      <option value="AI_HANDOVER">Tiếp nhận từ Chatbot AI</option>
                      <option value="COD_DISCREPANCY">Thắc mắc / Khiếu nại tiền COD</option>
                      <option value="GENERAL_INQUIRY">Tư vấn chính sách / Khác</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Mức độ ưu tiên & Hạn SLA
                    </label>
                    <select
                      className="cskh-select"
                      style={{ width: '100%', height: '38px' }}
                      value={newTicketForm.priority}
                      onChange={(e) => {
                        const pri = e.target.value as CskhTicketPriority;
                        const sla = pri === 'P1_CRITICAL' ? 4 : pri === 'P2_HIGH' ? 12 : 24;
                        setNewTicketForm({ ...newTicketForm, priority: pri, slaLimitHours: sla });
                      }}
                    >
                      <option value="P1_CRITICAL">P1 - Khẩn cấp (SLA &lt; 4 giờ)</option>
                      <option value="P2_HIGH">P2 - Cao (SLA &lt; 12 giờ)</option>
                      <option value="P3_NORMAL">P3 - Tiêu chuẩn (SLA &lt; 24 giờ)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Bưu cục phụ trách điều phối
                  </label>
                  <select
                    className="cskh-select"
                    style={{ width: '100%', height: '38px' }}
                    value={newTicketForm.assignedHubCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const name =
                        code === 'HUB_TAN_BINH'
                          ? 'Hub Tân Bình (TP.HCM)'
                          : code === 'HUB_LONG_BIEN'
                          ? 'Hub Long Biên (Hà Nội)'
                          : 'Hub Hải Châu (Đà Nẵng)';
                      setNewTicketForm({ ...newTicketForm, assignedHubCode: code, assignedHubName: name });
                    }}
                  >
                    <option value="HUB_TAN_BINH">Hub Tân Bình (TP.HCM)</option>
                    <option value="HUB_LONG_BIEN">Hub Long Biên (Hà Nội)</option>
                    <option value="HUB_HAI_CHAU">Hub Hải Châu (Đà Nẵng)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Tiêu đề Ticket (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Khách cần giao trước 11h sáng để kịp bay"
                    className="cskh-search-input"
                    style={{ paddingLeft: '12px' }}
                    value={newTicketForm.title}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Mô tả chi tiết nội dung sự cố
                  </label>
                  <textarea
                    rows={3}
                    className="cskh-search-input"
                    style={{ paddingLeft: '12px', minHeight: '70px', resize: 'vertical' }}
                    placeholder="Ghi rõ chi tiết sự việc, yêu cầu của khách để bưu cục phối hợp..."
                    value={newTicketForm.description}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="cskh-drawer-footer">
                <button
                  type="button"
                  className="cskh-btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="cskh-btn-primary">
                  Lưu & Tiếp nhận Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerServiceTicketsPage;
