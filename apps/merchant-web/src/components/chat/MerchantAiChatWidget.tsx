import React, { useState, useRef, useEffect } from 'react';

export interface ShipmentCardDto {
  code: string;
  status?: string;
  statusText?: string;
  itemName?: string;
  receiverCity?: string;
  receiverName?: string;
  codAmount?: number;
  createdAt?: string;
}

export interface ActionChipDto {
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
  shipmentCards?: ShipmentCardDto[];
  actionChips?: ActionChipDto[];
}

interface MerchantAiChatWidgetProps {
  username?: string;
  shopName?: string;
  onSelectShipment?: (code: string) => void;
}

const MERCHANT_QUICK_SUGGESTIONS = [
  { label: '📦 Tra cứu đơn hàng', query: 'Tra cứu hành trình vận đơn bưu phẩm gần nhất của shop tôi' },
  { label: '📐 Tính cước quy đổi IATA', query: 'Kiện hàng nặng 3kg, kích thước 40x30x30 cm thì tính cước theo cân nào?' },
  { label: '🛡️ Bồi thường bể vỡ Điều 25', query: 'Nếu bưu phẩm bị bể vỡ do bưu tá mà không mua bảo hiểm thì đền bù ra sao theo Điều 25 Luật bưu chính?' },
  { label: '🔄 Quy định phí chuyển hoàn', query: 'Chính sách thu cước chuyển hoàn đối với Shop thường và Shop VIP là bao nhiêu?' },
  { label: '🧴 SOP đóng gói mỹ phẩm', query: 'Mặt hàng mỹ phẩm dạng chai lọ dung dịch, serum bắt buộc phải đóng gói như thế nào để được bồi thường?' },
];

const FormattedChatMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</div>;
  }

  // Pre-process markdown text
  const cleanText = text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`/g, '')
    .replace(/\*{3,}/g, '**')
    .replace(/(^|\n)\s*([•\-\*])\s*\n+(\s*)/g, '$1• ');

  const lines = cleanText.split('\n');

  const renderInlineFormatted = (content: string) => {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        elements.push(content.slice(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        elements.push(
          <a
            key={`link-${match.index}`}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0052cc', textDecoration: 'underline', fontWeight: 600 }}
          >
            {match[1]}
          </a>
        );
      } else if (match[3]) {
        elements.push(
          <strong key={`bold-${match.index}`} style={{ fontWeight: 700, color: '#0F172A' }}>
            {match[3]}
          </strong>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      elements.push(content.slice(lastIndex));
    }

    return elements;
  };

  return (
    <div style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#1E293B', wordBreak: 'break-word' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const itemText = trimmed.replace(/^[•\-]\s*/, '');
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: '#0052cc', fontWeight: 800 }}>•</span>
              <div style={{ flex: 1 }}>{renderInlineFormatted(itemText)}</div>
            </div>
          );
        }

        return (
          <p key={idx} style={{ margin: '0 0 6px 0' }}>
            {renderInlineFormatted(line)}
          </p>
        );
      })}
    </div>
  );
};

export const MerchantAiChatWidget: React.FC<MerchantAiChatWidgetProps> = ({
  username,
  shopName,
  onSelectShipment,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getStorageKey = () => `nexus_merchant_ai_chat_${username || 'shop'}`;

  const getWelcomeMessage = (): ChatMessage => ({
    id: `welcome_${Date.now()}`,
    sender: 'bot',
    text: `Chào ${shopName || username || 'Chủ Shop'}! 👋\n\nTôi là **Trợ Lý Bưu Chính AI** vận hành trên kiến trúc **Bộ Tứ Big Four** (Google • Alibaba • OpenAI • NVIDIA).\n\nTôi có thể hỗ trợ shop:\n• 📦 **Tra cứu vận đơn** & hành trình bưu phẩm thời gian thực.\n• 📐 **Tính cước quy đổi thể tích IATA** cho hàng cồng kềnh.\n• 🛡️ **Đối soát chính sách đền bù** theo Điều 25 Luật bưu chính & bảo hiểm toàn diện 100%.\n• 🔄 **Kiểm tra biểu phí chuyển hoàn** theo phân hạng tài khoản Shop.\n\nShop có thể gõ câu hỏi hoặc chọn các câu hỏi mẫu bên dưới nhé!`,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(getStorageKey());
      if (saved) return JSON.parse(saved);
    } catch {}
    return [getWelcomeMessage()];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(getStorageKey(), JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleResetChat = () => {
    const fresh = [getWelcomeMessage()];
    setMessages(fresh);
    try {
      sessionStorage.removeItem(getStorageKey());
    } catch {}
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const requestPayload = {
      message: text,
      conversationId: `conv_shop_${username || 'user'}_${Date.now()}`,
      senderRole: 'SHOP',
      userId: username || 'merchant_user',
    };

    const candidateUrls = [
      'http://localhost:3000/api/v1/ai-assistant/message',
      'http://localhost:3013/api/v1/chat/message',
      'http://127.0.0.1:3013/api/v1/chat/message',
    ];

    let responseData: any = null;

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(35000),
        });
        if (res.ok) {
          responseData = await res.json();
          break;
        }
      } catch {
        // try next fallback url
      }
    }

    if (responseData && responseData.answer) {
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: responseData.answer,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: responseData.toolsUsed,
        citations: responseData.citations,
        shipmentCards: responseData.shipmentCards,
        actionChips: responseData.actionChips,
      };
      setMessages((prev) => [...prev, botMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: 'Dạ hiện hệ thống đang bận hoặc đang kết nối lại với cụm máy chủ Big Four. Bạn vui lòng thử lại sau giây lát hoặc gửi lại câu hỏi nhé! 🙏',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setIsLoading(false);
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (BOTTOM-RIGHT) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #0052cc 0%, #1d4ed8 100%)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0, 82, 204, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 82, 204, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 82, 204, 0.35)';
          }}
          title="Mở Trợ lý AI Bưu chính Nexus"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              smart_toy
            </span>
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                border: '1.5px solid #FFFFFF',
              }}
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.01em' }}>Trợ Lý AI Bưu Chính</div>
            <div style={{ fontSize: '10.5px', opacity: 0.85, fontWeight: 500 }}>Bộ Tứ Big Four • 24/7</div>
          </div>
        </button>
      )}

      {/* 2. CHAT DRAWER / WINDOW POPUP */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '620px',
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 16px 48px rgba(15, 23, 42, 0.2), 0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F4C81 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38BDF8',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  smart_toy
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                    Trợ Lý Bưu Chính AI
                  </h3>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      backgroundColor: '#15803D',
                      color: '#DCFCE7',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    HMAS
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                  Google • Alibaba • OpenAI • NVIDIA
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleResetChat}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Làm mới cuộc trò chuyện"
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  refresh
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Thu nhỏ cửa sổ"
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>
          </div>

          {/* QUICK TOPIC SUGGESTION BAR */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            {MERCHANT_QUICK_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug.query)}
                disabled={isLoading}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                  e.currentTarget.style.borderColor = '#93C5FD';
                  e.currentTarget.style.color = '#0052cc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {sug.label}
              </button>
            ))}
          </div>

          {/* MESSAGE FEED AREA */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '86%',
                      padding: '12px 14px',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      backgroundColor: isUser ? '#0052cc' : '#FFFFFF',
                      color: isUser ? '#FFFFFF' : '#0F172A',
                      boxShadow: isUser
                        ? '0 2px 6px rgba(0, 82, 204, 0.2)'
                        : '0 2px 6px rgba(15, 23, 42, 0.05)',
                      border: isUser ? 'none' : '1px solid #E2E8F0',
                    }}
                  >
                    <FormattedChatMessage text={msg.text} isUser={isUser} />

                    {/* SHIPMENT CARDS IN BOT MESSAGE */}
                    {msg.shipmentCards && msg.shipmentCards.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {msg.shipmentCards.map((card, cIdx) => (
                          <div
                            key={cIdx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#F8FAFF',
                              border: '1px solid #D9DEF3',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: '12.5px',
                                    color: '#0052cc',
                                  }}
                                >
                                  {card.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(card.code)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                  }}
                                  title="Sao chép mã vận đơn"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                    {copiedCode === card.code ? 'check' : 'content_copy'}
                                  </span>
                                </button>
                              </div>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #BFDBFE',
                                }}
                              >
                                {card.statusText || card.status || 'Đang xử lý'}
                              </span>
                            </div>

                            {card.itemName && (
                              <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, marginBottom: '4px' }}>
                                {card.itemName}
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                              <span>Giao đến: {card.receiverCity || card.receiverName || 'Bưu cục'}</span>
                              {card.codAmount !== undefined && (
                                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                                  COD: {card.codAmount.toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>

                            {onSelectShipment && (
                              <button
                                type="button"
                                onClick={() => onSelectShipment(card.code)}
                                style={{
                                  width: '100%',
                                  marginTop: '8px',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  border: '1px solid #BFDBFE',
                                  backgroundColor: '#EFF6FF',
                                  color: '#0052cc',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                }}
                              >
                                <span>Xem chi tiết đơn này</span>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                  arrow_forward
                                </span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ACTION CHIPS IN BOT MESSAGE */}
                    {msg.actionChips && msg.actionChips.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {msg.actionChips.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleSendMessage(chip.query)}
                            disabled={isLoading}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #93C5FD',
                              color: '#0052cc',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* TOOLS USED & CITATIONS PILLS */}
                    {!isUser && (msg.toolsUsed?.length || msg.citations?.length) ? (
                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px dashed #E2E8F0',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          alignItems: 'center',
                        }}
                      >
                        {msg.toolsUsed?.map((t, idx) => (
                          <span
                            key={`tool-${idx}`}
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#059669',
                              backgroundColor: '#DCFCE7',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            ⚡ {t}
                          </span>
                        ))}
                        {msg.citations?.slice(0, 2).map((c, idx) => (
                          <span
                            key={`cit-${idx}`}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: '#475569',
                              backgroundColor: '#F1F5F9',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                            title={c.title}
                          >
                            📖 {c.title?.slice(0, 30)}...
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <span style={{ fontSize: '10px', color: '#94A3B8', padding: '0 4px' }}>
                    {msg.time}
                  </span>
                </div>
              );
            })}

            {/* LOADING STATE */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', width: 'fit-content' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052cc', animation: 'spin 1s linear infinite' }}>
                  progress_activity
                </span>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                  Đang phân tích qua cụm Big Four...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '10px 12px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập câu hỏi, mã bưu phẩm, hoặc tra cước..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0052cc')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: inputMessage.trim() && !isLoading ? '#0052cc' : '#E2E8F0',
                  color: inputMessage.trim() && !isLoading ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  send
                </span>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', padding: '0 4px' }}>
              <span>🛡️ Bảo vệ bởi NVIDIA Nemotron Safety Gatekeeper</span>
              <span>Nexus HMAS v2.0</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
