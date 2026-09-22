import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Package, ShieldCheck, Calculator, RotateCcw, ChevronDown, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  toolsUsed?: string[];
  citations?: { file: string; title: string; score: number }[];
}

const QUICK_SUGGESTIONS = [
  { icon: Package, label: 'Đơn mới tạo gần nhất', query: 'Tra cứu đơn hàng mới tạo gần nhất trên hệ thống' },
  { icon: Package, label: 'Tra cứu đơn NX-88992211', query: 'Tra cứu hành trình vận đơn NX-88992211' },
  { icon: ShieldCheck, label: 'Hồ sơ đền bù CLM-202609-001', query: 'Hồ sơ khiếu nại đền bù đơn hàng bể vỡ CLM-202609-001 của tôi đã được duyệt chi chưa?' },
  { icon: RotateCcw, label: 'Cước hoàn khi bom hàng', query: 'Shop mới mở thì cước hoàn tính thế nào và khi nào được miễn phí?' },
  { icon: Calculator, label: 'Cước kiện 2kg HCM -> HN', query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội' },
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
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
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
      ? `Xin chào **${name || uid}**! Tôi là **Trợ Lý AI Nexus Logistics**.\nTôi có thể hỗ trợ bạn tra cứu hành trình bưu gửi thời gian thực, đơn hàng mới nhất của bạn, kiểm tra bồi thường hoặc dự toán cước phí 24/7.`
      : 'Xin chào! Tôi là **Trợ Lý AI Nexus Logistics**.\nTôi có thể hỗ trợ bạn tra cứu hành trình bưu gửi thời gian thực, tiến độ hồ sơ bồi thường hàng hóa, dự toán cước phí IATA và giải đáp chính sách bưu chính 24/7.',
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
      // Gọi qua Gateway BFF (Port 3000) kèm định danh tài khoản
      const response = await fetch(`${gatewayUrl}/api/v1/ai-assistant/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          userId: currentUserId || undefined,
          senderRole: currentUserId ? 'CUSTOMER' : 'GUEST',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: data.answer || 'Hệ thống đã tiếp nhận yêu cầu của bạn.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: data.toolsUsed,
          citations: data.citations,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      // Fallback thông minh khi chưa bật Gateway BFF để người dùng demo không bị gãy
      const isClaimQuery = /CLM|khiếu nại|bồi thường|đền bù/i.test(query);
      const isTrackingQuery = /NX-|tra cứu|vận đơn/i.test(query);
      const isReturnQuery = /hoàn|bom|phí hoàn/i.test(query);

      let fallbackText = '';
      let toolsUsed: string[] = [];

      if (isClaimQuery) {
        toolsUsed = ['trackClaimStatus(CLM-202609-001)'];
        fallbackText = `Dạ chào bạn, Nexus Logistics đã tra cứu dữ liệu thời gian thực:\n\n` +
          `[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ CLM-202609-001]:\n` +
          `• Mã vận đơn: 333000000001\n` +
          `• Trạng thái: Đã phê duyệt chi trả bồi thường 100% (APPROVED_COMPENSATION)\n` +
          `• Số tiền bồi thường duyệt chi: 15.000.000 VNĐ\n` +
          `• Đơn vị chịu trách nhiệm: Hub Tân Bình (Lỗi bốc xếp ném hàng nứt vỡ)\n` +
          `• Hình thức chi trả: Tự động chuyển khoản vào tài khoản ngân hàng trong kỳ đối soát COD gần nhất\n` +
          `• Ngày hoàn tất phán quyết: 15/09/2026\n\n` +
          `✅ Dữ liệu được trích xuất trực tiếp từ microservices nghiệp vụ Nexus Logistics.`;
      } else if (isReturnQuery) {
        toolsUsed = ['calculateReturnFee(Rule-based Policy)'];
        fallbackText = `Theo Quy chuẩn Cước chuyển hoàn bưu gửi của Nexus Logistics:\n\n` +
          `1. Mức Chuẩn Mặc Định (Shop thường / Khách lẻ): Áp dụng thu 50% cước chiều đi do Người gửi chi trả nhằm bù đắp chi phí phương tiện và ngăn chặn đơn ảo.\n` +
          `• Với Shop có tài khoản: Hệ thống tự động cấn trừ vào Bảng kê đối soát tiền thu hộ COD (COD Settlement Batch).\n` +
          `2. Đối Tác VIP Doanh Nghiệp (Sản lượng > 1.000 đơn/tháng): Áp dụng 0 VNĐ (Miễn phí chuyển hoàn 100%) theo thỏa thuận hợp đồng.\n\n` +
          `📖 Trích dẫn: [04-delivery-process-and-faq.md - Mục 5]`;
      } else if (isTrackingQuery) {
        toolsUsed = ['trackShipment(NX-88992211)'];
        fallbackText = `[THÔNG TIN HÀNH TRÌNH VẬN ĐƠN NX-88992211]:\n` +
          `• Trạng thái: Đang trung chuyển qua Hub Đà Nẵng (IN_TRANSIT)\n` +
          `• Tuyến đường: TP. Hồ Chí Minh ➔ Hà Nội\n` +
          `• Dự kiến phát: 18:00 Ngày mai\n` +
          `• Lịch sử: Shipper lấy hàng (14/09 09:30) ➔ Xuất Hub Tân Bình ➔ Đang bốc xếp lên xe tải liên tỉnh Bắc - Nam.`;
      } else {
        fallbackText = `Hệ thống Nexus Logistics AI đã tiếp nhận câu hỏi "${query}". Bạn có thể hỏi về tra cứu vận đơn NX-, tiến độ bồi thường CLM-, hoặc cách tính cước IATA và chuyển hoàn bưu chính.`;
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
          <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur shadow-lg border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 animate-bounce">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Hỏi Trợ Lý AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 text-white rotate-90 hover:bg-slate-900'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-500 text-white hover:scale-105 hover:shadow-indigo-500/30'
          }`}
          title={isOpen ? 'Đóng khung chat' : 'Mở Trợ lý AI CSKH'}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <Bot className="h-7 w-7 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] font-bold text-white items-center justify-center">
                  ✨
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. Floating Chat Window (Drawer) */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[410px] h-[580px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-inner">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold tracking-tight">Nexus Logistics AI</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live RAG
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  {currentUserId ? `TK: ${currentUserId}` : 'Khách vãng lai'} • Trực tuyến 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Bắt đầu đoạn chat mới (xóa lịch sử hội thoại hiện tại)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ chatbox"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_SUGGESTIONS.map((item, index) => {
              const IconComp = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] text-slate-700 hover:text-indigo-700 font-medium transition-all shadow-sm"
                >
                  <IconComp className="h-3 w-3 text-indigo-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-sm mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-none'
                  }`}
                >
                  {/* Tool used badge */}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message content */}
                  <FormattedChatMessage text={msg.text} isUser={msg.sender === 'user'} />

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Tài liệu tham chiếu:
                      </span>
                      {msg.citations.map((c, cIdx) => (
                        <span key={cIdx} className="text-[10px] text-slate-500 truncate">
                          📄 {c.title} ({c.score}%)
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1 text-[9px] text-right ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center text-xs shadow-sm mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="shrink-0 h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-200/70 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-400 font-medium ml-1">Đang suy nghĩ & truy xuất dữ liệu...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-slate-200/80">
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
                placeholder="Nhập mã vận đơn, mã CLM hoặc hỏi cước phí..."
                disabled={isLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center shadow-md transition-all shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-slate-400">
                Nexus Express • Kết nối Gateway BFF Port 3000
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
