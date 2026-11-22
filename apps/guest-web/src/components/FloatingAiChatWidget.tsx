import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  ArrowUp,
  X,
  RotateCcw,
  ChevronDown,
  User,
  MapPin,
  ArrowRight,
  Copy,
  Check,
  Package,
  Bot,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ZaloIcon } from './ZaloIcon';
import {
  getWardsForProvinceName,
  resolveHubForAddress,
  parseWardAndDistrict,
} from '../utils/vietnamAdministrativeData';

export interface ShipmentCard {
  code: string;
  status?: string;
  statusText?: string;
  itemName?: string;
  receiverCity?: string;
  receiverName?: string;
  codAmount?: number;
  createdAt?: string;
}

export interface ActionChip {
  label: string;
  query: string;
  icon?: string;
}

export interface OrderFormData {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderWard?: string;
  senderDistrict?: string;
  senderHubCode?: string;
  senderHubName?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverWard?: string;
  receiverDistrict?: string;
  receiverHubCode?: string;
  receiverHubName?: string;
  itemName: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  codAmount: number;
  payer: 'SENDER' | 'RECEIVER';
  notes?: string;
}

export const VIETNAM_63_PROVINCES: string[] = [
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cần Thơ',
  'Cao Bằng',
  'Đà Nẵng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Nội',
  'Hà Tĩnh',
  'Hải Dương',
  'Hải Phòng',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'TP. Hồ Chí Minh',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  toolsUsed?: string[];
  citations?: { file: string; title: string; score: number }[];
  shipmentCards?: ShipmentCard[];
  actionChips?: ActionChip[];
  orderFormRequested?: boolean;
  orderConfirmation?: any;
}

