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
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ZaloIcon } from './ZaloIcon';

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
  { label: 'Tra cứu vận đơn', query: 'Tra cứu hành trình đơn hàng gần nhất của tôi' },
  { label: 'Dự toán cước', query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội' },
  { label: 'Bồi thường bể vỡ', query: 'Chính sách đồng kiểm và bồi thường hàng dễ vỡ khi bể vỡ' },
  { label: 'Quy định hoàn hàng', query: 'Quy định thu cước chuyển hoàn khi người nhận từ chối nhận hàng' },
  { label: 'Hỗ trợ Zalo', query: 'Tôi muốn liên hệ hỗ trợ bưu phẩm qua Zalo trực tuyến' },
];

const FormattedChatMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Pre-process: remove raw backticks, excessive asterisks, and generic emojis
  const cleanText = text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`/g, '')
    .replace(/\*{3,}/g, '**')
    .replace(/[📦📍🏷️👤💰🏢⏰🚚📋💡✅❌⚠️👋🚨💬]/g, '')
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
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        elements.push(content.slice(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // [link text](url) -> Clickable Link
        elements.push(
          <a
            key={`link-${match.index}`}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
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

export const FloatingAiChatWidget: React.FC = () => {
  const { phone, user } = useAuthStore();
  const currentUserId = user?.id || phone || null;
  const userDisplayName = user?.displayName || phone || null;

  const [isOpen, setIsOpen] = useState(false);
  const [showCallout, setShowCallout] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getStorageKey = (uid: string | null) => `nexus_guest_ai_chat_${uid || 'anonymous'}`;

  const getWelcomeMessage = (uid: string | null, name: string | null): ChatMessage => ({
    id: 'welcome_' + (uid || 'guest'),
    sender: 'bot',
    text: uid
      ? `Chào ${name || 'bạn'}, mình có thể hỗ trợ gì cho bưu gửi của bạn hôm nay? Bạn gửi mã vận đơn để mình kiểm tra hành trình ngay, hoặc chọn các chủ đề bên dưới nhé.`
      : 'Chào bạn, mình là trợ lý hỗ trợ trực tuyến của Nexus Logistics. Bạn đang cần kiểm tra đơn hàng hay giải đáp cước phí, bồi thường thì cứ gửi tin nhắn cho mình nhé.',
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

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: responseData.answer || 'Hệ thống đã ghi nhận yêu cầu của bạn.',
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

      if (isZaloQuery) {
        fallbackText =
          `Bạn có thể nhắn tin trực tiếp với chuyên viên hỗ trợ qua Zalo [tại đây](https://zalo.me/0869500573) để được xử lý nhanh nhé. ` +
          `Đội ngũ luôn sẵn sàng hỗ trợ kiểm tra lộ trình bưu gửi, giục phát hoặc giải quyết khiếu nại phát sinh.`;
      } else if (isDamageQuery) {
        fallbackText =
          `Với đơn hàng có dấu hiệu hư hỏng hoặc bể vỡ, bạn lưu ý đồng kiểm cùng bưu tá và yêu cầu lập biên bản bất thường ngay lúc nhận nhé.\n\n` +
          `• Gói Tiêu chuẩn: Bồi thường tối đa 4 lần cước vận chuyển (không quá 1.000.000 đ/đơn).\n` +
          `• Gói Bảo hiểm khai giá: Đền bù 100% giá trị tổn thất theo hóa đơn chứng từ.\n` +
          `Hồ sơ thường được thẩm định trong 24 đến 48 giờ. Bạn có mã vận đơn thì gửi luôn để mình kiểm tra tình trạng xử lý giúp bạn.`;
      } else if (isClaimQuery) {
        fallbackText =
          `Để tra cứu tiến độ hồ sơ bồi thường, bạn gửi giúp mình mã hồ sơ (ví dụ CLM-...) hoặc mã vận đơn nhé. ` +
          `Các yêu cầu thường được thẩm định trong vòng 24 đến 48 giờ làm việc. Nếu cần xử lý khẩn, bạn có thể gọi hotline 1900 6868.`;
      } else if (isReturnQuery) {
        fallbackText =
          `Về quy định chuyển hoàn bưu gửi: với khách gửi thông thường, cước hoàn là 50% cước chiều đi; còn khách hàng doanh nghiệp theo hợp đồng sẽ được miễn phí hoàn 100%. ` +
          `Bạn gửi mã đơn để mình kiểm tra trạng thái chuyển hoàn cụ thể nhé.`;
      } else {
        fallbackText =
          `Hệ thống đang xử lý nhiều lượt tra cứu cùng lúc. ` +
          `Bạn gửi lại mã vận đơn hoặc liên hệ tổng đài 1900 6868 để bên mình hỗ trợ bạn ngay nhé.`;
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
                              onClick={() => handleSendMessage(chip.query)}
                              className="px-3 py-1 bg-blue-50/70 hover:bg-blue-100/90 text-blue-700 border border-blue-200/80 text-xs font-semibold transition rounded-full cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
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
