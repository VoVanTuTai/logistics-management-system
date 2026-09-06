import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Package,
  Send,
  Inbox,
  Search,
  RefreshCw,
  PlusCircle,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Eye,
  Printer,
  Copy,
  Check,
  X,
  Lock,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  Phone,
  User,
  ExternalLink,
  ArrowRight,
  QrCode,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { shipmentApi, type ShipmentResponse } from '../services/api/shipment.api';
import { printShippingLabel } from '../utils/shippingLabelService';
import qrcode from 'qrcode-generator';

function formatVnd(val?: number): string {
  if (!val || val <= 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
}

function formatDate(val?: string): string {
  if (!val) return 'Vừa xong';
  const d = new Date(val);
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

interface StatusBadgeInfo {
  label: string;
  bg: string;
  dot: string;
  color: string;
}

function getStatusBadgeDetails(status?: string): StatusBadgeInfo {
  const st = (status || '').toUpperCase();
  switch (st) {
    case 'CREATED':
      return {
        label: 'Chờ lấy hàng',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        color: '#f59e0b',
      };
    case 'PICKED_UP':
    case 'PICKUP_COMPLETED':
    case 'SCAN_PICKUP':
      return {
        label: 'Đã lấy hàng',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
        color: '#3b82f6',
      };
    case 'IN_TRANSIT':
    case 'SCAN_INBOUND':
    case 'SCAN_OUTBOUND':
    case 'SORTED':
    case 'ARRIVED_HUB':
    case 'ARRIVED_DEST_HUB':
      return {
        label: 'Đang vận chuyển',
        bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500',
        color: '#6366f1',
      };
    case 'DELIVERING':
    case 'OUT_FOR_DELIVERY':
    case 'TASK_ASSIGNED':
    case 'READY_FOR_DELIVERY':
      return {
        label: 'Đang giao hàng',
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        dot: 'bg-sky-500',
        color: '#0284c7',
      };
    case 'DELIVERED':
    case 'COMPLETED':
      return {
        label: 'Giao thành công',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        color: '#10b981',
      };
    case 'DELIVERY_FAILED':
    case 'NDR_CREATED':
      return {
        label: 'Sự cố giao hàng',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        color: '#ef4444',
      };
    case 'RETURNED':
    case 'RETURN_STARTED':
    case 'RETURN_COMPLETED':
    case 'RETURNING':
      return {
        label: 'Chuyển hoàn',
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
        color: '#a855f7',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-400',
        color: '#64748b',
      };
    default:
      return {
        label: status || 'Đang xử lý',
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        color: '#94a3b8',
      };
  }
}

export function OrdersPage(): React.JSX.Element {
  const { phone, token, user } = useAuthStore();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<'SENT' | 'RECEIVED'>('SENT');
  const [pickupTypeFilter, setPickupTypeFilter] = useState<'ALL' | 'PICKUP' | 'DROP_OFF'>('ALL');
  const [sentOrders, setSentOrders] = useState<ShipmentResponse[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<ShipmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedOrderForModal, setSelectedOrderForModal] = useState<ShipmentResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load orders from backend (synchronized with Customer Mobile)
  const loadShipments = async (showLoading = true) => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (showLoading) setIsLoading(true);
    try {
      const [sentRes, recRes] = await Promise.allSettled([
        shipmentApi.getShipments(token, { limit: 100, userId: user?.id }),
        shipmentApi.getReceivedShipments(token, { limit: 100, phone: phone || user?.phone }),
      ]);
      if (sentRes.status === 'fulfilled') {
        setSentOrders(sentRes.value || []);
      }
      if (recRes.status === 'fulfilled') {
        setReceivedOrders(recRes.value || []);
      }
      setLastSyncTime(new Date());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadShipments(true);
  }, [token, phone, user?.id]);

  // Real-time live polling every 10 seconds (matching customer-mobile)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      loadShipments(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, phone, user?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadShipments(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Unauthenticated Guard Screen
  if (!token || !phone) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-lg items-center justify-center px-4 py-8">
        <div className="w-full bg-white p-8 text-center rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-inner">
            <Lock className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đơn Hàng Của Tôi</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
              Vui lòng đăng nhập tài khoản Nexus để xem toàn bộ danh sách đơn hàng đã tạo, đồng bộ trực tiếp hai chiều với ứng dụng Customer Mobile.
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 rounded-2xl border border-blue-100 text-left text-xs space-y-2 text-blue-900 font-medium">
            <div className="flex items-center gap-2 font-bold text-blue-800">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Đồng bộ tài khoản Nexus:</span>
            </div>
            <p className="pl-6 text-[11px] text-blue-700 leading-relaxed">
              • Quản lý đồng thời <strong className="font-bold">Đơn đã gửi</strong> (do bạn tạo trên web hoặc app di động) và <strong className="font-bold">Đơn nhận</strong>.
            </p>
            <p className="pl-6 text-[11px] text-blue-700 leading-relaxed">
              • Cập nhật trạng thái thời gian thực từ bưu tá phân tuyến tự động.
            </p>
            <p className="pl-6 text-[11px] text-blue-700 leading-relaxed">
              • In phiếu gửi hàng A6 trực tiếp từ trình duyệt hoặc tra cứu GPS.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/25 transition"
          >
            Đăng Nhập / Đăng Ký Ngay
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  const currentList = activeCategory === 'SENT' ? sentOrders : receivedOrders;

  // KPI Quick Stats
  const stats = {
    total: currentList.length,
    pendingPickup: currentList.filter((s) => (s.currentStatus || '').toUpperCase() === 'CREATED').length,
    inTransit: currentList.filter((s) => {
      const st = (s.currentStatus || '').toUpperCase();
      return (
        st === 'IN_TRANSIT' ||
        st === 'SCAN_INBOUND' ||
        st === 'SCAN_OUTBOUND' ||
        st === 'SORTED' ||
        st === 'DELIVERING' ||
        st === 'OUT_FOR_DELIVERY' ||
        st === 'TASK_ASSIGNED' ||
        st === 'PICKED_UP' ||
        st === 'PICKUP_COMPLETED' ||
        st === 'ARRIVED_HUB' ||
        st === 'ARRIVED_DEST_HUB'
      );
    }).length,
    delivered: currentList.filter((s) => {
      const st = (s.currentStatus || '').toUpperCase();
      return st === 'DELIVERED' || st === 'COMPLETED';
    }).length,
    issues: currentList.filter((s) => {
      const st = (s.currentStatus || '').toUpperCase();
      return (
        st === 'DELIVERY_FAILED' ||
        st === 'NDR_CREATED' ||
        st === 'CANCELLED' ||
        st === 'RETURN_STARTED' ||
        st === 'RETURN_COMPLETED' ||
        st === 'RETURNED' ||
        st === 'RETURNING'
      );
    }).length,
  };

  // Filter Shipments
  const filteredShipments = currentList.filter((s) => {
    const meta = s.metadata || {};
    const service = meta.service || {};

    // 1. Pickup Method Filter
    if (pickupTypeFilter !== 'ALL') {
      const pType = meta.pickupType || service.pickupType || 'PICKUP';
      if (pType !== pickupTypeFilter) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      const st = (s.currentStatus || '').toUpperCase();
      if (statusFilter === 'CREATED' && st !== 'CREATED') return false;
      if (
        statusFilter === 'PICKUP_COMPLETED' &&
        !['PICKED_UP', 'PICKUP_COMPLETED', 'SCAN_PICKUP', 'ARRIVED_ORIGIN_HUB'].includes(st)
      )
        return false;
      if (
        statusFilter === 'IN_TRANSIT' &&
        !['IN_TRANSIT', 'SCAN_INBOUND', 'SCAN_OUTBOUND', 'SORTED'].includes(st)
      )
        return false;
      if (
        statusFilter === 'ARRIVED_HUB' &&
        !['ARRIVED_HUB', 'ARRIVED_DEST_HUB', 'SCAN_INBOUND'].includes(st)
      )
        return false;
      if (
        statusFilter === 'DELIVERING' &&
        !['DELIVERING', 'OUT_FOR_DELIVERY', 'TASK_ASSIGNED', 'READY_FOR_DELIVERY'].includes(st)
      )
        return false;
      if (statusFilter === 'DELIVERED' && !['DELIVERED', 'COMPLETED'].includes(st)) return false;
      if (statusFilter === 'DELIVERY_FAILED' && !['DELIVERY_FAILED', 'NDR_CREATED'].includes(st))
        return false;
      if (
        statusFilter === 'RETURNED' &&
        !['RETURNED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'RETURNING'].includes(st)
      )
        return false;
    }

    // 3. Time Filter
    if (timeFilter !== 'ALL' && s.createdAt) {
      const createdTime = new Date(s.createdAt).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (timeFilter === 'TODAY' && now - createdTime > oneDay) return false;
      if (timeFilter === '7DAYS' && now - createdTime > 7 * oneDay) return false;
      if (timeFilter === '30DAYS' && now - createdTime > 30 * oneDay) return false;
      if (timeFilter === 'THIS_MONTH') {
        const cDate = new Date(s.createdAt);
        const nowDate = new Date();
        if (cDate.getMonth() !== nowDate.getMonth() || cDate.getFullYear() !== nowDate.getFullYear()) {
          return false;
        }
      }
    }

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const code = (s.code || '').toLowerCase();
      const sName = (meta?.sender?.name || '').toLowerCase();
      const rName = (meta?.receiver?.name || '').toLowerCase();
      const rPhone = (meta?.receiver?.phone || '').toLowerCase();
      const sPhone = (meta?.sender?.phone || '').toLowerCase();
      const addr = (
        meta?.receiver?.address ||
        meta?.receiver?.addressDetail ||
        meta?.receiver?.province ||
        ''
      ).toLowerCase();
      const item = (meta?.package?.itemName || '').toLowerCase();
      const matches =
        code.includes(q) ||
        sName.includes(q) ||
        rName.includes(q) ||
        rPhone.includes(q) ||
        sPhone.includes(q) ||
        addr.includes(q) ||
        item.includes(q);
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER WITH REAL-TIME CLOUD SYNC INDICATOR */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Đơn Hàng
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Đồng bộ Live Mobile
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              <User className="h-3 w-3" />
              {phone}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Xem toàn bộ đơn hàng đã tạo, tự động đồng bộ dữ liệu thời gian thực với ứng dụng Customer Mobile.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Đang tải...' : 'Làm Mới'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Tạo Vận Đơn</span>
          </button>
        </div>
      </div>

      {/* 2. KPI QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Tổng Đơn {activeCategory === 'SENT' ? 'Gửi' : 'Nhận'}</span>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{stats.total}</p>
          <p className="text-[10px] text-slate-400 font-medium">Toàn bộ bưu gửi</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-600 font-bold">
            <span>Chờ Lấy Hàng</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono">{stats.pendingPickup}</p>
          <p className="text-[10px] text-amber-500 font-medium">Chờ bưu tá lấy</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-600 font-bold">
            <span>Đang Vận Chuyển / Giao</span>
            <Truck className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 font-mono">{stats.inTransit}</p>
          <p className="text-[10px] text-indigo-500 font-medium">Đang trên đường</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
            <span>Giao Thành Công</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">{stats.delivered}</p>
          <p className="text-[10px] text-emerald-500 font-medium">Đã giao tận tay</p>
        </div>
      </div>

      {/* 3. DUAL CATEGORY SWITCHER (SENT vs RECEIVED) */}
      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveCategory('SENT')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            activeCategory === 'SENT'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Đơn Đã Gửi (Đã tạo)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              activeCategory === 'SENT'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {sentOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('RECEIVED')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            activeCategory === 'RECEIVED'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Đơn Nhận Hàng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              activeCategory === 'RECEIVED'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {receivedOrders.length}
          </span>
        </button>
      </div>

      {/* 4. FILTER TOOLBAR: SEARCH + PICKUP METHOD + STATUS + TIME */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã vận đơn #NEXUS..., tên, SĐT, địa chỉ, tên hàng..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Status Dropdown */}
            <div className="relative flex-1 md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="CREATED">Chờ lấy hàng</option>
                <option value="PICKUP_COMPLETED">Đã lấy hàng</option>
                <option value="IN_TRANSIT">Đang vận chuyển</option>
                <option value="ARRIVED_HUB">Đã đến Hub</option>
                <option value="DELIVERING">Đang giao hàng</option>
                <option value="DELIVERED">Giao thành công</option>
                <option value="DELIVERY_FAILED">Sự cố / NDR</option>
                <option value="RETURNED">Chuyển hoàn</option>
              </select>
            </div>

            {/* Time Dropdown */}
            <div className="relative flex-1 md:w-40">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600"
              >
                <option value="ALL">Tất cả thời gian</option>
                <option value="TODAY">Hôm nay</option>
                <option value="7DAYS">7 ngày qua</option>
                <option value="30DAYS">30 ngày qua</option>
                <option value="THIS_MONTH">Tháng này</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pickup Method Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Hình thức:</span>
          <button
            type="button"
            onClick={() => setPickupTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              pickupTypeFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setPickupTypeFilter('PICKUP')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              pickupTypeFilter === 'PICKUP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="h-3 w-3" />
            Lấy hàng tại nhà
          </button>
          <button
            type="button"
            onClick={() => setPickupTypeFilter('DROP_OFF')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              pickupTypeFilter === 'DROP_OFF'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="h-3 w-3" />
            Gửi tại bưu cục
          </button>
        </div>
      </div>

      {/* 5. ORDERS LIST / GRID */}
      {isLoading ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Đang đồng bộ danh sách đơn hàng từ Nexus Cloud...</p>
          <p className="text-[11px] text-slate-400">Kết nối máy chủ thời gian thực</p>
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
            <Package className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-slate-800">
              {activeCategory === 'SENT' ? 'Chưa có đơn hàng gửi nào phù hợp.' : 'Chưa có đơn hàng nào gửi tới bạn.'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
              {searchQuery || statusFilter !== 'ALL' || timeFilter !== 'ALL' || pickupTypeFilter !== 'ALL'
                ? 'Thử thay đổi hoặc xóa bộ lọc trạng thái, hình thức gửi hoặc từ khóa tìm kiếm.'
                : activeCategory === 'SENT'
                ? 'Bắt đầu tạo vận đơn bưu gửi đầu tiên để trải nghiệm dịch vụ phân tuyến thông minh Nexus.'
                : 'Khi shop gửi hàng với số điện thoại của bạn, đơn sẽ tự động xuất hiện tại đây.'}
            </p>
          </div>
          {activeCategory === 'SENT' && (
            <button
              onClick={() => navigate('/create')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-600/20 transition inline-flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Tạo Vận Đơn Mới
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShipments.map((s) => {
            const badge = getStatusBadgeDetails(s.currentStatus);
            const meta = s.metadata || {};
            const sender = meta.sender || {};
            const receiver = meta.receiver || {};
            const pkg = meta.package || {};
            const service = meta.service || {};

            const weight = pkg.weightKg || meta.weightKg || 1;
            const cod = Number(meta.codAmount || pkg.codAmount || 0);
            const shippingFee = Number(meta.shippingFee || meta.estimatedFee || 22000);

            const pickupType = meta.pickupType || service.pickupType || 'PICKUP';
            const isDropOff = pickupType === 'DROP_OFF';

            const senderComposed =
              sender.address ||
              [sender.addressDetail, sender.ward, sender.district, sender.province].filter(Boolean).join(', ') ||
              'Bưu cục tiếp nhận';

            const receiverComposed =
              receiver.address ||
              [receiver.addressDetail, receiver.ward, receiver.district, receiver.province].filter(Boolean).join(', ') ||
              'Địa chỉ người nhận';

            return (
              <div
                key={s.id || s.code}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3.5"
              >
                {/* Header: Code + Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        #{s.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(s.code)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                        title="Sao chép mã"
                      >
                        {copiedCode === s.code ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Pickup Method Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isDropOff
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isDropOff ? (
                          <>
                            <Building2 className="h-3 w-3" /> Gửi bưu cục
                          </>
                        ) : (
                          <>
                            <Truck className="h-3 w-3" /> Lấy tại nhà
                          </>
                        )}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${badge.bg}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Route Block: Sender -> Receiver */}
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Gửi từ:</span>
                          <span className="font-bold text-slate-800 truncate">{sender.name || 'Người gửi'}</span>
                          {sender.phone && (
                            <span className="text-slate-500 text-[11px] font-mono">({sender.phone})</span>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] leading-tight line-clamp-1 mt-0.5">
                          {senderComposed}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Giao đến:</span>
                          <span className="font-bold text-slate-800 truncate">{receiver.name || 'Người nhận'}</span>
                          {receiver.phone && (
                            <span className="text-slate-500 text-[11px] font-mono">({receiver.phone})</span>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] leading-tight line-clamp-1 mt-0.5">
                          {receiverComposed}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Chips: Weight, COD, Shipping Fee */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Khối lượng</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{weight} kg</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Thu Hộ COD</span>
                      <span className="font-bold text-blue-700 font-mono text-[11px]">{formatVnd(cod)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Cước Phí</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{formatVnd(shippingFee)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {s.createdAt ? formatDate(s.createdAt) : ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* IN VẬN ĐƠN CHUẨN */}
                    <button
                      type="button"
                      onClick={() => printShippingLabel(s)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                      title="In phiếu gửi hàng chuẩn"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-600" />
                      <span>In đơn</span>
                    </button>

                    {/* CHI TIẾT */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForModal(s)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-600" />
                      <span>Chi tiết</span>
                    </button>

                    {/* HÀNH TRÌNH TRA CỨU */}
                    <RouterLink
                      to={`/?track=${encodeURIComponent(s.code)}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                    >
                      <span>Hành trình</span>
                      <ChevronRight className="h-3 w-3" />
                    </RouterLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. ORDER DETAIL MODAL */}
      {selectedOrderForModal && (
        <OrderDetailModal
          shipment={selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
          onTrack={(code) => {
            setSelectedOrderForModal(null);
            navigate(`/?track=${encodeURIComponent(code)}`);
          }}
          onPrint={(order) => printShippingLabel(order)}
        />
      )}
    </div>
  );
}

// ==========================================
// ORDER DETAIL MODAL
// ==========================================
function OrderDetailModal({
  shipment,
  onClose,
  onTrack,
  onPrint,
}: {
  shipment: ShipmentResponse;
  onClose: () => void;
  onTrack: (code: string) => void;
  onPrint: (shipment: ShipmentResponse) => void;
}) {
  const [copied, setCopied] = useState(false);
  const meta = shipment.metadata || {};
  const sender = meta.sender || {};
  const receiver = meta.receiver || {};
  const pkg = meta.package || {};
  const service = meta.service || {};
  const badge = getStatusBadgeDetails(shipment.currentStatus);

  const qrDataUrl = useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(`${window.location.origin}/?track=${encodeURIComponent(shipment.code)}`);
      qr.make();
      return qr.createDataURL(4, 8);
    } catch {
      return '';
    }
  }, [shipment.code]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shipment.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pickupType = meta.pickupType || service.pickupType || 'PICKUP';
  const isDropOff = pickupType === 'DROP_OFF';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              <span className="text-xs uppercase tracking-widest text-blue-300 font-black">
                Chi Tiết Vận Đơn Nexus
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-mono tracking-tight text-white">
                #{shipment.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 text-slate-300 hover:text-white rounded bg-white/10 transition"
                title="Sao chép mã vận đơn"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${badge.bg}`}>
              <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Quick Hub Routing & QR Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  {isDropOff ? 'Gửi hàng tại bưu cục' : 'Lấy hàng tận nơi'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Tạo lúc: {formatDate(shipment.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono font-black text-sm text-slate-800">
                <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                  {sender.hubCode || meta.senderHubCode || 'HUB-HCM-001'}
                </span>
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                  {receiver.hubCode || meta.receiverHubCode || 'HUB-HN-001'}
                </span>
              </div>
            </div>

            {qrDataUrl && (
              <div className="text-center shrink-0">
                <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 rounded-lg border border-slate-200 bg-white p-0.5" />
                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">Quét tra cứu</span>
              </div>
            )}
          </div>

          {/* Sender and Receiver Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-700 font-extrabold uppercase text-[11px]">
                <MapPin className="h-3.5 w-3.5" />
                Thông Tin Người Gửi
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm">{sender.name || 'Người gửi'}</p>
                <p className="text-slate-600 font-medium font-mono">{sender.phone || 'SĐT: N/A'}</p>
                <p className="text-slate-700 leading-relaxed">
                  {sender.address ||
                    [sender.addressDetail, sender.ward, sender.district, sender.province].filter(Boolean).join(', ') ||
                    'Chưa có địa chỉ chi tiết'}
                </p>
                {sender.hubCode && (
                  <p className="text-[11px] text-blue-600 font-semibold pt-1">
                    Bưu cục phụ trách: {sender.hubCode}
                  </p>
                )}
              </div>
            </div>

            {/* Receiver */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold uppercase text-[11px]">
                <MapPin className="h-3.5 w-3.5" />
                Thông Tin Người Nhận
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm">{receiver.name || 'Người nhận'}</p>
                <p className="text-slate-600 font-medium font-mono">{receiver.phone || 'SĐT: N/A'}</p>
                <p className="text-slate-700 leading-relaxed">
                  {receiver.address ||
                    [receiver.addressDetail, receiver.ward, receiver.district, receiver.province].filter(Boolean).join(', ') ||
                    'Chưa có địa chỉ chi tiết'}
                </p>
                {receiver.hubCode && (
                  <p className="text-[11px] text-emerald-600 font-semibold pt-1">
                    Bưu cục phát: {receiver.hubCode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Package & Billing Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-700">Chi Tiết Kiện Hàng & Cước Phí</span>
              <span className="font-mono text-slate-500 font-bold">
                {pkg.itemName || 'Hàng hóa thông thường'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Khối lượng</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {pkg.weightKg || meta.weightKg || 1} kg
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Dịch vụ</span>
                <span className="font-bold text-slate-800 text-xs uppercase">
                  {service.type || 'STANDARD'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Thu hộ COD</span>
                <span className="font-mono font-black text-blue-700 text-xs">
                  {formatVnd(Number(meta.codAmount || pkg.codAmount || 0))}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cước vận chuyển</span>
                <span className="font-mono font-black text-slate-800 text-xs">
                  {formatVnd(Number(meta.shippingFee || meta.estimatedFee || 22000))}
                </span>
              </div>
            </div>

            {(meta.deliveryNote || meta.notes) && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Ghi chú giao hàng:</strong> {meta.deliveryNote || meta.notes}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPrint(shipment)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs transition shadow-sm"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>In Phiếu Gửi Hàng</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => onTrack(shipment.code)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-600/20"
            >
              <span>Xem Lộ Trình GPS</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