const QUICK_SUGGESTIONS = [
  { label: 'Tạo đơn ngay', query: 'Tôi muốn tạo đơn hàng' },
  { label: 'Dự toán cước', query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội' },
  { label: 'Tra cứu vận đơn', query: 'Tra cứu hành trình đơn hàng gần nhất của tôi' },
  { label: 'Bồi thường bể vỡ', query: 'Chính sách bồi thường hàng dễ vỡ khi bể vỡ' },
  { label: 'Quy định hoàn hàng', query: 'Quy định thu cước chuyển hoàn khi người nhận từ chối nhận hàng' },
];

const FormattedChatMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Pre-process: sanitize LaTeX math formulas to plain text, remove raw backticks, excessive asterisks, and generic emojis
  const cleanText = text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / $2')
    .replace(/\\(?:text|mathrm|mathbf|textit)\{([^}]*)\}/g, '$1')
    .replace(/\\times\b/g, 'x')
    .replace(/\\cdot\b/g, 'x')
    .replace(/\\div\b/g, '/')
    .replace(/\\le\b/g, '<=')
    .replace(/\\ge\b/g, '>=')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\$([^\$\n]+)\$/g, '$1')
    .replace(/\/\s*6\.000\b/g, '/ 6000')
    .replace(/\((\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\)\s*\/\s*6000/g, '($1x$2x$3)/6000')
    .replace(/(?:^|[^\w(])(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*\/\s*6000/g, ' ($1x$2x$3)/6000')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`/g, '')
    .replace(/\*{3,}/g, '**')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F680}-\u{1F6FF}\u{1F600}-\u{1F64F}\u{1FA00}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '')
    .replace(/[📦📍🏷️👤💰🏢⏰🚚📋💡✅❌⚠️👋🚨💬💳🎁✈️⚖️📐🔄✏️🔑📱🔍🎉👉📌ℹ️📖]/g, '')
    .replace(/(^|\n)\s*([•\-\*])\s*\n+(\s*)/g, '$1• ');

  const rawLines = cleanText.split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if (line.trim() === '' && lines.length > 0 && lines[lines.length - 1].trim() === '') {
      continue;
    }
    lines.push(line);
  }

  const renderInlineFormatted = (content: string) => {
    // Matches markdown links: [text](url) and bold: **text**
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|\*\*([^*]+)\*\*/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        elements.push(content.slice(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // [link text](url) -> Clickable Link (supports both internal /login and external https)
        const isInternal = match[2].startsWith('/');
        elements.push(
          <a
            key={`link-${match.index}`}
            href={match[2]}
            {...(!isInternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-blue-600 hover:text-blue-800 underline font-semibold inline-block break-all"
          >
            {match[1]}
          </a>
        );
      } else if (match[3]) {
        // **bold text**
        elements.push(
          <strong key={`bold-${match.index}`} className="font-semibold text-zinc-950">
            {match[3]}
          </strong>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      elements.push(content.slice(lastIndex));
    }

    return elements.length > 0 ? elements : content;
  };

  return (
    <div className="space-y-1.5 text-zinc-800 leading-relaxed font-sans text-[13px]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet list item
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const itemContent = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
              <div className="flex-1">{renderInlineFormatted(itemContent)}</div>
            </div>
          );
        }

        // Section header
        const isHeader = trimmed.length < 60 && (trimmed.endsWith(':') || trimmed.startsWith('#'));
        if (isHeader) {
          return (
            <div key={idx} className="font-semibold text-zinc-950 pt-1 text-[13px]">
              {renderInlineFormatted(trimmed.replace(/^#+\s*/, ''))}
            </div>
          );
        }

        return <p key={idx}>{renderInlineFormatted(trimmed)}</p>;
      })}
    </div>
  );
};

const InteractiveShipmentCards: React.FC<{
  cards: ShipmentCard[];
  onSelect: (code: string) => void;
}> = ({ cards, onSelect }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-0.5">
        <span>Vận đơn liên quan ({cards.length})</span>
        <span className="text-[10px] text-blue-600 font-normal lowercase">nhấp để tra cứu</span>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card, idx) => (
          <div
            key={card.code || idx}
            onClick={() => onSelect(card.code)}
            className="group border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 hover:border-blue-400 p-3 rounded-xl transition-all cursor-pointer text-left shadow-xs hover:shadow-md hover:shadow-blue-500/5"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-blue-700 text-xs tracking-tight">
                  #{card.code}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, card.code)}
                  title="Sao chép mã"
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                  {copiedCode === card.code ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold border border-blue-100 bg-blue-50/80 text-blue-700 rounded-full shrink-0">
                {card.statusText || card.status || 'Đang xử lý'}
              </span>
            </div>

            <div className="text-xs text-slate-700 font-medium truncate mb-1.5">
              {card.itemName || 'Bưu gửi bưu chính'}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
              <div className="truncate flex items-center gap-1 max-w-[65%]">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{card.receiverCity || card.receiverName || 'Điểm giao'}</span>
              </div>
              {card.codAmount !== undefined && (
                <div className="text-right shrink-0 font-semibold text-slate-800">
                  COD: {card.codAmount.toLocaleString('vi-VN')} đ
                </div>
              )}
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold group-hover:text-blue-700">
              <span>Xem tiến trình vận chuyển</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OrderCreationForm: React.FC<{
  defaultSenderName?: string;
  defaultSenderPhone?: string;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  disabled?: boolean;
}> = ({ defaultSenderName = '', defaultSenderPhone = '', onSubmit, onCancel, disabled = false }) => {
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [senderPhone, setSenderPhone] = useState(defaultSenderPhone);
  const [senderCity, setSenderCity] = useState('TP. Hồ Chí Minh');
  const [senderWard, setSenderWard] = useState('Phường 10 (Quận Gò Vấp)');
  const [senderAddress, setSenderAddress] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverCity, setReceiverCity] = useState('Hà Nội');
  const [receiverWard, setReceiverWard] = useState('Phường Tràng Tiền (Quận Hoàn Kiếm)');
  const [receiverAddress, setReceiverAddress] = useState('');

  const [itemName, setItemName] = useState('');
  const [weightKg, setWeightKg] = useState('1');
  const [lengthCm, setLengthCm] = useState('10');
  const [widthCm, setWidthCm] = useState('10');
  const [heightCm, setHeightCm] = useState('10');
  const [codAmount, setCodAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [payer, setPayer] = useState<'SENDER' | 'RECEIVER'>('RECEIVER');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Tính toán thể tích IATA và trần vận hành Carrier
  const numWeight = Math.max(0.1, parseFloat(weightKg) || 1);
  const numL = Math.max(1, parseInt(lengthCm, 10) || 10);
  const numW = Math.max(1, parseInt(widthCm, 10) || 10);
  const numH = Math.max(1, parseInt(heightCm, 10) || 10);
  const volW = Number(((numL * numW * numH) / 6000).toFixed(2));
  const chargeableW = Math.max(numWeight, volW);
  const isVolApplied = volW > numWeight;
  const maxEdge = Math.max(numL, numW, numH);
  const sumDims = numL + numW + numH;
  const isBulky = numWeight > 20 || maxEdge > 60;
  const isOverLimit = numWeight > 70 || maxEdge > 150 || sumDims > 300;

  // Danh sách Phường/Xã người gửi tương ứng Tỉnh/Thành đã chọn (Chọn tỉnh trước, hiện phường/xã sau)
  const senderWardList = React.useMemo(() => {
    return getWardsForProvinceName(senderCity);
  }, [senderCity]);

  // Danh sách Phường/Xã người nhận tương ứng Tỉnh/Thành đã chọn
  const receiverWardList = React.useMemo(() => {
    return getWardsForProvinceName(receiverCity);
  }, [receiverCity]);

  // Tự động chuyển phường/xã khi đổi Tỉnh/Thành người gửi
  useEffect(() => {
    if (senderWardList.length > 0) {
      const match = senderWardList.find((w) => (w.displayName || w.name) === senderWard);
      if (!match) {
        setSenderWard(senderWardList[0].displayName || senderWardList[0].name);
      }
    }
  }, [senderCity, senderWardList]);

  // Tự động chuyển phường/xã khi đổi Tỉnh/Thành người nhận
  useEffect(() => {
    if (receiverWardList.length > 0) {
      const match = receiverWardList.find((w) => (w.displayName || w.name) === receiverWard);
      if (!match) {
        setReceiverWard(receiverWardList[0].displayName || receiverWardList[0].name);
      }
    }
  }, [receiverCity, receiverWardList]);

  // Phân giải bưu cục điều phối lấy hàng (Origin Hub) & bưu cục phát tuyến (Destination Hub)
  const senderParsed = parseWardAndDistrict(senderWard);
  const cleanSenderWard = senderParsed.ward || senderWard;
  const senderDistrict = senderParsed.district || '';
  const senderHub = resolveHubForAddress(senderCity, cleanSenderWard, senderDistrict);

  const receiverParsed = parseWardAndDistrict(receiverWard);
  const cleanReceiverWard = receiverParsed.ward || receiverWard;
  const receiverDistrict = receiverParsed.district || '';
  const receiverHub = resolveHubForAddress(receiverCity, cleanReceiverWard, receiverDistrict);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderPhone.trim() || !senderAddress.trim()) {
      setErrorMsg('Vui lòng điền đủ thông tin người gửi (Họ tên, SĐT, Số nhà/tên đường).');
      return;
    }
    if (!senderCity || !senderWard) {
      setErrorMsg('Vui lòng chọn Tỉnh/Thành và Phường/Xã lấy hàng.');
      return;
    }
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      setErrorMsg('Vui lòng điền đủ thông tin người nhận (Họ tên, SĐT, Số nhà/tên đường).');
      return;
    }
    if (!receiverCity || !receiverWard) {
      setErrorMsg('Vui lòng chọn Tỉnh/Thành và Phường/Xã nhận hàng.');
      return;
    }
    if (!itemName.trim()) {
      setErrorMsg('Vui lòng nhập tên bưu phẩm / hàng hóa.');
      return;
    }
    if (isOverLimit) {
      setErrorMsg('Vượt trần mạng lưới bưu cục (Tối đa 70kg, 1 cạnh ≤ 150cm, tổng 3 cạnh ≤ 300cm). Vui lòng tách kiện hoặc đổi dịch vụ vận tải.');
      return;
    }
    setErrorMsg('');
    setSubmitted(true);

    onSubmit({
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderAddress: senderAddress.trim(),
      senderCity,
      senderWard: cleanSenderWard,
      senderDistrict,
      senderHubCode: senderHub.hubCode,
      senderHubName: senderHub.hubName,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAddress: receiverAddress.trim(),
      receiverCity,
      receiverWard: cleanReceiverWard,
      receiverDistrict,
      receiverHubCode: receiverHub.hubCode,
      receiverHubName: receiverHub.hubName,
      itemName: itemName.trim(),
      weightKg: numWeight,
      lengthCm: numL,
      widthCm: numW,
      heightCm: numH,
      codAmount: Math.max(0, parseInt(codAmount.replace(/\D/g, ''), 10) || 0),
      payer,
      notes: notes.trim(),
    });
  };

  if (submitted || disabled) {
    return (
      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
        <span className="font-medium">Đã gửi thông tin đơn hàng - Đang chờ xác nhận</span>
        <Check className="h-4 w-4 text-emerald-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs space-y-3 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-800">
        <div>
          <span className="text-[13px] font-bold text-slate-900 block">Biểu mẫu tạo đơn hàng</span>
          <span className="text-[10px] text-blue-600 font-normal">Lấy hàng tận nơi • Gán bưu cục điều phối tự động</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
          63 Tỉnh Thành
        </span>
      </div>

      {/* Thông tin người gửi & Địa chỉ lấy hàng */}
      <div className="space-y-1.5">
        <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide flex items-center justify-between">
          <span>1. Người gửi & Địa chỉ lấy hàng</span>
          <span className="text-[10px] text-blue-600 font-medium lowercase">bưu tá lấy tận nhà</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="text"
            placeholder="Họ tên người gửi *"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
          />
          <input
            type="tel"
            placeholder="SĐT người gửi *"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
          />
        </div>
        {/* Phân cấp Tỉnh/Thành -> Phường/Xã -> Số nhà/Tên đường */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Tỉnh / Thành phố lấy hàng *</label>
            <select
              value={senderCity}
              onChange={(e) => setSenderCity(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[11px] font-medium text-slate-700"
            >
              {VIETNAM_63_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Phường / Xã lấy hàng *</label>
            <select
              value={senderWard}
              onChange={(e) => setSenderWard(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[11px] font-medium text-slate-700"
            >
              {senderWardList.map((w, idx) => (
                <option key={idx} value={w.displayName || w.name}>
                  {w.displayName || w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input
          type="text"
          placeholder="Số nhà, tên đường (Địa chỉ nhà lấy hàng) *"
          value={senderAddress}
          onChange={(e) => setSenderAddress(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
        />
        {/* Hub điều phối badge */}
        <div className="px-2 py-1 bg-blue-50/70 border border-blue-200/60 rounded-md text-[10px] text-blue-800 flex items-center justify-between">
          <span className="truncate">
            <span className="font-semibold">Bưu cục điều phối lấy hàng:</span> [{senderHub.hubCode}] {senderHub.hubName}
          </span>
          <span className="shrink-0 ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Thông tin người nhận & Địa chỉ giao hàng */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide flex items-center justify-between">
          <span>2. Người nhận & Địa chỉ giao hàng</span>
          <span className="text-[10px] text-emerald-600 font-medium lowercase">giao tận tay</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="text"
            placeholder="Họ tên người nhận *"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
          />
          <input
            type="tel"
            placeholder="SĐT người nhận *"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
          />
        </div>
        {/* Phân cấp Tỉnh/Thành -> Phường/Xã -> Số nhà/Tên đường */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Tỉnh / Thành phố giao đến *</label>
            <select
              value={receiverCity}
              onChange={(e) => setReceiverCity(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[11px] font-medium text-slate-700"
            >
              {VIETNAM_63_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Phường / Xã giao đến *</label>
            <select
              value={receiverWard}
              onChange={(e) => setReceiverWard(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[11px] font-medium text-slate-700"
            >
              {receiverWardList.map((w, idx) => (
                <option key={idx} value={w.displayName || w.name}>
                  {w.displayName || w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input
          type="text"
          placeholder="Số nhà, tên đường (Địa chỉ nhà giao hàng) *"
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
        />
        {/* Hub phát tuyến badge */}
        <div className="px-2 py-1 bg-indigo-50/70 border border-indigo-200/60 rounded-md text-[10px] text-indigo-800 flex items-center justify-between">
          <span className="truncate">
            <span className="font-semibold">Bưu cục phát tuyến:</span> [{receiverHub.hubCode}] {receiverHub.hubName}
          </span>
          <span className="shrink-0 ml-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>
      </div>

      {/* Thông tin hàng hóa */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">3. Hàng hóa & Cước phí</div>
        <input
          type="text"
          placeholder="Tên hàng hóa (ví dụ: Quần áo, tài liệu, đồ gia dụng...) *"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Khối lượng (kg) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Tiền thu hộ COD (VNĐ)</label>
            <input
              type="number"
              step="1000"
              min="0"
              value={codAmount}
              onChange={(e) => setCodAmount(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Kích thước Dài x Rộng x Cao (cm) & Quy đổi thể tích IATA */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] text-slate-500">Kích thước (Dài x Rộng x Cao cm) *</label>
            <span className="text-[9px] text-slate-400 font-mono">IATA: D x R x C / 6000</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="number"
              min="1"
              max="150"
              placeholder="Dài (cm)"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs text-center font-mono"
            />
            <input
              type="number"
              min="1"
              max="150"
              placeholder="Rộng (cm)"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs text-center font-mono"
            />
            <input
              type="number"
              min="1"
              max="150"
              placeholder="Cao (cm)"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs text-center font-mono"
            />
          </div>
          {/* Volumetric Weight & Bulky / Ceiling status */}
          <div className="mt-1 flex items-center justify-between px-2 py-1 bg-slate-100/90 border border-slate-200 rounded-md text-[10px]">
            <span className="text-slate-600">
              Quy đổi IATA: <strong className="text-slate-800">{volW} kg</strong>
              {isVolApplied && <span className="text-blue-700 ml-1 font-semibold">(Áp dụng cước)</span>}
            </span>
            <span className="font-semibold text-blue-700">
              Tính cước: {chargeableW} kg
            </span>
          </div>
          {isBulky && !isOverLimit && (
            <div className="mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 font-medium flex items-center gap-1">
              <span>Hàng cồng kềnh - Tự động điều phối xe tải</span>
            </div>
          )}
          {isOverLimit && (
            <div className="mt-1 px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-700 font-semibold flex items-center gap-1">
              <span>Vượt trần mạng lưới bưu cục (&gt;70kg hoặc cạnh &gt;150cm)</span>
            </div>
          )}
        </div>

        {/* Ghi chú giao hàng */}
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">Ghi chú giao hàng</label>
          <input
            type="text"
            placeholder="Ví dụ: Cho xem hàng, gọi trước khi giao..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
          />
        </div>

        <div className="pt-1">
          <label className="text-[10px] text-slate-500 block mb-1">Người trả cước vận chuyển:</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setPayer('RECEIVER')}
              className={`py-1 px-2 rounded-lg border text-center transition ${
                payer === 'RECEIVER'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Người nhận trả
            </button>
            <button
              type="button"
              onClick={() => setPayer('SENDER')}
              className={`py-1 px-2 rounded-lg border text-center transition ${
                payer === 'SENDER'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Người gửi trả
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="text-rose-600 text-[11px] font-medium pt-1">
          {errorMsg}
        </div>
      )}

      {/* Nút hành động */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
        <button
          type="submit"
          className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer text-center"
        >
          Xác nhận gửi thông tin
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium transition cursor-pointer"
        >
          Hủy
        </button>
      </div>
    </form>
  );
};

export const FloatingAiChatWidget: React.FC = () => {
  const { phone, user } = useAuthStore();
  const currentUserId = user?.id || phone || null;
  const userDisplayName = user?.displayName || phone || null;

  const [isOpen, setIsOpen] = useState(false);
  const [showCallout, setShowCallout] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getStorageKey = (uid: string | null) => `nexus_guest_ai_chat_${uid || 'anonymous'}`;
  const getConvKey = (uid: string | null) => `nexus_guest_ai_conv_${uid || 'anonymous'}`;

  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(getConvKey(currentUserId));
    } catch {}
    return null;
  });

  const getWelcomeMessage = (uid: string | null, name: string | null): ChatMessage => ({
    id: 'welcome_' + (uid || 'guest'),
    sender: 'bot',
    text: uid
      ? `Xin chào ${name || ''}. Tôi là Trợ lý AI của Nexus Logistics. Tôi có thể hỗ trợ tạo đơn gửi hàng, dự toán cước hoặc tra cứu dịch vụ. Quý khách cần hỗ trợ thông tin gì ạ?`
      : 'Xin chào quý khách. Tôi là Trợ lý AI của Nexus Logistics. Tôi có thể hỗ trợ tạo đơn gửi hàng, tính giá cước hoặc giải đáp dịch vụ bưu chính. Quý khách cần hỗ trợ thông tin gì ạ?',
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const key = getStorageKey(currentUserId);
      const saved = sessionStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [getWelcomeMessage(currentUserId, userDisplayName)];
  });

  useEffect(() => {
    try {
      const key = getStorageKey(currentUserId);
      const saved = sessionStorage.getItem(key);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([getWelcomeMessage(currentUserId, userDisplayName)]);
      }
    } catch {
      setMessages([getWelcomeMessage(currentUserId, userDisplayName)]);
    }

    try {
      const convKey = getConvKey(currentUserId);
      const savedConv = sessionStorage.getItem(convKey);
      setConversationId(savedConv || null);
    } catch {
      setConversationId(null);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(getStorageKey(currentUserId), JSON.stringify(messages));
      } catch {}
    }
  }, [messages, currentUserId]);

  const handleClearChat = () => {
    const fresh = [getWelcomeMessage(currentUserId, userDisplayName)];
    setMessages(fresh);
    setConversationId(null);
    try {
      sessionStorage.removeItem(getStorageKey(currentUserId));
      sessionStorage.removeItem(getConvKey(currentUserId));
    } catch {}
  };

  const getLastTrackedShipmentCode = (): string | undefined => {
    // 1. Kiểm tra trên URL trình duyệt (?track=... hoặc ?code=... hoặc /track/:code)
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const urlCode = searchParams.get('track') || searchParams.get('code');
        if (urlCode && /^(101\d{9}|111\d{9}|333\d{9}|222\d{9}|\d{10,15}|NX[-_]?[A-Z0-9]{4,16})$/i.test(urlCode.trim())) {
          return urlCode.trim().toUpperCase();
        }
        const pathMatch = window.location.pathname.match(/\/track\/([A-Za-z0-9_-]+)/);
        if (pathMatch && pathMatch[1]) {
          return pathMatch[1].trim().toUpperCase();
        }
      }
    } catch {}

    // 2. Kiểm tra sessionStorage lưu đơn gần nhất
    try {
      const savedCode = sessionStorage.getItem('nexus_last_tracked_code');
      if (savedCode && /^(101\d{9}|111\d{9}|333\d{9}|222\d{9}|\d{10,15}|NX[-_]?[A-Z0-9]{4,16})$/i.test(savedCode.trim())) {
        return savedCode.trim().toUpperCase();
      }
    } catch {}

    // 3. Quét lịch sử tin nhắn trong widget từ mới nhất về cũ nhất
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.shipmentCards && msg.shipmentCards.length > 0) {
        return msg.shipmentCards[0].code;
      }
      const formalMatch = msg.text.match(/\b(101\d{9}|111\d{9}|333\d{9}|222\d{9}|NX[-_]?[A-Z0-9]{4,16}|SPX[A-Z0-9]+|VN\d+[A-Z0-9]*|DH\d+)\b/i);
      if (formalMatch) return formalMatch[0].toUpperCase();

      // Chỉ match chuỗi số 10-15 chữ số nếu KHÔNG PHẢI là số điện thoại người nhận (tránh nhận nhầm SĐT thành mã đơn)
      const numMatch = msg.text.match(/\b\d{10,15}\b/);
      if (numMatch && !/^0[35789]\d{8}$/.test(numMatch[0])) {
        return numMatch[0];
      }
    }
    return undefined;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gatewayUrl = import.meta.env.VITE_GATEWAY_BFF_URL || 'http://localhost:3000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (
    textToSend?: string,
    options?: {
      action?: 'OPEN_ORDER_FORM' | 'SUBMIT_ORDER_FORM' | 'CONFIRM_ORDER' | 'CANCEL_ORDER';
      orderData?: OrderFormData;
    }
  ) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = 'usr_' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const lastShipmentCode = getLastTrackedShipmentCode();
      const requestPayload = {
        conversationId: conversationId || undefined,
        selectedShipmentCode: lastShipmentCode,
        message: query,
        action: options?.action,
        orderData: options?.orderData,
        userId: currentUserId || undefined,
        userPhone: user?.phone || phone || undefined,
        userName: userDisplayName || undefined,
        senderRole: currentUserId ? 'CUSTOMER' : 'GUEST',
      };

      const candidateUrls: string[] = ['/api/v1/ai-assistant/message'];
      if (gatewayUrl && !candidateUrls.includes(`${gatewayUrl}/api/v1/ai-assistant/message`)) {
        candidateUrls.push(`${gatewayUrl}/api/v1/ai-assistant/message`);
      }
      candidateUrls.push(
        'http://127.0.0.1:3000/api/v1/ai-assistant/message',
        'http://localhost:3000/api/v1/ai-assistant/message',
        'http://127.0.0.1:3013/api/v1/chat/message',
        'http://localhost:3013/api/v1/chat/message',
      );

      let responseData: any = null;
      let lastErr: any = null;

      for (const url of candidateUrls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
            signal: AbortSignal.timeout(30000),
          });
          if (res.ok) {
            responseData = await res.json();
            break;
          }
          lastErr = new Error(`HTTP ${res.status} from ${url}`);
        } catch (fetchErr) {
          lastErr = fetchErr;
        }
      }

      if (!responseData) {
        throw lastErr || new Error('Không thể kết nối đến máy chủ hỗ trợ');
      }

      if (responseData.conversationId) {
        setConversationId(responseData.conversationId);
        try {
          sessionStorage.setItem(getConvKey(currentUserId), responseData.conversationId);
        } catch {}
      }

      if (responseData.shipmentCards && responseData.shipmentCards.length > 0) {
        try {
          sessionStorage.setItem('nexus_last_tracked_code', responseData.shipmentCards[0].code);
        } catch {}
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: responseData.answer || 'Hệ thống đã ghi nhận yêu cầu của bạn.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: responseData.toolsUsed,
        citations: responseData.citations,
        shipmentCards: responseData.shipmentCards,
        actionChips: responseData.actionChips,
        orderFormRequested: responseData.orderFormRequested,
        orderConfirmation: responseData.orderConfirmation,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const isZaloQuery = /zalo|tác giả|xin việc|tuyển dụng|liên hệ|developer|contact|cv/i.test(query);
      const isClaimQuery = /CLM|khiếu nại|bồi thường|đền bù/i.test(query);
      const isDamageQuery = /hỏng|hư|bể|vỡ|móp|thiệt hại/i.test(query);
      const isReturnQuery = /hoàn|bom|phí hoàn/i.test(query);
      const isOrderQuery = /đơn|hàng|tra cứu|mã|gửi|vận đơn|cod|bưu/i.test(query);

      let fallbackText = '';

      if (isZaloQuery) {
        fallbackText =
          `Quý khách có thể nhắn tin trực tiếp với chuyên viên hỗ trợ qua Zalo [tại đây](https://zalo.me/0869500573) để được xử lý nhanh nhất.`;
      } else if (isDamageQuery) {
        fallbackText =
          `Với hàng hóa có dấu hiệu hư hỏng hoặc bể vỡ, quý khách lưu ý đồng kiểm cùng bưu tá và yêu cầu lập biên bản bất thường ngay lúc nhận.\n\n` +
          `- Gói Tiêu chuẩn: Bồi thường tối đa 4 lần cước vận chuyển (không quá 1.000.000 đ/đơn).\n` +
          `- Gói Bảo hiểm khai giá: Đền bù 100% giá trị tổn thất theo hóa đơn chứng từ.\n\n` +
          `Thời gian thẩm định hồ sơ trong vòng 24 đến 48 giờ làm việc.`;
      } else if (isClaimQuery) {
        fallbackText =
          `Hồ sơ khiếu nại bồi thường được thẩm định trong vòng 24 đến 48 giờ làm việc. Nếu cần xử lý khẩn, quý khách vui lòng liên hệ hotline 1900 1234.`;
      } else if (isReturnQuery) {
        fallbackText =
          `Về quy định chuyển hoàn bưu gửi: cước hoàn tiêu chuẩn là 50% cước chiều đi; khách hàng doanh nghiệp theo hợp đồng được miễn phí hoàn 100%.`;
      } else if (isOrderQuery) {
        fallbackText =
          `Hệ thống đang xử lý nhiều lượt tra cứu cùng lúc. Quý khách vui lòng thử lại sau giây lát hoặc gửi lại mã vận đơn.`;
      } else {
        fallbackText =
          `Hệ thống chưa có thông tin chi tiết cho câu hỏi này. Quý khách vui lòng liên hệ tổng đài 1900 1234 để được hỗ trợ giải đáp trực tiếp.`;
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: fallbackText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. Floating Action Dock (Modern Nexus Brand & Glowing Tech Aesthetics) */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2.5 pointer-events-auto select-none">
        {/* Zalo Direct Button */}
        <a
          href="https://zalo.me/0869500573"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center w-11 h-11 rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-md hover:shadow-xl hover:border-blue-400 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
          title="Hỗ trợ Zalo CSKH 24/7"
          aria-label="Hỗ trợ Zalo"
        >
          <ZaloIcon className="h-6 w-6 rounded-full overflow-hidden" shape="circle" />
          <span className="pointer-events-none absolute right-full mr-2.5 whitespace-nowrap bg-slate-900 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 hidden sm:block">
            CSKH Zalo 24/7
          </span>
        </a>

        {/* Chat Launcher with Modern Callout Pill */}
        <div className="flex items-center gap-2 relative">
          {!isOpen && showCallout && (
            <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-800 shadow-[0_8px_24px_-4px_rgba(37,99,235,0.18)] border border-blue-100 pl-3 pr-2 py-1.5 rounded-full transition-all duration-200">
              <span
                className="text-xs font-semibold cursor-pointer text-slate-800 hover:text-blue-600 flex items-center gap-1.5"
                onClick={() => setIsOpen(true)}
              >
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1 uppercase tracking-wider">
                  <Bot className="h-3 w-3" />
                  AI BOT
                </span>
                Hỗ trợ tra cứu vận đơn 24/7
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCallout(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 transition"
                title="Đóng"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Launcher Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_25px_-3px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_32px_-2px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/30 ${
              isOpen
                ? 'bg-slate-900 text-white'
                : 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white'
            }`}
            title={isOpen ? 'Thu nhỏ chat' : 'Mở trợ lý trực tuyến Robot AI'}
            aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <>
                <Bot className="h-7 w-7 text-white" strokeWidth={2.2} />
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 ring-2 ring-white" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Modern Tech AI Assistant Window */}
      {isOpen && (
        <div className="fixed bottom-[96px] right-4 sm:right-6 z-[9999] w-[calc(100vw-32px)] sm:w-[410px] h-[610px] max-h-[calc(100vh-116px)] bg-slate-50/98 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.22),0_0_0_1px_rgba(226,232,240,0.8)] flex flex-col overflow-hidden font-sans animate-chat-in">
          {/* Header with Signature Nexus Blue Gradient */}
          <header className="px-4 py-3.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-sm relative overflow-hidden shrink-0">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                <Bot className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="text-[13px] font-bold text-white tracking-tight">Nexus AI Robot</h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                </div>
                <p className="text-[10.5px] text-blue-100 mt-1 leading-none font-normal">
                  Trợ lý robot bưu chính trực tuyến 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <a
                href="https://zalo.me/0869500573"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg transition mr-0.5"
                title="Mở Zalo CSKH"
              >
                Zalo
              </a>
              <button
                type="button"
                onClick={handleClearChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 transition rounded-lg"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/15 transition rounded-lg"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Quick Suggestions (Modern Pills) */}
          <div
            className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 shadow-2xs"
            style={{ scrollbarWidth: 'none' }}
          >
            {QUICK_SUGGESTIONS.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSendMessage(item.query)}
                disabled={isLoading}
                className="shrink-0 px-3 py-1 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-[11.5px] text-slate-700 hover:text-blue-700 font-medium transition cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Messages Stream - Card-Based Flow (No pointy classic speech bubbles) */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 bg-slate-50/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] mt-0.5 shadow-sm shadow-blue-500/25">
                    <Bot className="h-4 w-4 text-white" strokeWidth={2.2} />
                  </div>
                )}

                <div
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end max-w-[85%]' : 'items-start max-w-[88%]'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    /* User Inquiry: Sleek Brand Gradient Capsule */
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-[13px] leading-relaxed shadow-md shadow-blue-500/20 font-medium">
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ) : (
                    /* Assistant Answer: Clean Structured Tech Card */
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-[13px] leading-relaxed text-slate-800 shadow-[0_3px_14px_-3px_rgba(0,0,0,0.05)] w-full">
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-100/90 shadow-2xs">
                          <Bot className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.2} />
                          Trợ lý Robot Nexus AI
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">{msg.time}</span>
                      </div>

                      <FormattedChatMessage text={msg.text} isUser={false} />

                      {/* Interactive Order Creation Form */}
                      {msg.orderFormRequested && (
                        <OrderCreationForm
                          defaultSenderName={userDisplayName || ''}
                          defaultSenderPhone={phone || ''}
                          onSubmit={(formData) => {
                            handleSendMessage(
                              `Tạo đơn hàng từ ${formData.senderCity} đi ${formData.receiverCity}: ${formData.itemName}`,
                              {
                                action: 'SUBMIT_ORDER_FORM',
                                orderData: formData,
                              }
                            );
                          }}
                          onCancel={() => {
                            handleSendMessage('Hủy tạo đơn', { action: 'CANCEL_ORDER' });
                          }}
                        />
                      )}

                      {/* Order Confirmation Card */}
                      {msg.orderConfirmation && (
                        <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200/90 rounded-2xl space-y-2 text-xs shadow-xs">
                          <div className="font-semibold text-blue-900 flex items-center justify-between pb-1.5 border-b border-blue-200/60">
                            <span className="flex items-center gap-1.5">
                              <Package className="h-4 w-4 text-blue-600" />
                              Đơn hàng chờ xác nhận
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Chưa tạo đơn</span>
                          </div>
                          <div className="text-slate-600 space-y-1.5">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Người gửi:</span>
                              <span className="font-medium text-slate-800">{msg.orderConfirmation.senderName} ({msg.orderConfirmation.senderPhone})</span>
                              <div className="text-[11px] text-slate-700">
                                {msg.orderConfirmation.senderAddress}
                                {msg.orderConfirmation.senderWard ? `, ${msg.orderConfirmation.senderWard}` : ''}
                                {msg.orderConfirmation.senderCity ? `, ${msg.orderConfirmation.senderCity}` : ''}
                              </div>
                              <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                                Điều phối bưu tá: [{msg.orderConfirmation.senderHubCode || '07904W001'}] {msg.orderConfirmation.senderHubName || 'Bưu cục Phường An Nhơn'}
                              </div>
                            </div>
                            <div className="pt-1.5 border-t border-blue-100">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Người nhận:</span>
                              <span className="font-medium text-slate-800">{msg.orderConfirmation.receiverName} ({msg.orderConfirmation.receiverPhone})</span>
                              <div className="text-[11px] text-slate-700">
                                {msg.orderConfirmation.receiverAddress}
                                {msg.orderConfirmation.receiverWard ? `, ${msg.orderConfirmation.receiverWard}` : ''}
                                {msg.orderConfirmation.receiverCity ? `, ${msg.orderConfirmation.receiverCity}` : ''}
                              </div>
                              <div className="text-[10px] text-indigo-700 font-medium mt-0.5">
                                Bưu cục phát tuyến: [{msg.orderConfirmation.receiverHubCode || 'HUB-HN-001'}] {msg.orderConfirmation.receiverHubName || 'Bưu cục Khai thác'}
                              </div>
                            </div>
                            <div className="pt-1.5 border-t border-blue-100">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Hàng hóa:</span>
                              <div className="font-medium text-slate-800">
                                {msg.orderConfirmation.itemName} ({msg.orderConfirmation.weightKg} kg • {msg.orderConfirmation.lengthCm || 10}x{msg.orderConfirmation.widthCm || 10}x{msg.orderConfirmation.heightCm || 10} cm)
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Quy đổi thể tích IATA: {Number((((msg.orderConfirmation.lengthCm || 10) * (msg.orderConfirmation.widthCm || 10) * (msg.orderConfirmation.heightCm || 10)) / 6000).toFixed(2))} kg
                              </div>
                              <div className="flex justify-between pt-1 font-semibold text-slate-800">
                                <span>Thu hộ COD: {Number(msg.orderConfirmation.codAmount || 0).toLocaleString('vi-VN')} đ</span>
                                <span className="text-blue-700">Cước tạm tính: {Number(msg.orderConfirmation.shippingFee || 21500).toLocaleString('vi-VN')} đ</span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendMessage('Xác nhận tạo đơn', { action: 'CONFIRM_ORDER' })}
                              className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg font-semibold text-center shadow-xs transition cursor-pointer"
                            >
                              Xác nhận tạo đơn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendMessage('Hủy tạo đơn', { action: 'CANCEL_ORDER' })}
                              className="py-1.5 px-3 border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 rounded-lg font-medium text-center transition cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Interactive Shipment Cards */}
                      {msg.shipmentCards && msg.shipmentCards.length > 0 && (
                        <InteractiveShipmentCards
                          cards={msg.shipmentCards}
                          onSelect={(code) => handleSendMessage(`Tra cứu hành trình đơn ${code}`)}
                        />
                      )}

                      {/* Action Chips */}
                      {msg.actionChips && msg.actionChips.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.actionChips.map((chip, chipIdx) => (
                            <button
                              key={chipIdx}
                              type="button"
                              onClick={() => {
                                if (chip.query.endsWith('là ') || chip.query.endsWith('sđt ')) {
                                  setInputMessage(chip.query);
                                } else if (chip.label.includes('Đăng nhập')) {
                                  window.location.href = '/login';
                                } else if (chip.label === 'Tạo đơn ngay' || chip.query === 'Tạo đơn ngay') {
                                  handleSendMessage('Tạo đơn ngay', { action: 'OPEN_ORDER_FORM' });
                                } else if (chip.label === 'Xác nhận tạo đơn' || chip.query === 'Xác nhận tạo đơn') {
                                  handleSendMessage('Xác nhận tạo đơn', { action: 'CONFIRM_ORDER' });
                                } else if (chip.label === 'Chỉnh sửa thông tin') {
                                  handleSendMessage('Tạo đơn ngay', { action: 'OPEN_ORDER_FORM' });
                                } else if (chip.label === 'Hủy tạo đơn' || chip.query === 'Hủy tạo đơn') {
                                  handleSendMessage('Hủy tạo đơn', { action: 'CANCEL_ORDER' });
                                } else {
                                  handleSendMessage(chip.query);
                                }
                              }}
                              className={`px-3 py-1 text-xs font-semibold transition rounded-full cursor-pointer shadow-xs active:scale-95 whitespace-nowrap ${
                                chip.label === 'Xác nhận tạo đơn'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : chip.label === 'Tạo đơn ngay'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : chip.label === 'Hủy tạo đơn'
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  : 'bg-blue-50/70 hover:bg-blue-100/90 text-blue-700 border border-blue-200/80'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.sender === 'user' && (
                    <span className="text-[10px] mt-1 font-medium px-1 text-slate-400">
                      {msg.time}
                    </span>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mt-0.5 border border-blue-200">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* High-Tech Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/25">
                  <Bot className="h-4 w-4 text-white" strokeWidth={2.2} />
                </div>
                <div className="bg-white border border-slate-200/80 px-4 py-2.5 shadow-sm flex items-center gap-1.5 rounded-2xl">
                  <span className="text-[11px] font-medium text-slate-400 mr-1">Nexus Robot đang soạn</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Footer (Elevated Modern Floating Capsule) */}
          <footer className="p-3 bg-white border-t border-slate-100 shrink-0 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-50 focus-within:bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 rounded-2xl pl-3.5 pr-1.5 py-1.5 transition-all shadow-xs"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập mã vận đơn hoặc đặt câu hỏi..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs py-1 outline-none text-slate-800 placeholder:text-slate-400 font-normal"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="h-8 w-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-30 disabled:pointer-events-none text-white shadow-md shadow-blue-500/25 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
                title="Gửi"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-slate-400 font-normal">
                Hệ thống AI tự động tra cứu vận đơn & giải đáp chính sách bưu chính 24/7
              </span>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};
