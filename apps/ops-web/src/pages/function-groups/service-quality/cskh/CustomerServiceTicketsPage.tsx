import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Headphones,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  PhoneCall,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  Store,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  CSKH_CATEGORY_LABELS,
  CSKH_PRIORITY_LABELS,
  CSKH_SOURCE_LABELS,
  CSKH_STATUS_LABELS,
  addCskhInternalNoteApi,
  computeCskhStats,
  escalateCskhTicketToClaimApi,
  fetchCskhTicketsApi,
  updateCskhTicketStatusApi,
} from '../../../../features/cskh/cskh.data';
import type {
  CskhTicket,
  CskhTicketStatus,
  TicketAttachment,
} from '../../../../features/cskh/cskh.types';
import { routePaths } from '../../../../navigation/routes';
import { normalizeMinioMediaUrl } from '../../../../utils/minioUtils';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { CustomerServiceTicketsTable } from './CustomerServiceTicketsTable';
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Quick resolution templates for 1-click filling
const QUICK_RESOLUTIONS = [
  'Đã liên hệ bưu tá phụ trách ưu tiên phát hàng gấp trong ca.',
  'Đã liên hệ với người nhận và thống nhất hẹn lại thời gian giao.',
  'Đã cập nhật lại thông tin địa chỉ / số điện thoại mới cho bưu tá.',
  'Đã giải thích chi tiết quy chuẩn bưu chính và khách hàng đồng thuận.',
  'Đã rà soát kho bưu cục, tìm thấy hàng và xuất chuyến phát bổ sung.',
];

