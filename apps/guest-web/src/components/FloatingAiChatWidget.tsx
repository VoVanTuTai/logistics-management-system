import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  ChevronDown,
  User,
  MapPin,
  ArrowRight,
  Phone,
  Copy,
  Check,
  Package,
  Truck,
  ShieldCheck,
  Scale,
  Search,
  PhoneCall,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ZaloIcon } from './ZaloIcon';
import { NexusBrandMark } from './NexusBrandLogo';

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
  { icon: Search, label: 'Tra cứu bưu gửi Nexus', query: 'Tra cứu hành trình đơn hàng gần nhất của tôi' },
  { icon: Scale, label: 'Dự toán cước IATA', query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội' },
  { icon: ShieldCheck, label: 'Quy chuẩn đền bù bể vỡ', query: 'Chính sách đồng kiểm và bồi thường hàng dễ vỡ khi bể' },
  { icon: RotateCcw, label: 'Cước chuyển hoàn bom', query: 'Quy định thu cước chuyển hoàn khi người nhận từ chối nhận hàng' },
  { icon: PhoneCall, label: '💬 Chat CSKH Zalo 24/7', query: 'Tôi muốn liên hệ hỗ trợ bưu phẩm qua Zalo trực tuyến' },
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
          <strong key={idx} className="font-bold text-slate-900">
            {part}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-1.5 text-slate-800 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // 1. Dòng bullet điểm
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const itemContent = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5">
              <span className="h-1.5 w-1.5 bg-blue-600 mt-1.5 shrink-0" />
              <div className="flex-1 text-xs">{renderInlineBold(itemContent)}</div>
            </div>
          );
        }

        // 2. Dòng section/tiêu đề ngắn có emoji
        const isHeader = /^[📦📍🏷️👤💰🏢⏰🚚📋💡✅❌⚠️👋]/.test(trimmed) && trimmed.length < 80;
        if (isHeader) {
          return (
            <div key={idx} className="font-bold text-slate-900 text-xs pt-0.5">
              {renderInlineBold(trimmed)}
            </div>
          );
        }

        // 3. Đoạn văn thông thường
        return (
          <p key={idx} className="text-xs">
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
    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
        <span className="flex items-center gap-1.5 text-blue-700">
          <Package className="h-3.5 w-3.5" />
          Vận đơn tìm thấy ({cards.length})
        </span>
        <span className="text-[10px] text-slate-400 font-normal lowercase italic">chọn để tra cứu</span>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card, idx) => {
          const isDelivered = card.status === 'DELIVERED';
          const isDelivering = card.status === 'OUT_FOR_DELIVERY';
          const isInTransit = card.status === 'IN_TRANSIT' || card.status === 'RECEIVED_ORIGIN_HUB' || card.status === 'RECEIVED_DESTINATION_HUB';

          let badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
          if (isDelivered) badgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
          else if (isDelivering) badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
          else if (isInTransit) badgeClass = 'bg-slate-100 text-slate-800 border-slate-200';

          return (
            <div
              key={card.code || idx}
              onClick={() => onSelect(card.code)}
              className="group border border-slate-200 bg-slate-50 hover:bg-white p-3 shadow-2xs hover:shadow-xs hover:border-blue-400 transition cursor-pointer text-left"
            >
              {/* Header: Code & Copy & Status Badge */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                    #{card.code}
                  </span>
                  <button
                    onClick={(e) => handleCopy(e, card.code)}
                    title="Sao chép mã vận đơn"
                    className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                  >
                    {copiedCode === card.code ? (
                      <Check className="h-3 w-3 text-blue-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold border ${badgeClass} shrink-0`}>
                  {card.statusText || card.status || 'Đang xử lý'}
                </span>
              </div>

              {/* Item Name */}
              <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1.5 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>{card.itemName || 'Kiện hàng bưu gửi'}</span>
              </div>

              {/* Sub-info: Destination & COD */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60">
                <div className="truncate flex items-center gap-1 max-w-[65%]">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-slate-700 truncate">{card.receiverCity || card.receiverName || 'Điểm giao'}</span>
                </div>
                {card.codAmount !== undefined && (
                  <div className="text-right shrink-0">
                    COD: <span className="font-bold text-blue-700">{card.codAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-blue-600 font-bold group-hover:text-blue-700">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  <span>Tra cứu hành trình bưu phẩm</span>
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
  if (tool.includes('trackClaimStatus') || tool.includes('getDamageAndClaimPolicy')) return 'Chính sách bồi thường';
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
      ? `Kính chào Quý khách **${name || uid}**! 👋\nTôi là **Tổng Đài Viên Số Nexus Logistics**, kênh hỗ trợ trực tuyến chính thức của Mạng lưới Bưu chính Nexus:\n• **Tra cứu bưu phẩm:** Theo dõi định vị GPS hành trình bưu kiện & bưu tá phụ trách.\n• **Dự toán cước bưu chính:** Tính toán chi phí chuẩn mạng lưới 63 tỉnh thành & hỏa tốc IATA.\n• **Hỗ trợ khiếu nại:** Hướng dẫn quy chuẩn bồi thường bể vỡ và thủ tục xử lý nhanh 24/7.\n\nQuý khách có thể nhập mã vận đơn hoặc câu hỏi bất kỳ để tôi hỗ trợ ngay!`
      : 'Kính chào Quý khách! 👋\nTôi là **Tổng Đài Viên Số Nexus Logistics**, kênh hỗ trợ trực tuyến chính thức của Mạng lưới Bưu chính Nexus:\n• **Tra cứu bưu phẩm:** Theo dõi định vị GPS hành trình bưu kiện & bưu tá phụ trách.\n• **Dự toán cước bưu chính:** Tính toán chi phí chuẩn mạng lưới 63 tỉnh thành & hỏa tốc IATA.\n• **Hỗ trợ khiếu nại:** Hướng dẫn quy chuẩn bồi thường bể vỡ và thủ tục giải quyết sự cố 24/7.\n\nQuý khách có thể gửi mã vận đơn (VD: 333000000001) hoặc nhập câu hỏi để được hỗ trợ ngay lập tức!',
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

  // Tách biệt lịch sử chat khi chuyển đổi giữa các tài khoản
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
      const requestPayload = {
        message: query,
        userId: currentUserId || undefined,
        senderRole: currentUserId ? 'CUSTOMER' : 'GUEST',
      };

      // Candidate endpoints in order of reliability:
      // 1. Same-origin relative path '/api/v1/ai-assistant/message' (zero CORS issues via dev server or reverse proxy)
      // 2. Gateway BFF URL configured in env
      // 3. Direct IPv4 Gateway BFF 'http://127.0.0.1:3000/api/v1/ai-assistant/message'
      // 4. Direct 'http://localhost:3000/api/v1/ai-assistant/message'
      // 5. Direct Chatbot Microservice 'http://127.0.0.1:3013/api/v1/chat/message'
      // 6. Direct Chatbot Microservice 'http://localhost:3013/api/v1/chat/message'
      const candidateUrls: string[] = ['/api/v1/ai-assistant/message'];
      if (gatewayUrl && !candidateUrls.includes(`${gatewayUrl}/api/v1/ai-assistant/message`)) {
        candidateUrls.push(`${gatewayUrl}/api/v1/ai-assistant/message`);
      }
      candidateUrls.push(
        'http://127.0.0.1:3000/api/v1/ai-assistant/message',
        'http://localhost:3000/api/v1/ai-assistant/message',
        'http://127.0.0.1:3013/api/v1/chat/message',
        'http://localhost:3013/api/v1/chat/message'
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
        throw lastErr || new Error('Không thể kết nối đến máy chủ AI');
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: responseData.answer || 'Hệ thống đã tiếp nhận yêu cầu của bạn.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: responseData.toolsUsed,
        citations: responseData.citations,
        shipmentCards: responseData.shipmentCards,
        actionChips: responseData.actionChips,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const isZaloQuery = /zalo|tác giả|xin việc|tuyển dụng|liên hệ|tú tài|developer|contact|cv/i.test(query);
      const isClaimQuery = /CLM|khiếu nại|bồi thường|đền bù/i.test(query);
      const isDamageQuery = /hỏng|hư|bể|vỡ|móp|thiệt hại/i.test(query);
      const isReturnQuery = /hoàn|bom|phí hoàn/i.test(query);

      let fallbackText = '';
      let toolsUsed: string[] = [];

      if (isZaloQuery) {
        toolsUsed = ['ZaloCustomerSupportDirectConnect'];
        fallbackText = `Dạ chào Quý khách! 👋\n\nBạn có thể liên hệ trực tiếp với bộ phận CSKH của Nexus Logistics qua:\n• **Kênh Zalo hỗ trợ:** [Nhấn vào đây để mở Chat Zalo](https://zalo.me/0869500573) *(Mở ứng dụng hoặc web Zalo trực tiếp)*\n• **Thời gian phục vụ:** 24/7 toàn quốc\n• **Nghiệp vụ hỗ trợ:** Kiểm tra hành trình bưu gửi, giục bưu tá giao hàng gấp, hỗ trợ khiếu nại đền bù và tư vấn cước phí.\n\nNexus Logistics luôn sẵn sàng phục vụ Quý khách!`;
      } else if (isDamageQuery) {
        toolsUsed = ['getDamageAndClaimPolicy(Fragile Goods & Damage Settlement)'];
        fallbackText = `Quy trình xử lý sự cố hàng hư hỏng / bể vỡ theo Quy chuẩn Nexus Logistics:\n\n` +
          `1. Khi nhận hàng: Quý khách đồng kiểm với bưu tá, yêu cầu lập Biên bản bất thường tại chỗ (chụp ảnh và video bưu phẩm hư hại) và từ chối nhận hàng.\n` +
          `2. Hạn mức bồi thường:\n` +
          `• Gói Tiêu chuẩn: Bồi thường tối đa 04 lần cước vận chuyển (không quá 1.000.000 VNĐ/đơn theo Luật Bưu chính).\n` +
          `• Gói Bảo hiểm khai giá: Đền bù 100% giá trị tổn thất thực tế theo hóa đơn, trần tối đa 30.000.000 VNĐ/đơn.\n` +
          `3. Thời hạn giải quyết: Thẩm định trong 24h - 48h, hoàn tất chi trả trong 03 - 05 ngày làm việc.`;
      } else if (isClaimQuery) {
        toolsUsed = ['trackClaimStatus(CLM-Policy)'];
        fallbackText = `Quy trình tra cứu hồ sơ khiếu nại bồi thường Nexus Logistics:\n\n` +
          `• Để tra cứu tiến độ, bạn vui lòng gửi kèm mã hồ sơ khiếu nại (ví dụ: CLM-202609-001) hoặc mã vận đơn có phát sinh sự cố.\n` +
          `• Thời hạn thẩm định: 24h - 48h làm việc kể từ khi lập biên bản đồng kiểm.\n` +
          `• Hình thức giải ngân: Chuyển khoản trực tiếp hoặc cấn trừ kỳ đối soát gần nhất.\n\n` +
          `Nếu cần khiếu nại khẩn, bạn có thể gọi hotline: 1900 0000 để được nhân viên hỗ trợ trực tiếp.`;
      } else if (isReturnQuery) {
        toolsUsed = ['calculateReturnFee(Rule-based Policy)'];
        fallbackText = `Quy chuẩn cước chuyển hoàn bưu gửi của Nexus Logistics:\n\n` +
          `1. Khách lẻ / Shop thường: Áp dụng thu 50% cước chiều đi do người gửi chi trả nhằm bù đắp chi phí phương tiện và hạn chế đơn ảo.\n` +
          `2. Đối Tác VIP Doanh Nghiệp (sản lượng > 1.000 đơn/tháng): Miễn phí chuyển hoàn 100% theo hợp đồng dịch vụ.`;
      } else {
        fallbackText =
          `Hiện tại kết nối máy chủ điều phối đang bận. ` +
          `Quý khách vui lòng gửi lại mã vận đơn hoặc liên hệ Hotline tổng đài 1900 0000 để được hỗ trợ nhanh nhất.`;
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
      {/* 1. Floating Action Buttons: Zalo Contact & AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Floating Zalo Direct Contact (Official Brand Icon - Circular) */}
        <a
          href="https://zalo.me/0869500573"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group flex items-center justify-center h-14 w-14 rounded-full border border-blue-400/50 bg-[#0068FF] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Chat Zalo hỗ trợ 24/7"
          aria-label="Chat Zalo hỗ trợ trực tuyến"
        >
          <ZaloIcon className="h-10 w-10 overflow-hidden rounded-full" shape="circle" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </span>
          {/* Tooltip on hover */}
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap bg-slate-900 px-3 py-1.5 rounded-full text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 hidden sm:block">
            Chat Zalo 24/7
          </span>
        </a>

        {/* Floating AI Chatbot Button (Nexus Logistics CSKH - Circular) */}
        <div className="flex items-center gap-2.5">
          {!isOpen && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2.5 bg-white text-slate-800 shadow-xl border border-slate-300 pl-3 pr-4 py-2 rounded-full transition-all duration-300 hover:shadow-2xl hover:border-blue-600 group cursor-pointer active:scale-95"
            >
              <NexusBrandMark size="xs" className="shadow-xs group-hover:scale-105 transition-transform rounded-full" />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-xs text-blue-900 tracking-tight">NEXUS CSKH 24/7</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">Trợ lý điều phối bưu chính</span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`relative group flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition-all duration-300 cursor-pointer border border-blue-500/50 ${
              isOpen
                ? 'bg-blue-800 text-white hover:bg-blue-900'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
            }`}
            title={isOpen ? 'Đóng cửa sổ chat' : 'Mở Cổng CSKH Nexus Logistics'}
            aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <>
                <div className="flex flex-col items-center justify-center">
                  <NexusBrandMark size="xs" className="shadow-xs group-hover:scale-110 transition-transform rounded-full" />
                  <span className="text-[8px] font-black uppercase tracking-tight text-white mt-0.5 leading-none">CSKH</span>
                </div>
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Floating Chat Window (Drawer) */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[600px] max-h-[calc(100vh-120px)] bg-white shadow-2xl border border-slate-300 rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 font-sans">
          {/* Header */}
          <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <NexusBrandMark size="sm" className="shadow-md border border-white/20 rounded-full" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border border-white" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white tracking-tight">NEXUS CSKH 24/7</h3>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold bg-white/20 text-white rounded-full">
                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-300" />
                    Chính Thức
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5 font-medium">
                  <span>Điều Phối Bưu Chính Quốc Gia</span>
                  <span>•</span>
                  <span>Trực Tuyến</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href="https://zalo.me/0869500573"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition shadow-xs rounded-full"
                title="Chat Zalo hỗ trợ khách hàng"
              >
                <ZaloIcon className="h-3.5 w-3.5 rounded-full" shape="circle" />
                <span>Chat Zalo</span>
              </a>
              <button
                type="button"
                onClick={handleClearChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer rounded-full"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer rounded-full"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_SUGGESTIONS.map((item, index) => {
              const IconComp = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-500 text-[11px] text-slate-800 hover:text-blue-700 font-bold transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
                >
                  <IconComp className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {/* Corporate Identification Card */}
            <div className="border border-slate-300 bg-white p-3 shadow-xs rounded-xl">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Truck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-900 tracking-tight">HỆ THỐNG ĐIỀU PHỐI NEXUS LOGISTICS</h4>
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-600 text-white rounded-full leading-none">Chính thức</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate">Cổng hỗ trợ tra cứu bưu gửi & xử lý sự cố 24/7</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200 text-center">
                <div className="bg-slate-50 py-1.5 px-1 border border-slate-200 rounded-lg">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Bưu cục</p>
                  <p className="text-[11px] font-black text-blue-700">63 Tỉnh Thành</p>
                </div>
                <div className="bg-slate-50 py-1.5 px-1 border border-slate-200 rounded-lg">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Định vị GPS</p>
                  <p className="text-[11px] font-black text-emerald-600">Thời Gian Thực</p>
                </div>
                <div className="bg-slate-50 py-1.5 px-1 border border-slate-200 rounded-lg">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Hotline</p>
                  <p className="text-[11px] font-black text-blue-700">1900 6868</p>
                </div>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <NexusBrandMark size="sm" className="mt-0.5 shadow-xs shrink-0 rounded-full" />
                )}

                <div
                  className={`max-w-[85%] px-4 py-2.5 text-xs leading-relaxed border shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white border-blue-700 rounded-2xl rounded-tr-xs'
                      : 'bg-white text-slate-800 border-slate-300 rounded-2xl rounded-tl-xs'
                  }`}
                >
                  {/* Sender title for bot */}
                  {msg.sender === 'bot' && (
                    <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-extrabold text-blue-700 tracking-tight">Nexus CSKH</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        Tổng Đài Viên Số
                      </span>
                    </div>
                  )}

                  {/* Badges for tools */}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool, idx) => {
                        const friendlyLabel = formatToolBadge(tool);
                        if (!friendlyLabel) return null;
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
                          >
                            <Package className="h-2.5 w-2.5 text-blue-600" />
                            {friendlyLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Formatted Content */}
                  <FormattedChatMessage text={msg.text} isUser={msg.sender === 'user'} />

                  {/* Interactive Cards */}
                  {msg.shipmentCards && msg.shipmentCards.length > 0 && (
                    <InteractiveShipmentCards
                      cards={msg.shipmentCards}
                      onSelect={(code) => handleSendMessage(`Tra cứu hành trình đơn ${code}`)}
                    />
                  )}

                  {/* Action Chips */}
                  {msg.actionChips && msg.actionChips.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                      {msg.actionChips.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          type="button"
                          onClick={() => handleSendMessage(chip.query)}
                          className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 hover:border-blue-500 text-[11px] font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer rounded-full shadow-2xs"
                        >
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] text-right font-medium ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mt-0.5 shadow-xs">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Realistic Chatbot 3-dot Typing Animation */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="shrink-0 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-300 px-4 py-2.5 shadow-xs flex items-center gap-1.5 rounded-2xl rounded-tl-xs">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3.5 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-4 py-1.5 rounded-full focus-within:bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15 transition shadow-2xs"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập câu hỏi hoặc mã vận đơn Nexus (VD: 333000000001)..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs py-2 outline-none font-medium text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3 text-slate-400" />
                Cổng hỗ trợ bưu chính Nexus Logistics • Bảo mật chuẩn Quốc Gia
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
