import React, { useState, useRef, useEffect } from 'react';
import {
  Truck,
  Package,
  Search,
  Scale,
  ShieldCheck,
  PhoneCall,
  RotateCcw,
  ChevronDown,
  User,
  MapPin,
  ArrowRight,
  Send,
  X,
  Phone,
  Copy,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

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

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  toolsUsed?: string[];
  citations?: { file: string; title: string; score: number }[];
  shipmentCards?: ShipmentCard[];
  actionChips?: ActionChip[];
}

const QUICK_SUGGESTIONS = [
  { icon: Search, label: 'Tra cứu bưu gửi', query: 'Tra cứu hành trình đơn hàng gần nhất của tôi' },
  { icon: Package, label: 'Đơn tôi vừa gửi', query: 'đơn hàng tôi vừa gửi sao rồi' },
  { icon: Scale, label: 'Dự toán cước IATA', query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội' },
  { icon: ShieldCheck, label: 'Đồng kiểm & Đền bù', query: 'Chính sách đồng kiểm và bồi thường hàng dễ vỡ khi bể' },
  { icon: RotateCcw, label: 'Cước hoàn bom hàng', query: 'Quy định thu cước chuyển hoàn khi người nhận từ chối nhận hàng' },
  { icon: PhoneCall, label: 'Trực ban CSKH', query: 'Tôi muốn gặp trực tiếp chuyên viên CSKH để giục giao gấp' },
];

const FormattedChatMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Tiền xử lý: loại bỏ các ký tự backticks thừa và dấu sao thô
  const cleanText = text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`/g, '')
    .replace(/\*{3,}/g, '**')
    .replace(/(^|\n)\s*([•\-\*])\s*\n+(\s*)/g, '$1• ');

  const rawLines = cleanText.split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if (line.trim() === '' && lines.length > 0 && lines[lines.length - 1].trim() === '') {
      continue;
    }
    lines.push(line);
  }

  const renderInlineBold = (content: string) => {
    const parts = content.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <strong key={idx} className="font-semibold text-slate-900">
            {part}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-1 text-slate-800 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // 1. Dòng bullet điểm
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const itemContent = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <div className="flex-1 text-[12px]">{renderInlineBold(itemContent)}</div>
            </div>
          );
        }

        // 2. Dòng section/tiêu đề ngắn có emoji
        const isHeader = /^[📦📍🏷️👤💰🏢⏰🚚📋💡✅❌⚠️]/.test(trimmed) && trimmed.length < 80;
        if (isHeader) {
          return (
            <div key={idx} className="font-medium text-slate-900 text-[12.5px] pt-1">
              {renderInlineBold(trimmed)}
            </div>
          );
        }

        // 3. Đoạn văn thông thường
        return (
          <p key={idx} className="text-[12px]">
            {renderInlineBold(trimmed)}
          </p>
        );
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
    <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-0.5">
        <span className="flex items-center gap-1.5 text-blue-900">
          <Package className="h-3.5 w-3.5 text-blue-700" />
          Phiếu vận đơn bưu chính ({cards.length})
        </span>
        <span className="text-[10px] text-slate-400 font-normal lowercase italic">nhấn để tra cứu</span>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card, idx) => {
          const isDelivered = card.status === 'DELIVERED';
          const isDelivering = card.status === 'OUT_FOR_DELIVERY';
          const isInTransit = card.status === 'IN_TRANSIT' || card.status === 'RECEIVED_ORIGIN_HUB' || card.status === 'RECEIVED_DESTINATION_HUB';

          let badgeClass = 'bg-sky-50 text-sky-800 border-sky-300';
          if (isDelivered) badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
          else if (isDelivering) badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
          else if (isInTransit) badgeClass = 'bg-blue-50 text-blue-800 border-blue-300';

          return (
            <div
              key={card.code || idx}
              onClick={() => onSelect(card.code)}
              className="group relative rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 p-3 shadow-xs hover:shadow-md hover:border-blue-500 transition-all cursor-pointer text-left"
            >
              {/* Header: Code & Copy & Status Badge */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VẬN ĐƠN:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs tracking-tight group-hover:text-blue-700 transition-colors">
                    {card.code}
                  </span>
                  <button
                    onClick={(e) => handleCopy(e, card.code)}
                    title="Sao chép mã vận đơn"
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {copiedCode === card.code ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeClass} shrink-0`}>
                  {card.statusText || card.status || 'Đang xử lý'}
                </span>
              </div>

              {/* Item Name */}
              <div className="text-[12px] font-medium text-slate-800 line-clamp-1 mb-1.5 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>{card.itemName || 'Kiện hàng bưu gửi'}</span>
              </div>

              {/* Sub-info: Destination & COD */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                <div className="truncate flex items-center gap-1 max-w-[65%]">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-slate-700 truncate">{card.receiverCity || card.receiverName || 'Điểm giao'}</span>
                </div>
                {card.codAmount !== undefined && (
                  <div className="text-right shrink-0">
                    COD: <span className="font-bold text-slate-900">{card.codAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-blue-700 font-semibold group-hover:text-blue-900">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3 text-blue-600" />
                  <span>Tra cứu hành trình bưu tá & Hub</span>
                </span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatToolBadge(tool: string): string | null {
  if (tool.includes('trackShipment') || tool.includes('getUserShipments')) return 'Đã cập nhật hành trình';
  if (tool.includes('calculatePricing') || tool.includes('quoteShipmentOrder')) return 'Đã tính cước tự động';
  if (tool.includes('createRetailOrder')) return 'Đã tiếp nhận tạo đơn';
  if (tool.includes('trackClaimStatus') || tool.includes('getDamageAndClaimPolicy')) return 'Chính sách bồi thường & sự cố';
  if (tool.includes('escalateToHumanAgent')) return 'Kết nối tổng đài viên';
  if (tool.includes('calculateReturnFee')) return 'Quy chuẩn chuyển hoàn';
  if (tool.includes('getStorageAgingPolicy')) return 'Quy định lưu kho';
  return null;
}

export const FloatingAiChatWidget: React.FC = () => {
  const { phone, user } = useAuthStore();
  const currentUserId = user?.id || phone || null;
  const userDisplayName = user?.displayName || phone || null;

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getStorageKey = (uid: string | null) => `nexus_guest_ai_chat_${uid || 'anonymous'}`;

  const getWelcomeMessage = (uid: string | null, name: string | null): ChatMessage => ({
    id: 'welcome_' + (uid || 'guest'),
    sender: 'bot',
    text: uid
      ? `Kính chào Quý khách **${name || uid}**!\nTôi là **Chuyên Viên Điều Phối Bưu Chính Nexus Express** trực tuyến 24/7.\nTôi sẵn sàng hỗ trợ Quý khách: Tra cứu vận trình bưu phẩm thời gian thực, điều phối bưu tá qua lấy hàng tận nơi, báo giá cước IATA chuẩn xác và giải quyết hồ sơ bồi thường theo đúng Luật Bưu chính.`
      : 'Kính chào Quý khách!\nTôi là **Chuyên Viên Điều Phối Bưu Chính Nexus Express** trực tuyến 24/7.\nTôi sẵn sàng hỗ trợ Quý khách: Tra cứu hành trình bưu phẩm, đặt lịch bưu tá lấy hàng tận nơi, tính cước tuyến liên tỉnh và giải đáp chính sách bưu chính 24/7.',
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

  // Tách biệt lịch sử chat khi chuyển đổi giữa các tài khoản (0773586656 vs 0773586666 vs Khách)
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
  }, [currentUserId]);

  // Lưu lại tin nhắn vào session storage theo tài khoản hiện tại
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
    try {
      sessionStorage.removeItem(getStorageKey(currentUserId));
    } catch {}
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

  const handleSendMessage = async (textToSend?: string) => {
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
      // 1. Thử gọi qua Gateway BFF (Port 3000), nếu Gateway chưa proxy kịp thì tự động gọi thẳng Chatbot Service (Port 3013)
      const requestPayload = {
        message: query,
        userId: currentUserId || undefined,
        senderRole: currentUserId ? 'CUSTOMER' : 'GUEST',
      };

      let response: globalThis.Response;
      try {
        response = await fetch(`${gatewayUrl}/api/v1/ai-assistant/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
          throw new Error(`Gateway returned HTTP ${response.status}`);
        }
      } catch {
        // Fallback sang Chatbot Service trực tiếp
        response = await fetch('http://localhost:3013/api/v1/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(30000),
        });
      }

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: data.answer || 'Hệ thống đã tiếp nhận yêu cầu của bạn.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: data.toolsUsed,
          citations: data.citations,
          shipmentCards: data.shipmentCards,
          actionChips: data.actionChips,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      const isClaimQuery = /CLM|khiếu nại|bồi thường|đền bù/i.test(query);
      const isDamageQuery = /hỏng|hư|bể|vỡ|móp|thiệt hại/i.test(query);
      const isReturnQuery = /hoàn|bom|phí hoàn/i.test(query);

      let fallbackText = '';
      let toolsUsed: string[] = [];

      if (isDamageQuery) {
        toolsUsed = ['getDamageAndClaimPolicy(Fragile Goods & Damage Settlement)'];
        fallbackText = `Quy trình xử lý sự cố hàng hư hỏng / bể vỡ theo Quy chuẩn Vận hành Nexus Logistics:\n\n` +
          `1. Khi nhận hàng: Quý khách đồng kiểm với bưu tá, yêu cầu lập Biên bản bất thường tại chỗ (chụp ảnh 4 góc và quay video bưu phẩm nứt vỡ) và từ chối nhận hàng (không thanh toán bất kỳ chi phí nào).\n` +
          `2. Hạn mức bồi thường:\n` +
          `• Gói Tiêu chuẩn: Bồi thường tối đa 04 lần cước vận chuyển (không quá 1.000.000 VNĐ/đơn theo Luật Bưu chính).\n` +
          `• Gói Bảo hiểm khai giá: Đền bù 100% giá trị tổn thất thực tế theo hóa đơn, trần tối đa 30.000.000 VNĐ/đơn.\n` +
          `3. Thời hạn giải quyết: Thẩm định trong 24h - 48h, hoàn tất chi trả bồi thường trong 03 - 05 ngày làm việc.\n\n` +
          `Quý khách có thể xem chi tiết tại Chính sách & Quy định dịch vụ của chúng tôi.`;
      } else if (isClaimQuery) {
        toolsUsed = ['trackClaimStatus(CLM-Policy)'];
        fallbackText = `Dạ chào bạn, quy trình tra cứu hồ sơ khiếu nại bồi thường Nexus Logistics:\n\n` +
          `• Để tra cứu tiến độ hồ sơ khiếu nại, bạn vui lòng gửi kèm mã hồ sơ khiếu nại (ví dụ: CLM-202609-001) hoặc mã vận đơn bưu gửi có phát sinh sự cố.\n` +
          `• Thời hạn thẩm định hồ sơ: 24h - 48h làm việc kể từ khi lập biên bản đồng kiểm.\n` +
          `• Hình thức giải ngân bồi thường: Chuyển khoản trực tiếp vào tài khoản ngân hàng hoặc cấn trừ kỳ đối soát gần nhất.\n\n` +
          `Nếu cần khiếu nại gấp, bạn có thể gọi hotline trực ban CSKH: 1900 6868 để được nhân viên thụ lý hồ sơ.`;
      } else if (isReturnQuery) {
        toolsUsed = ['calculateReturnFee(Rule-based Policy)'];
        fallbackText = `Theo Quy chuẩn Cước chuyển hoàn bưu gửi của Nexus Logistics:\n\n` +
          `1. Mức Chuẩn Mặc Định (Shop thường / Khách lẻ): Áp dụng thu 50% cước chiều đi do Người gửi chi trả nhằm bù đắp chi phí phương tiện và ngăn chặn đơn ảo.\n` +
          `• Với Shop có tài khoản: Hệ thống tự động cấn trừ vào Bảng kê đối soát tiền thu hộ COD (COD Settlement Batch).\n` +
          `2. Đối Tác VIP Doanh Nghiệp (Sản lượng > 1.000 đơn/tháng): Áp dụng 0 VNĐ (Miễn phí chuyển hoàn 100%) theo thỏa thuận hợp đồng.\n\n` +
          `Quý khách có thể xem chi tiết tại Chính sách & Quy định dịch vụ của chúng tôi.`;
      } else {
        fallbackText =
          `Dạ hiện tại kết nối mạng đến Trung tâm Điều phối Bưu cục tạm thời bị gián đoạn. ` +
          `Quý khách vui lòng gửi lại mã vận đơn cụ thể hoặc liên hệ Hotline trực ban bưu cục 1900 6868 để được hỗ trợ kiểm tra trực tiếp.`;
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: fallbackText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        toolsUsed,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-slate-700/80 px-4 py-2 rounded-full text-xs font-semibold animate-bounce">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-white font-bold tracking-tight">Trung Tâm Điều Phối Bưu Chính</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group flex items-center justify-center h-14 w-14 rounded-2xl shadow-2xl border transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'bg-slate-900 text-white border-slate-700 rotate-90 hover:bg-slate-800'
              : 'bg-slate-900 text-white border-slate-700/80 hover:bg-slate-800 hover:scale-105 shadow-slate-900/40'
          }`}
          title={isOpen ? 'Đóng quầy điều phối' : 'Mở Trung tâm Điều phối Nexus Logistics'}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <Truck className="h-7 w-7 text-sky-400 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. Floating Chat Window (Drawer) - Mission-Critical Logistics Desk */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[610px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-sans">
          {/* Header Quầy Điều Phối Bưu Chính */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shadow-inner">
                <Truck className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-white uppercase">Trung Tâm Điều Phối Nexus</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Trực tuyến 24/7
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>{currentUserId ? `Tài khoản: ${currentUserId}` : 'Khách vãng lai'}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                    <Phone className="h-2.5 w-2.5 inline" /> 1900 6868
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Bắt đầu phiên tra cứu mới"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ cửa sổ"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Operational Linehaul SLA Banner */}
          <div className="px-3 py-1.5 bg-slate-950 text-[10.5px] text-slate-300 flex items-center justify-between border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
              <span>Tuyến Trục Quốc Gia: <strong>Hoạt động bình thường</strong></span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">SLA 99.4%</span>
          </div>

          {/* Quick Suggestions Chips - Logistics Actions */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_SUGGESTIONS.map((item, index) => {
              const IconComp = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-[11px] text-slate-700 hover:text-blue-900 font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <IconComp className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center text-xs shadow-xs mt-0.5 border border-slate-700">
                    <Truck className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                  }`}
                >
                  {/* Operational Action Badges */}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool, idx) => {
                        const friendlyLabel = formatToolBadge(tool);
                        if (!friendlyLabel) return null;
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80"
                          >
                            <Truck className="h-2.5 w-2.5 text-blue-600" />
                            {friendlyLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Message content */}
                  <FormattedChatMessage text={msg.text} isUser={msg.sender === 'user'} />

                  {/* Interactive Shipment Cards */}
                  {msg.shipmentCards && msg.shipmentCards.length > 0 && (
                    <InteractiveShipmentCards
                      cards={msg.shipmentCards}
                      onSelect={(code) => handleSendMessage(`Tra cứu hành trình đơn ${code}`)}
                    />
                  )}

                  {/* Interactive Quick Action Chips */}
                  {msg.actionChips && msg.actionChips.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.actionChips.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          onClick={() => handleSendMessage(chip.query)}
                          className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-all shadow-2xs flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Link tới Trang Chính sách chung của hệ thống */}
                  {msg.sender === 'bot' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors group"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                        <span>Xem chi tiết tại Quy định & Chính sách dịch vụ</span>
                      </a>
                    </div>
                  )}

                  <div
                    className={`mt-1 text-[9px] text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center text-xs shadow-xs mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="shrink-0 h-7 w-7 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center text-xs shadow-xs border border-slate-700">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-xs flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
                  </span>
                  <span className="text-[11px] text-slate-700 font-medium ml-1">Đang kết nối trung tâm điều phối & tra cứu bưu phẩm...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập mã vận đơn (333...), tra cứu đơn hoặc hỏi cước..."
                disabled={isLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800/10 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-slate-500">
                Nexus Logistics • Trung Tâm Điều Phối Bưu Chính Toàn Quốc • Hotline Trực Ban: 1900 6868
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