export function CustomerServiceTicketsPage(): React.JSX.Element {
  const navigate = useNavigate();

  // State
  const [tickets, setTickets] = useState<CskhTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<CskhTicket | null>(null);
  const [previewMedia, setPreviewMedia] = useState<TicketAttachment | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');

  // Quick note dialog
  const [quickNoteTicket, setQuickNoteTicket] = useState<CskhTicket | null>(null);
  const [quickNoteText, setQuickNoteText] = useState<string>('');
  const [isSubmittingQuickNote, setIsSubmittingQuickNote] = useState<boolean>(false);

  // Drawer / Note input
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [resolutionInput, setResolutionInput] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);

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

  // Operational Counts for Intervention Tabs
  const urgentCount = useMemo(() => {
    return tickets.filter(
      (t) =>
        (t.status === 'NEW' || t.status === 'IN_PROGRESS') &&
        (t.priority === 'P1_CRITICAL' ||
          t.priority === 'P2_HIGH' ||
          t.isOverdue ||
          t.category === 'DAMAGE_COMPLAINT'),
    ).length;
  }, [tickets]);

  const aiHandoverCount = useMemo(() => {
    return tickets.filter((t) => t.category === 'AI_HANDOVER' || t.source === 'AI_CHATBOT').length;
  }, [tickets]);

  const waitingCustomerCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'WAITING_CUSTOMER').length;
  }, [tickets]);

  const resolvedCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  }, [tickets]);

  // Filtered tickets based on intervention workflow
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Workflow & Intervention Tabs
      if (activeCategoryTab === 'AI_HANDOVER') {
        if (t.category !== 'AI_HANDOVER' && t.source !== 'AI_CHATBOT') {
          return false;
        }
      } else if (activeCategoryTab === 'HUMAN_ACTION') {
        const isUrgent =
          (t.status === 'NEW' || t.status === 'IN_PROGRESS') &&
          (t.priority === 'P1_CRITICAL' ||
            t.priority === 'P2_HIGH' ||
            t.isOverdue ||
            t.category === 'DAMAGE_COMPLAINT');
        if (!isUrgent) return false;
      } else if (activeCategoryTab === 'WAITING_CUSTOMER') {
        if (t.status !== 'WAITING_CUSTOMER') return false;
      } else if (activeCategoryTab === 'RESOLVED') {
        if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'RESOLVED') {
          if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
        } else if (t.status !== selectedStatus) {
          return false;
        }
      }
      // Priority
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) {
        return false;
      }
      // Hub
      if (selectedHub !== 'ALL' && t.assignedHubName !== selectedHub) {
        return false;
      }
      // Search query across all fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = t.ticketCode.toLowerCase().includes(q);
        const matchShipment = t.shipmentCode.toLowerCase().includes(q);
        const matchCustomer = t.customerName.toLowerCase().includes(q);
        const matchPhone = t.customerPhone.includes(q);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchHub = t.assignedHubName?.toLowerCase().includes(q);
        if (!matchCode && !matchShipment && !matchCustomer && !matchPhone && !matchTitle && !matchDesc && !matchHub) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, activeCategoryTab, selectedStatus, selectedPriority, selectedHub, searchQuery]);

  // Handle Note Submission from Drawer
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const updated = await addCskhInternalNoteApi(selectedTicket.id, newNoteText);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setNewNoteText('');
    } catch {
      alert('Không thể lưu ghi chú. Vui lòng thử lại!');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Quick Add Note
  const handleQuickAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteTicket || !quickNoteText.trim()) return;

    setIsSubmittingQuickNote(true);
    try {
      const updated = await addCskhInternalNoteApi(quickNoteTicket.id, quickNoteText.trim());
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTicket?.id === updated.id) {
        setSelectedTicket(updated);
      }
      setQuickNoteTicket(null);
      setQuickNoteText('');
    } catch {
      alert('Không thể lưu ghi chú nhanh. Vui lòng thử lại!');
    } finally {
      setIsSubmittingQuickNote(false);
    }
  };

  // Batch Update Status
  const handleBatchUpdateStatus = async (ticketIds: string[], targetStatus: CskhTicketStatus) => {
    try {
      await Promise.all(
        ticketIds.map((id) =>
          updateCskhTicketStatusApi(
            id,
            targetStatus,
            targetStatus === 'RESOLVED'
              ? 'Xử lý và đóng phiếu hàng loạt thành công.'
              : `Cập nhật trạng thái sang [${CSKH_STATUS_LABELS[targetStatus].label}]`
          )
        )
      );
      await loadTickets();
    } catch {
      alert('Có lỗi xảy ra khi cập nhật trạng thái hàng loạt. Vui lòng thử lại!');
    }
  };

  // Streamlined 1-Click Resolution & Close Ticket
  const handleResolveAndClose = async (customNote?: string) => {
    if (!selectedTicket) return;
    const finalResolution = (customNote || resolutionInput).trim();
    if (!finalResolution) {
      alert('Vui lòng nhập hoặc chọn phương án xử lý trước khi đóng phiếu.');
      return;
    }

    setIsResolving(true);
    try {
      const updated = await updateCskhTicketStatusApi(
        selectedTicket.id,
        'RESOLVED',
        finalResolution
      );
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setResolutionInput('');
    } catch {
      alert('Không thể hoàn tất đóng phiếu. Vui lòng thử lại!');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Waiting Customer (when additional info is needed)
  const handleWaitCustomer = async () => {
    if (!selectedTicket) return;
    try {
      const note = resolutionInput.trim() || 'Đang liên hệ khách hàng để bổ sung thông tin chứng từ.';
      const updated = await updateCskhTicketStatusApi(selectedTicket.id, 'WAITING_CUSTOMER', note);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setResolutionInput('');
    } catch {
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại!');
    }
  };

  // Quick Reopen ticket if needed
  const handleReopenTicket = async () => {
    if (!selectedTicket) return;
    try {
      const updated = await updateCskhTicketStatusApi(
        selectedTicket.id,
        'IN_PROGRESS',
        'Mở lại phiếu để tiếp tục phối hợp xử lý theo yêu cầu mới của khách.'
      );
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      alert('Không thể mở lại phiếu. Vui lòng thử lại!');
    }
  };

  // Escalate damage complaint to Claims Liability (CLM)
  const handleEscalateToClaims = async () => {
    if (!selectedTicket) return;
    const confirmEscalate = window.confirm(
      `Bạn có chắc chắn muốn chuyển Ticket [${selectedTicket.ticketCode}] thành Hồ sơ Bồi thường Khiếu nại (Claims)?\n\nHệ thống sẽ tự động tạo một Hồ sơ Bồi thường (CompensationClaim) trên cơ sở dữ liệu tập trung liên kết hai chiều với Ticket này và chuyển sang Ban Giám Định Bồi Thường.`
    );
    if (!confirmEscalate) return;

    try {
      const res = await escalateCskhTicketToClaimApi(selectedTicket.id, {
        damageDescription: selectedTicket.description,
      });
      setSelectedTicket(res.ticket);
      setTickets((prev) => prev.map((t) => (t.id === res.ticket.id ? res.ticket : t)));
      alert(
        `Đã khởi tạo thành công Hồ sơ Bồi thường [${res.ticket.claimCode || res.claim?.claimCode}] trên hệ thống CompensationClaim!`
      );
    } catch {
      alert('Không thể chuyển tiếp sang CLM. Vui lòng thử lại!');
    }
  };

  const isSelectedClosed = selectedTicket
    ? selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'
    : false;

  return (
    <div className="cskh-page-container">
      {/* Header Compact */}
      <div className="cskh-page-header">
        <div className="cskh-header-title">
          <h1>
            <Headphones className="text-blue-600" size={22} />
            Trung tâm CSKH & Khiếu nại Vận hành
          </h1>
          <p>
            Hộp thư tiếp nhận và xử lý tập trung khiếu nại đổ về tự động từ AI Chatbot, Ứng dụng Khách hàng, Cổng Shop Merchant và Tổng đài Hotline 1900.
          </p>
        </div>

        <div className="cskh-header-actions">
          <div className="cskh-inbound-live-badge" title="Cổng tiếp nhận khiếu nại tự động đa kênh">
            <span className="cskh-live-dot" />
            <span>Tiếp nhận tự động đa kênh</span>
          </div>

          <button
            type="button"
            className="cskh-btn-secondary"
            onClick={loadTickets}
            disabled={isLoading}
            title="Đồng bộ danh sách khiếu nại mới"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Metric Strip (Compact Cards) */}
      <div className="cskh-metrics-grid">
        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Tổng Ticket tiếp nhận</span>
            <div className="cskh-metric-icon-wrap bg-blue-50 text-blue-600">
              <FileText size={15} />
            </div>
          </div>
          <div className="cskh-metric-value">{stats.totalToday}</div>
          <div className="cskh-metric-subtext">Đã ghi nhận trong 24h qua</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Đang phối hợp xử lý</span>
            <div className="cskh-metric-icon-wrap bg-amber-50 text-amber-600">
              <Clock size={15} />
            </div>
          </div>
          <div className="cskh-metric-value text-amber-600">{stats.inProgress}</div>
          <div className="cskh-metric-subtext">Cần bưu cục/shipper phản hồi</div>
        </div>

        <div className="cskh-metric-card" style={{ borderColor: stats.criticalP1 > 0 ? '#fecaca' : undefined }}>
          <div className="cskh-metric-header">
            <span className="cskh-metric-label text-rose-700">P1 Khẩn cấp / Quá hạn</span>
            <div className="cskh-metric-icon-wrap bg-rose-50 text-rose-600">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="cskh-metric-value text-rose-600">{stats.criticalP1}</div>
          <div className="cskh-metric-subtext">Yêu cầu can thiệp &lt; 4 giờ</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">AI Chatbot Handover</span>
            <div className="cskh-metric-icon-wrap bg-indigo-50 text-indigo-600">
              <Bot size={15} />
            </div>
          </div>
          <div className="cskh-metric-value text-indigo-600">{stats.aiHandoverCount}</div>
          <div className="cskh-metric-subtext">Khách yêu cầu gặp người thật</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Đạt SLA chuẩn (&lt; 24h-48h)</span>
            <div className="cskh-metric-icon-wrap bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="cskh-metric-value text-emerald-600">{stats.slaComplianceRate}%</div>
          <div className="cskh-metric-subtext">Đóng phiếu trong hạn quy định</div>
        </div>

        <div className="cskh-metric-card">
          <div className="cskh-metric-header">
            <span className="cskh-metric-label">Phản hồi trung bình</span>
            <div className="cskh-metric-icon-wrap bg-sky-50 text-sky-600">
              <PhoneCall size={15} />
            </div>
          </div>
          <div className="cskh-metric-value">{stats.avgResponseMinutes} ph</div>
          <div className="cskh-metric-subtext">Từ lúc tiếp nhận đến ca trực</div>
        </div>
      </div>

      {/* Filter & Search Toolbar Card */}
      <div className="cskh-toolbar-card">
        {/* Workflow & Intervention Tabs */}
        <div className="cskh-category-tabs">
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('ALL')}
          >
            Tất cả <span className="cskh-tab-count">{tickets.length}</span>
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'HUMAN_ACTION' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('HUMAN_ACTION')}
            title="Các yêu cầu khẩn cấp P1/P2 hoặc sự cố vượt ngoài quyền tự động của Chatbot AI"
          >
            <AlertTriangle size={13} className="text-rose-500" />
            Cần nhân viên can thiệp gấp{' '}
            <span className="cskh-tab-count" style={{ color: '#b91c1c', background: '#fee2e2' }}>
              {urgentCount}
            </span>
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'AI_HANDOVER' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('AI_HANDOVER')}
            title="Khách hàng yêu cầu gặp trực tiếp người thật từ Chatbot AI"
          >
            <Bot size={13} className="text-indigo-600" />
            AI Chatbot Handover{' '}
            <span className="cskh-tab-count" style={{ color: '#4338ca', background: '#e0e7ff' }}>
              {aiHandoverCount}
            </span>
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'WAITING_CUSTOMER' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('WAITING_CUSTOMER')}
            title="Đang chờ khách phản hồi hoặc bổ sung thông tin"
          >
            <Clock size={13} />
            Chờ khách phản hồi{' '}
            <span className="cskh-tab-count">
              {waitingCustomerCount}
            </span>
          </button>
          <button
            type="button"
            className={`cskh-tab-btn ${activeCategoryTab === 'RESOLVED' ? 'active' : ''}`}
            onClick={() => setActiveCategoryTab('RESOLVED')}
            title="Các yêu cầu đã được xử lý và đóng phiếu hoàn tất"
          >
            <CheckCircle2 size={13} className="text-emerald-600" />
            Đã xử lý & Đóng phiếu{' '}
            <span className="cskh-tab-count">
              {resolvedCount}
            </span>
          </button>
        </div>

        {/* Search & Dropdowns */}
        <div className="cskh-search-row">
          <div className="cskh-search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="cskh-search-input"
              placeholder="Tìm theo Mã Ticket, Mã vận đơn, Tên khách hàng, Số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="cskh-clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="cskh-filter-selects">
            <select
              className="cskh-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">-- Tất cả Trạng thái --</option>
              <option value="NEW">Mới tiếp nhận (Chưa xử lý)</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="WAITING_CUSTOMER">Chờ khách phản hồi</option>
              <option value="ESCALATED_CLAIMS">Đã chuyển Bồi thường CLM</option>
              <option value="RESOLVED">Đã xử lý & Đóng phiếu</option>
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
      </div>

      {/* Modernized Space-Optimized CSKH Tickets Table */}
      <CustomerServiceTicketsTable
        tickets={filteredTickets}
        selectedTicket={selectedTicket}
        onSelectTicket={(ticket) => setSelectedTicket(ticket)}
        onQuickAddNote={(ticket) => {
          setQuickNoteTicket(ticket);
          setQuickNoteText('');
        }}
        onBatchUpdateStatus={handleBatchUpdateStatus}
        isLoading={isLoading}
      />

      {/* Quick Add Note Modal */}
      {quickNoteTicket && (
        <div className="cskh-drawer-backdrop" onClick={() => setQuickNoteTicket(null)}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '90%',
              margin: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cskh-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} className="text-blue-600" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Ghi chú nhanh cho [{quickNoteTicket.ticketCode}]
                </span>
              </div>
              <button
                type="button"
                className="cskh-btn-secondary"
                style={{ padding: '4px', borderRadius: '50%' }}
                onClick={() => setQuickNoteTicket(null)}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleQuickAddNoteSubmit}>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Khách hàng: <strong>{quickNoteTicket.customerName}</strong> ({quickNoteTicket.customerPhone})
                  {' • '}Vận đơn: <strong>{quickNoteTicket.shipmentCode}</strong>
                </div>
                <textarea
                  rows={3}
                  required
                  autoFocus
                  className="cskh-search-input"
                  style={{
                    padding: '8px 10px',
                    height: 'auto',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                  placeholder="Nhập nội dung cập nhật nhanh (VD: Đã gọi shipper giao gấp trước 10h)..."
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                />
              </div>

              <div className="cskh-drawer-footer">
                <button
                  type="button"
                  className="cskh-btn-secondary"
                  onClick={() => setQuickNoteTicket(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="cskh-btn-primary"
                  disabled={isSubmittingQuickNote || !quickNoteText.trim()}
                >
                  {isSubmittingQuickNote ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Detail & Resolution Drawer */}
      {selectedTicket && (
        <div className="cskh-drawer-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="cskh-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="cskh-drawer-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: '#1d4ed8',
                    }}
                  >
                    {selectedTicket.ticketCode}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      CSKH_STATUS_LABELS[selectedTicket.status].badgeClass
                    }`}
                  >
                    {CSKH_STATUS_LABELS[selectedTicket.status].label}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
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
                <X size={15} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="cskh-drawer-body">
              {/* Overdue alert banner if applicable */}
              {selectedTicket.isOverdue && !isSelectedClosed && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#991b1b',
                  }}
                >
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                  <div style={{ fontSize: '11.5px' }}>
                    <strong>Cảnh báo vi phạm SLA:</strong> Phiếu khiếu nại này đã quá thời hạn cam kết cam đoan với
                    khách hàng ({selectedTicket.slaLimitHours}h). CSKH vui lòng liên hệ bưu cục/shipper xử lý ngay!
                  </div>
                </div>
              )}

              {/* General Ticket Metadata */}
              <div className="cskh-info-box">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Mã vận đơn liên kết</span>
                    <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CopyableShipmentCode code={selectedTicket.shipmentCode} />
                      <button
                        type="button"
                        className="cskh-btn-icon-action"
                        style={{ width: '22px', height: '22px' }}
                        title="Mở tra cứu hành trình vận đơn"
                        onClick={() => navigate(routePaths.trackingDetail(selectedTicket.shipmentCode))}
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Kênh gửi khiếu nại</span>
                    <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {selectedTicket.source === 'AI_CHATBOT' ? (
                        <Bot size={14} className="text-indigo-600" />
                      ) : selectedTicket.source === 'MERCHANT_PORTAL' ? (
                        <Store size={14} className="text-amber-600" />
                      ) : selectedTicket.source === 'CUSTOMER_MOBILE' ? (
                        <Smartphone size={14} className="text-blue-600" />
                      ) : (
                        <PhoneCall size={14} className="text-emerald-600" />
                      )}
                      <strong style={{ color: '#0f172a' }}>
                        {CSKH_SOURCE_LABELS[selectedTicket.source].label}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Khách hàng phản ánh</span>
                    <strong style={{ color: '#0f172a', display: 'block', marginTop: '2px' }}>
                      {selectedTicket.customerName}
                    </strong>
                    <a
                      href={`tel:${selectedTicket.customerPhone}`}
                      style={{
                        color: '#2563eb',
                        fontSize: '11.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                      title="Gọi trực tiếp cho khách"
                    >
                      <PhoneCall size={11} /> {selectedTicket.customerPhone}
                    </a>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Bưu cục điều phối</span>
                    <strong style={{ color: '#0f172a', display: 'block', marginTop: '2px' }}>
                      {selectedTicket.assignedHubName}
                    </strong>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      Phân loại: <span className="font-semibold">{CSKH_CATEGORY_LABELS[selectedTicket.category]?.label || selectedTicket.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Issue Description */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Tiêu đề & Nội dung phản ánh
                </h3>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '13.5px' }}>
                    {selectedTicket.title}
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Attachments Section: Images, Videos & Evidence */}
              <div className="cskh-drawer-section">
                <div className="cskh-drawer-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={15} style={{ color: '#0284c7' }} />
                    <span>Hình ảnh, Video &amp; Bằng chứng đính kèm</span>
                  </div>
                  <span className="cskh-attachments-count-badge">
                    {selectedTicket.attachments?.length || 0} tệp
                  </span>
                </div>

                {(!selectedTicket.attachments || selectedTicket.attachments.length === 0) ? (
                  <div className="cskh-attachments-empty">
                    <ImageIcon size={20} style={{ color: '#94a3b8', marginBottom: 4 }} />
                    <span>Không có hình ảnh hoặc video đính kèm trong phiếu này.</span>
                  </div>
                ) : (
                  <div className="cskh-attachments-grid">
                    {selectedTicket.attachments.map((att) => (
                      <div
                        key={att.id}
                        className={`cskh-attachment-card cskh-attachment-card--${att.type.toLowerCase()}`}
                        onClick={() => setPreviewMedia(att)}
                        title={`Bấm để xem: ${att.fileName} (${formatFileSize(att.fileSizeBytes)})`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreviewMedia(att);
                          }
                        }}
                      >
                        <div className="cskh-attachment-thumb-wrap">
                          <span className="cskh-minio-badge" title={`MinIO S3 Bucket: ${att.minioBucket || 'nexus-pod-images'}`}>
                            MinIO S3
                          </span>
                          {att.type === 'IMAGE' && (
                            <>
                              <img
                                src={att.thumbnailUrl || normalizeMinioMediaUrl(att.url)}
                                alt={att.fileName}
                                className="cskh-attachment-img"
                                onError={(e) => {
                                  if (att.thumbnailUrl && e.currentTarget.src !== att.thumbnailUrl) {
                                    e.currentTarget.src = att.thumbnailUrl;
                                  }
                                }}
                              />
                              <div className="cskh-attachment-overlay">
                                <Eye size={18} />
                                <span>Phóng to</span>
                              </div>
                            </>
                          )}
                          {att.type === 'VIDEO' && (
                            <>
                              <img
                                src={att.thumbnailUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&auto=format&fit=crop&q=80'}
                                alt={att.fileName}
                                className="cskh-attachment-img"
                              />
                              <div className="cskh-attachment-video-badge">
                                <Film size={11} />
                                <span>VIDEO</span>
                              </div>
                              <div className="cskh-attachment-play-btn">
                                <Play size={22} fill="white" />
                              </div>
                            </>
                          )}
                          {att.type === 'DOCUMENT' && (
                            <div className="cskh-attachment-doc-placeholder">
                              <FileText size={32} style={{ color: '#dc2626' }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>TÀI LIỆU</span>
                            </div>
                          )}
                        </div>

                        <div className="cskh-attachment-meta">
                          <strong className="cskh-attachment-name" title={att.fileName}>
                            {att.fileName}
                          </strong>
                          <div className="cskh-attachment-sub">
                            <span>{formatFileSize(att.fileSizeBytes)}</span>
                            {att.uploadedBy && <span> · {att.uploadedBy}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Claim escalation banner if linked */}
              {selectedTicket.linkedClaimCode && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 700 }}>
                    <ShieldAlert size={18} />
                    Hồ sơ bồi thường: {selectedTicket.linkedClaimCode}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px' }}>
                    Ticket này đã được chuyển tiếp trực tiếp sang Phân hệ Giám định bồi thường Trách nhiệm bưu cục
                    (Claims Liability Management).
                  </div>
                </div>
              )}

              {/* Escalation to Claims action button if damage and not linked */}
              {!selectedTicket.linkedClaimCode &&
                selectedTicket.category === 'DAMAGE_COMPLAINT' &&
                !isSelectedClosed && (
                  <div
                    style={{
                      border: '1px dashed #f87171',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#fff5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '12px', color: '#991b1b', display: 'block' }}>
                        Chuyển tiếp sang Ban Giám Định Bồi Thường (CLM)
                      </strong>
                      <span style={{ fontSize: '11px', color: '#7f1d1d' }}>
                        Tự động khởi tạo hồ sơ đền bù liên kết mã vận đơn & mở phiên thẩm định rủi ro.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="cskh-btn-secondary"
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        flexShrink: 0,
                      }}
                      onClick={handleEscalateToClaims}
                    >
                      <ShieldAlert size={14} />
                      Chuyển sang CLM
                    </button>
                  </div>
                )}

              {/* Resolution Summary (If resolved / closed) */}
              {isSelectedClosed && (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 700, fontSize: '13px' }}>
                      <CheckCircle2 size={16} />
                      Phiếu đã được xử lý & Đóng hoàn tất
                    </div>
                    <button
                      type="button"
                      onClick={handleReopenTicket}
                      className="cskh-btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px', height: '26px' }}
                      title="Mở lại phiếu trong trường hợp khách có khiếu nại bổ sung"
                    >
                      <RotateCcw size={12} />
                      Mở lại phiếu
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                    <strong>Kết quả giải quyết:</strong> {selectedTicket.resolutionSummary || 'Đã giải quyết yêu cầu hỗ trợ và thông báo tới khách hàng thành công.'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669' }}>
                    Thời gian đóng: {formatDateTime(selectedTicket.resolvedAt || selectedTicket.closedAt)}
                  </div>
                </div>
              )}

              {/* Notes Timeline */}
              <div>
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <MessageSquare size={15} />
                  Lịch sử xử lý & Ghi chú nội bộ ({selectedTicket.notes?.length || 0})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(!selectedTicket.notes || selectedTicket.notes.length === 0) && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      Chưa có ghi chú nào được ghi lại cho ticket này.
                    </div>
                  )}

                  {selectedTicket.notes?.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        backgroundColor: '#ffffff',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{n.author}</strong>
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {n.authorRole}
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                        {n.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="cskh-search-input"
                      placeholder="Ghi chú nội bộ cho bưu tá / nhân viên kho..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="cskh-btn-secondary"
                      disabled={isSubmittingNote || !newNoteText.trim()}
                      title="Gửi ghi chú nội bộ"
                    >
                      <Send size={13} />
                      Gửi
                    </button>
                  </div>
                </form>
              </div>

              {/* Streamlined Single-Action Resolution & Closing */}
              {!isSelectedClosed && (
                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Phương án xử lý & Đóng phiếu
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      (Xử lý xong sẽ tự động đóng phiếu hoàn tất)
                    </span>
                  </div>

                  {/* Quick Preset Chips */}
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Zap size={11} className="text-amber-500" /> Chọn nhanh phương án xử lý phổ biến:
                    </label>
                    <div className="cskh-quick-chips-wrap">
                      {QUICK_RESOLUTIONS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="cskh-quick-chip"
                          onClick={() => setResolutionInput(preset)}
                          title="Bấm để điền nhanh nội dung này"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Nội dung kết quả xử lý (*):
                    </label>
                    <textarea
                      rows={2}
                      className="cskh-search-input"
                      style={{
                        padding: '8px 10px',
                        height: 'auto',
                        minHeight: '60px',
                        resize: 'vertical',
                        lineHeight: 1.4,
                      }}
                      placeholder="VD: Đã liên hệ bưu tá giao bổ sung lúc 11h30, người nhận đã nhận hàng thành công..."
                      value={resolutionInput}
                      onChange={(e) => setResolutionInput(e.target.value)}
                    />
                  </div>

                  {/* Action Buttons: Unified Resolution Button */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="cskh-btn-primary"
                      style={{
                        backgroundColor: '#059669',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                      }}
                      disabled={isResolving}
                      onClick={() => handleResolveAndClose()}
                    >
                      <CheckCircle2 size={16} />
                      {isResolving ? 'Đang đóng phiếu...' : 'Xác nhận Xử lý & Đóng phiếu'}
                    </button>

                    <button
                      type="button"
                      className="cskh-btn-secondary"
                      onClick={handleWaitCustomer}
                      title="Chuyển trạng thái sang Chờ khách nếu khách chưa phản hồi hoặc cần gửi thêm ảnh"
                    >
                      <Clock size={13} />
                      Chờ khách phản hồi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="cskh-drawer-footer">
              <button
                type="button"
                className="cskh-btn-secondary"
                onClick={() => setSelectedTicket(null)}
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Media Preview Modal */}
      {previewMedia && (
        <div className="cskh-media-modal-backdrop" onClick={() => setPreviewMedia(null)}>
          <div className="cskh-media-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cskh-media-modal-header">
              <div className="cskh-media-modal-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`cskh-media-type-tag cskh-media-type-tag--${previewMedia.type.toLowerCase()}`}>
                    {previewMedia.type === 'IMAGE' ? 'HÌNH ẢNH' : previewMedia.type === 'VIDEO' ? 'VIDEO CLIP' : 'TÀI LIỆU'}
                  </span>
                  <span className="cskh-media-minio-tag" title="MinIO S3 Object Storage">
                    MinIO: {previewMedia.minioBucket || 'nexus-pod-images'}
                  </span>
                </div>
                <strong title={previewMedia.fileName}>{previewMedia.fileName}</strong>
                <small>
                  {formatFileSize(previewMedia.fileSizeBytes)}
                  {previewMedia.uploadedBy ? ` · Nguồn: ${previewMedia.uploadedBy}` : ''}
                  {previewMedia.uploadedAt ? ` · ${formatDateTime(previewMedia.uploadedAt)}` : ''}
                  {previewMedia.minioKey ? ` · Key: ${previewMedia.minioKey}` : ''}
                </small>
              </div>
              <div className="cskh-media-modal-actions">
                <a
                  href={normalizeMinioMediaUrl(previewMedia.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cskh-media-btn-download"
                  title="Mở tab mới hoặc tải về từ MinIO"
                  download={previewMedia.fileName}
                >
                  <Download size={15} />
                  <span>Tải về (MinIO)</span>
                </a>
                <button
                  type="button"
                  className="cskh-media-btn-close"
                  onClick={() => setPreviewMedia(null)}
                  title="Đóng cửa sổ xem"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="cskh-media-modal-body">
              {previewMedia.type === 'IMAGE' && (
                <img
                  src={previewMedia.thumbnailUrl || normalizeMinioMediaUrl(previewMedia.url)}
                  alt={previewMedia.fileName}
                  className="cskh-media-zoom-img"
                  onError={(e) => {
                    if (previewMedia.thumbnailUrl && e.currentTarget.src !== previewMedia.thumbnailUrl) {
                      e.currentTarget.src = previewMedia.thumbnailUrl;
                    }
                  }}
                />
              )}
              {previewMedia.type === 'VIDEO' && (
                <div className="cskh-media-video-container">
                  <video
                    src={normalizeMinioMediaUrl(previewMedia.url)}
                    controls
                    autoPlay
                    playsInline
                    className="cskh-media-video-player"
                  >
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
                    Trình duyệt của bạn không hỗ trợ thẻ video.
                  </video>
                </div>
              )}
              {previewMedia.type === 'DOCUMENT' && (
                <div className="cskh-media-doc-container">
                  <FileText size={48} style={{ color: '#0284c7', marginBottom: 12 }} />
                  <p>Tài liệu: <strong>{previewMedia.fileName}</strong></p>
                  <a
                    href={normalizeMinioMediaUrl(previewMedia.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cskh-btn-primary"
                    style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <ExternalLink size={14} />
                    Mở tài liệu trong tab mới (MinIO)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerServiceTicketsPage;
