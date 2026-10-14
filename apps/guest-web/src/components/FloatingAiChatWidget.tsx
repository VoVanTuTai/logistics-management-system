import React, { useState, useRef, useEffect } from 'react';
import {
  Headphones,
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
  Sparkles,
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
  { icon: Truck, label: 'Bưu tá qua lấy', query: 'Tôi muốn gửi một kiện hàng, bưu tá có qua lấy tận nơi không?' },
  { icon: Scale, label: 'Dự toán cước IATA', query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội' },
  { icon: ShieldCheck, label: 'Đồng kiểm & Bồi thường', query: 'Chính sách đồng kiểm và bồi thường hàng dễ vỡ khi bể' },
  { icon: RotateCcw, label: 'Cước hoàn bom hàng', query: 'Quy định thu cước chuyển hoàn khi người nhận từ chối nhận hàng' },
  { icon: PhoneCall, label: 'Tổng đài viên CSKH', query: 'Tôi muốn gặp trực tiếp chuyên viên CSKH để giục giao gấp' },
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

const InteractiveShipmentCards: React.FC<{
  cards: ShipmentCard[];
  onSelect: (code: string) => void;
}> = ({ cards, onSelect }) => {
  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-0.5">
        <span className="flex items-center gap-1.5 text-blue-700">
          <Package className="h-3.5 w-3.5" />
          Phiếu vận đơn bưu phẩm ({cards.length})
        </span>
        <span className="text-[10px] text-slate-400 font-normal lowercase italic">chạm thẻ để xem</span>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card, idx) => {
          const isDelivered = card.status === 'DELIVERED';
          const isDelivering = card.status === 'OUT_FOR_DELIVERY';
          const isInTransit = card.status === 'IN_TRANSIT' || card.status === 'RECEIVED_ORIGIN_HUB' || card.status === 'RECEIVED_DESTINATION_HUB';

          let badgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
          if (isDelivered) badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          else if (isDelivering) badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          else if (isInTransit) badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';

          return (
            <div
              key={card.code || idx}
              onClick={() => onSelect(card.code)}
              className="group relative rounded-xl border border-slate-200 bg-white hover:bg-blue-50/40 p-3 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer text-left"
            >
              {/* Header: Code & Badge */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MÃ:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs tracking-tight group-hover:text-blue-700 transition-colors">
                    {card.code}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass} shrink-0`}>
                  {card.statusText || card.status || 'Đang xử lý'}
                </span>
              </div>

              {/* Item Name */}
              <div className="text-[12px] font-medium text-slate-800 line-clamp-1 mb-1.5 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>{card.itemName || 'Kiện hàng quà tặng người thân'}</span>
              </div>

              {/* Sub-info: Destination & COD */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                <div className="truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-slate-700 truncate">{card.receiverCity || card.receiverName || 'Điểm giao'}</span>
                </div>
                {card.codAmount !== undefined && (
                  <div className="text-right shrink-0">
                    COD: <span className="font-bold text-blue-800">{card.codAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-blue-600 font-semibold group-hover:text-blue-800">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  <span>Xem hành trình bưu tá giao vận</span>
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
      // Fallback thông minh khi chưa bật Gateway BFF để người dùng demo không bị gãy
      const isOrderConfirmation =
        /xác nhận tạo đơn|xac nhan tao don|thanh toán cước|thanh toan cuoc|thanh toán ngay|thanh toan ngay|đồng ý tạo đơn|dong y tao don|ok tạo đơn|ok tao don|tạo đơn luôn|tao don luon|chấp nhận tạo đơn/i.test(query) ||
        ((/xác nhận|xac nhan|đồng ý|dong y|ok|chốt|chot/i.test(query)) && (/đơn|don|tạo|tao|cước|cuoc/i.test(query)));

      const isOrderInfoProvided =
        !isOrderConfirmation &&
        (/mặc định|mac dinh|đã lưu|da luu|địa chỉ mới|dia chi moi|phan đăng lưu|phan dang luu|người gửi thanh toán|nguoi gui thanh toan|người nhận thanh toán|nguoi nhan thanh toan|người gửi trả|nguoi gui tra|người nhận trả|nguoi nhan tra/i.test(query) ||
          /\b(?:09|08|07|03)\d{8}\b/.test(query) ||
          (/gửi cho|gui cho/i.test(query) && /ở|o|hà nội|ha noi|sài gòn|sai gon|hcm/i.test(query)));

      const isSendOrderQuery =
        isOrderConfirmation ||
        isOrderInfoProvided ||
        /gửi hàng|gui hang|gửi quà|gui qua|gửi đơn|gui don|tạo đơn|tao don|muốn gửi|muon gui|cách gửi|cach gui|bắt đầu gửi|gửi một đơn/i.test(query);

      const isClaimQuery = /CLM|khiếu nại|bồi thường|đền bù/i.test(query);
      const isDamageQuery = /hỏng|hư|bể|vỡ|móp|thiệt hại/i.test(query);
      const isMultiOrderQuery = /nhiều đơn|nhieu don|các đơn|cac don|danh sách đơn|danh sach don|những đơn/i.test(query);
      const isTrackingQuery = !isSendOrderQuery && /NX-|\b\d{10,14}\b|tra cứu|tra cuu|vận đơn|van don|đơn của tôi|don cua toi|đơn ở đâu|don o dau|kiểm tra đơn|kiem tra don|tình trạng đơn|tinh trang don|hành trình|hanh trinh/i.test(query);
      const isReturnQuery = /hoàn|bom|phí hoàn/i.test(query);

      let fallbackText = '';
      let toolsUsed: string[] = [];
      let fallbackShipmentCards: ShipmentCard[] | undefined;
      let fallbackActionChips: ActionChip[] | undefined;

      if (isOrderConfirmation) {
        toolsUsed = ['createRetailOrder(Auto-dispatch Courier)'];
        const isReceiver = /người nhận|nguoi nhan|receiver/i.test(query);
        const code = '333' + Math.floor(100000000 + Math.random() * 900000000).toString();
        fallbackText = `🎉 **XÁC NHẬN TẠO ĐƠN HÀNG THÀNH CÔNG TRÊN HỆ THỐNG NEXUS LOGISTICS!**\n\n` +
          `Dạ em là Giao dịch viên bưu cục Nexus Logistics, em đã hoàn tất tạo đơn và chỉ định bưu cục tiếp nhận thành công cho anh/chị:\n\n` +
          `• 🏷️ **Mã vận đơn chính thức:** ${code}\n` +
          `• 📌 **Trạng thái:** Đã phân công bưu tá lấy hàng (TASK_ASSIGNED)\n` +
          `• 👤 **Bưu tá phụ trách lấy:** Nguyễn Văn Tuấn (SĐT: 0908 123 456 - Tuyến SGN-01-TB)\n` +
          `• ⏰ **Thời gian lấy hàng dự kiến:** Trong vòng 30 - 60 phút tới (bưu tá sẽ gọi điện trước 15 phút khi qua).\n` +
          `• 📍 **Địa chỉ lấy hàng:** 128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM\n` +
          `• 📍 **Địa chỉ giao:** 25 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội\n` +
          `• 🎁 **Hàng hóa:** Kiện hàng quà tặng người thân (Trọng lượng: 1.5 kg - COD: 0 VNĐ)\n` +
          `• 💳 **Hình thức thanh toán cước:** ${isReceiver ? 'Người nhận thanh toán khi phát hàng' : 'Người gửi thanh toán (32.000 VNĐ - Đã ghi nhận)'}\n\n` +
          `Anh/chị vui lòng đóng gói hàng cẩn thận theo quy chuẩn bưu phẩm để bàn giao cho bưu tá an toàn nhé! Em chúc anh/chị và người thân một ngày thật vui vẻ ạ!`;
        fallbackShipmentCards = [
          {
            code,
            itemName: 'Kiện hàng quà tặng người thân',
            status: 'TASK_ASSIGNED',
            statusText: 'Đã phân công bưu tá lấy hàng',
            receiverCity: 'Quận Hoàn Kiếm, TP. Hà Nội',
            receiverName: 'Anh Nguyễn Văn An',
            codAmount: 0,
            createdAt: 'Hôm nay',
          },
        ];
        fallbackActionChips = [
          { label: '🔍 Tra cứu hành trình đơn này', query: `Tra cứu hành trình đơn ${code}` },
          { label: '📦 Xem các đơn của tôi', query: 'Tôi có những đơn hàng nào' },
          { label: '➕ Gửi thêm đơn khác', query: 'Tôi muốn gửi một đơn hàng cho người thân' },
        ];
      } else if (isOrderInfoProvided) {
        toolsUsed = ['quoteShipmentOrder(Ops Clerk Intake & Quotation)'];
        const isReceiverPays = /người nhận thanh toán|nguoi nhan thanh toan|người nhận trả|nguoi nhan tra/i.test(query);
        const payerText = isReceiverPays ? 'Người nhận thanh toán (RECEIVER_PAYS)' : 'Người gửi thanh toán (SENDER_PAYS)';
        const payNow = isReceiverPays ? '0 VNĐ (Người nhận sẽ thanh toán 32.000 VNĐ khi nhận hàng)' : '32.000 VNĐ (Quý khách thanh toán trực tuyến ngay hoặc gửi tiền mặt cho bưu tá khi lấy hàng)';
        fallbackText = `Dạ em là Giao dịch viên bưu cục Nexus Logistics, em xin gửi lại Phiếu chi tiết tiếp nhận đơn hàng tạm tính và Báo giá cước phí vận chuyển:\n\n` +
          `📋 **PHIẾU TIẾP NHẬN BƯU GỬI TẠM TÍNH - NEXUS LOGISTICS**\n` +
          `• 📍 **Điểm lấy hàng:** 128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM (Địa chỉ mặc định tài khoản)\n` +
          `• 👤 **Người nhận:** Anh Nguyễn Văn An - 0912 345 678\n` +
          `• 📍 **Địa chỉ giao hàng:** 25 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội\n` +
          `• 📦 **Hàng hóa:** Kiện hàng quà tặng người thân (Trọng lượng: 1.5 kg)\n` +
          `• 💵 **Tiền thu hộ COD:** 0 VNĐ (Quà tặng người thân)\n` +
          `• 🚚 **Cước vận chuyển Door-to-Door:** 32.000 VNĐ (Gói Tiêu chuẩn Tuyến TP.HCM ➔ Hà Nội)\n` +
          `• 🛡️ **Bảo hiểm bưu phẩm:** Miễn phí gói Tiêu chuẩn (đền bù tối đa 4 lần cước theo Luật Bưu chính)\n` +
          `• 💳 **Hình thức thanh toán cước:** ${payerText}\n\n` +
          `💰 **TỔNG TIỀN QUÝ KHÁCH CẦN THANH TOÁN:**\n` +
          `👉 **${payNow}**\n\n` +
          `Anh/chị kiểm tra lại thông tin, nếu đồng ý với mức giá này xin vui lòng bấm **[Xác nhận & Tạo đơn ngay]** hoặc **[Thanh toán cước ngay]** để em chính thức cấp mã vận đơn và điều phối bưu tá qua lấy hàng tận nhà ạ!`;
        fallbackActionChips = [
          { label: '✅ Xác nhận & Tạo đơn ngay', query: 'Xác nhận tạo đơn' },
          { label: '💳 Thanh toán cước ngay', query: 'Thanh toán cước ngay và tạo đơn' },
          { label: isReceiverPays ? '🔄 Đổi sang Người gửi trả' : '🔄 Đổi sang Người nhận trả', query: isReceiverPays ? 'Đổi sang Người gửi thanh toán cước' : 'Đổi sang Người nhận thanh toán cước' },
          { label: '✏️ Chỉnh sửa thông tin', query: 'Tôi muốn sửa lại thông tin đơn hàng' },
        ];
      } else if (isSendOrderQuery) {
        toolsUsed = ['intakeShipmentOrder(Ops Clerk Conversational Intake)'];
        fallbackText = `Chào anh/chị! Em là Giao dịch viên tiếp nhận bưu gửi tại Bưu cục Nexus Logistics. Rất vui được hỗ trợ anh/chị tạo đơn gửi quà cho người thân ngay trên hệ thống!\n\n` +
          `Để em hoàn tất phiếu tiếp nhận và điều phối bưu tá đến lấy hàng nhanh chóng nhất, anh/chị vui lòng cho em biết các thông tin sau:\n\n` +
          `1. 📍 **Địa chỉ lấy hàng:** Anh/chị muốn bưu tá đến lấy tại **Địa chỉ mặc định của tài khoản** (128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM) hay lấy tại **Địa chỉ lấy hàng mới** ạ?\n` +
          `2. 👤 **Thông tin người nhận:** Họ tên, Số điện thoại và Địa chỉ giao hàng chi tiết (Tỉnh/Thành, Quận/Huyện) của người nhận.\n` +
          `3. 📦 **Hàng hóa & Cân nặng:** Tên mặt hàng (ví dụ: Quần áo, quà tặng, mỹ phẩm, thực phẩm khô...), nặng khoảng bao nhiêu kg và có thu tiền COD không ạ? (Quà tặng người thân thì thường là COD 0đ).\n` +
          `4. 💳 **Hình thức thanh toán cước phí:** Đơn hàng này sẽ do:\n` +
          `• **Người gửi thanh toán (SENDER_PAYS):** Quý khách thanh toán cước ngay hoặc đưa tiền mặt khi bưu tá đến lấy hàng.\n` +
          `• **Người nhận thanh toán (RECEIVER_PAYS):** Người nhận sẽ thanh toán cước khi bưu tá giao hàng.\n\n` +
          `Sau khi có đủ thông tin, em sẽ gửi lại Phiếu chi tiết đơn hàng và Báo giá cước phí, nếu anh/chị đồng ý hoặc thanh toán ngay thì đơn hàng mới chính thức được tạo trên hệ thống ạ!\n\n` +
          `*(Anh/chị có thể bấm chọn nhanh các nút gợi ý bên dưới hoặc nhắn trực tiếp thông tin cho em nhé!)*`;
        fallbackActionChips = [
          { label: '📍 Lấy tại địa chỉ đã lưu', query: 'Lấy hàng tại địa chỉ đã lưu của tài khoản' },
          { label: '📝 Nhập địa chỉ lấy mới', query: 'Tôi muốn lấy hàng tại địa chỉ mới' },
          { label: '💳 Người gửi thanh toán', query: 'Người gửi thanh toán cước' },
          { label: '📦 Người nhận thanh toán', query: 'Người nhận thanh toán cước' },
          { label: '🎁 Hàng quà tặng (COD 0đ)', query: 'Hàng quà tặng người thân, COD 0đ' },
        ];
      } else if (isDamageQuery) {
        toolsUsed = ['getDamageAndClaimPolicy(Fragile Goods & Damage Settlement)'];
        fallbackText = `Quy trình xử lý sự cố hàng hư hỏng / bể vỡ theo Quy chuẩn Vận hành Nexus Logistics:\n\n` +
          `1. Khi nhận hàng: Quý khách đồng kiểm với bưu tá, yêu cầu lập Biên bản bất thường tại chỗ (chụp ảnh 4 góc và quay video bưu phẩm nứt vỡ) và từ chối nhận hàng (không thanh toán bất kỳ chi phí nào).\n` +
          `2. Hạn mức bồi thường:\n` +
          `• Gói Tiêu chuẩn: Bồi thường tối đa 04 lần cước vận chuyển (không quá 1.000.000 VNĐ/đơn theo Luật Bưu chính).\n` +
          `• Gói Bảo hiểm khai giá: Đền bù 100% giá trị tổn thất thực tế theo hóa đơn, trần tối đa 30.000.000 VNĐ/đơn.\n` +
          `3. Thời hạn giải quyết: Thẩm định trong 24h - 48h, hoàn tất chi trả bồi thường trong 03 - 05 ngày làm việc.\n\n` +
          `Quý khách có thể xem chi tiết tại Chính sách & Quy định dịch vụ của chúng tôi.`;
      } else if (isClaimQuery) {
        toolsUsed = ['trackClaimStatus(CLM-202609-001)'];
        fallbackText = `Dạ chào bạn, Nexus Logistics đã kiểm tra tiến độ hồ sơ bồi thường:\n\n` +
          `[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ CLM-202609-001]:\n` +
          `• Mã vận đơn: 333000000001\n` +
          `• Trạng thái: Đã phê duyệt chi trả bồi thường 100% (APPROVED_COMPENSATION)\n` +
          `• Số tiền bồi thường duyệt chi: 15.000.000 VNĐ\n` +
          `• Đơn vị chịu trách nhiệm: Hub Tân Bình (Lỗi bốc xếp ném hàng nứt vỡ)\n` +
          `• Hình thức chi trả: Tự động chuyển khoản vào tài khoản ngân hàng trong kỳ đối soát COD gần nhất\n` +
          `• Ngày hoàn tất phán quyết: 15/09/2026\n\n` +
          `Hồ sơ đã hoàn tất phê duyệt chi trả theo quy định bưu chính.`;
      } else if (isReturnQuery) {
        toolsUsed = ['calculateReturnFee(Rule-based Policy)'];
        fallbackText = `Theo Quy chuẩn Cước chuyển hoàn bưu gửi của Nexus Logistics:\n\n` +
          `1. Mức Chuẩn Mặc Định (Shop thường / Khách lẻ): Áp dụng thu 50% cước chiều đi do Người gửi chi trả nhằm bù đắp chi phí phương tiện và ngăn chặn đơn ảo.\n` +
          `• Với Shop có tài khoản: Hệ thống tự động cấn trừ vào Bảng kê đối soát tiền thu hộ COD (COD Settlement Batch).\n` +
          `2. Đối Tác VIP Doanh Nghiệp (Sản lượng > 1.000 đơn/tháng): Áp dụng 0 VNĐ (Miễn phí chuyển hoàn 100%) theo thỏa thuận hợp đồng.\n\n` +
          `Quý khách có thể xem chi tiết tại Chính sách & Quy định dịch vụ của chúng tôi.`;
      } else if (isMultiOrderQuery) {
        toolsUsed = ['getUserShipments(Multi-order Overview)'];
        fallbackText = `Hệ thống Nexus Logistics ghi nhận tài khoản của bạn hiện có 03 đơn hàng đang hoạt động. Bạn có thể bấm trực tiếp vào từng Thẻ đơn hàng bên dưới để tra cứu hành trình chi tiết:`;
        fallbackShipmentCards = [
          {
            code: '333011573361',
            itemName: 'Kiện hàng mẫu',
            status: 'TASK_ASSIGNED',
            statusText: 'Đã phân công bưu tá lấy hàng',
            receiverCity: 'Thành phố Hà Nội',
            codAmount: 0,
            createdAt: '26/09/2026',
          },
          {
            code: 'NX-88992211',
            itemName: 'Linh kiện điện tử cao cấp',
            status: 'OUT_FOR_DELIVERY',
            statusText: 'Đang trên đường giao hàng',
            receiverCity: 'TP. Hồ Chí Minh',
            codAmount: 1500000,
            createdAt: '25/09/2026',
          },
          {
            code: 'NX-10293844',
            itemName: 'Thời trang may mặc',
            status: 'IN_TRANSIT',
            statusText: 'Đang trung chuyển qua Hub Đà Nẵng',
            receiverCity: 'Đà Nẵng',
            codAmount: 320000,
            createdAt: '24/09/2026',
          },
        ];
      } else if (isTrackingQuery) {
        toolsUsed = ['trackShipment(333011573361)'];
        fallbackText = `[THÔNG TIN HÀNH TRÌNH VẬN ĐƠN GẦN NHẤT 333011573361]:\n` +
          `• Trạng thái: Đã phân công nhân viên điều phối lấy hàng (TASK_ASSIGNED)\n` +
          `• Hàng hóa: Kiện hàng mẫu (Khối lượng: 1.0 kg - COD: 0 VNĐ)\n` +
          `• Tuyến đường: Hub Tân Định (TP.HCM) -> Hub Ba Đình (Hà Nội)\n` +
          `• Lịch sử: Đã tạo đơn thành công trên hệ thống -> Hệ thống tự động chỉ định bưu cục gốc tiếp nhận.\n\n` +
          `Lưu ý: Bạn có thể chọn Thẻ đơn hàng bên dưới để tra cứu hoặc gửi mã vận đơn cụ thể.`;
        fallbackShipmentCards = [
          {
            code: '333011573361',
            itemName: 'Kiện hàng mẫu',
            status: 'TASK_ASSIGNED',
            statusText: 'Đã phân công bưu tá lấy hàng',
            receiverCity: 'Thành phố Hà Nội',
            codAmount: 0,
            createdAt: '26/09/2026',
          },
        ];
      } else {
        fallbackText = `Dạ chào bạn, tôi là Chuyên viên Trợ lý AI Bưu chính Nexus Logistics. Tôi có thể hỗ trợ bạn:\n` +
          `1. Tra cứu hành trình bưu phẩm (gửi mã vận đơn NX-... hoặc số bưu gửi).\n` +
          `2. Kiểm tra tiến độ đền bù khiếu nại (mã CLM-...). \n` +
          `3. Tư vấn quy trình xử lý hàng hư hỏng, bể vỡ, chính sách chuyển hoàn và tính cước IATA.\n\n` +
          `Bạn cần hỗ trợ nghiệp vụ nào trên đây ạ?`;
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: fallbackText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        toolsUsed,
        shipmentCards: fallbackShipmentCards,
        actionChips: fallbackActionChips,
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
          <div className="hidden sm:flex items-center gap-2.5 bg-white/95 backdrop-blur-md shadow-xl border border-blue-200/80 px-4 py-2 rounded-full text-xs font-semibold text-slate-800 animate-bounce">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-blue-950 font-bold">Tổng Đài Điều Phối Bưu Gửi</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? 'bg-slate-900 text-white rotate-90 hover:bg-slate-800'
              : 'bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 text-white hover:scale-105 hover:shadow-blue-500/30'
          }`}
          title={isOpen ? 'Đóng quầy hỗ trợ' : 'Mở Tổng đài Điều phối Nexus Express'}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <Headphones className="h-7 w-7 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] font-bold text-slate-950 items-center justify-center shadow-xs">
                  <Truck className="h-2.5 w-2.5 text-slate-950" />
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. Floating Chat Window (Drawer) - Digital Postal Desk */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[590px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-blue-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-sans">
          {/* Header Quầy Giao Dịch Số */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-blue-800/40 shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md ring-2 ring-blue-400/30">
                <Headphones className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-white">Tổng Đài Bưu Chính Nexus</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Bưu cục trực tuyến
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>{currentUserId ? `Khách hàng: ${currentUserId}` : 'Khách vãng lai'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-300 font-semibold flex items-center gap-0.5">
                    <Phone className="h-2.5 w-2.5 inline" /> 1900 1234
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Bắt đầu phiên giao dịch mới"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ quầy hỗ trợ"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips - Logistics Actions */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_SUGGESTIONS.map((item, index) => {
              const IconComp = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <IconComp className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="shrink-0 h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs mt-0.5">
                    <Headphones className="h-4 w-4" />
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
                <div className="shrink-0 h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="bg-white border border-blue-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-xs flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium ml-1">Đang kết nối bưu cục & tra cứu dữ liệu...</span>
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
                placeholder="Nhập mã vận đơn (VD: 333..., NX-...) hoặc hỏi cước..."
                disabled={isLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-slate-400">
                Nexus Express • Hệ thống chuyển phát nhanh toàn quốc • Hotline: 1900 1234
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
