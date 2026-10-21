import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { customerApiClient } from '../services/api/client';
import { authStore } from '../store/authStore';
import { appEnv } from '../utils/env';
import { colors, spacing, shadows, borderRadius } from '../theme';

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
  {
    icon: 'search-outline' as const,
    label: 'Tra cứu bưu gửi',
    query: 'Tra cứu hành trình đơn hàng gần nhất của tôi',
  },
  {
    icon: 'cube-outline' as const,
    label: 'Đơn tôi vừa gửi',
    query: 'đơn hàng tôi vừa gửi sao rồi',
  },
  {
    icon: 'car-outline' as const,
    label: 'Bưu tá qua lấy',
    query: 'Tôi muốn gửi một kiện hàng, bưu tá có qua lấy tận nơi không?',
  },
  {
    icon: 'calculator-outline' as const,
    label: 'Dự toán cước IATA',
    query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Đồng kiểm & Bồi thường',
    query: 'Chính sách đồng kiểm và bồi thường hàng dễ vỡ khi bể',
  },
  {
    icon: 'return-up-back-outline' as const,
    label: 'Cước hoàn bom hàng',
    query: 'Quy định thu cước chuyển hoàn khi người nhận từ chối nhận hàng',
  },
  {
    icon: 'call-outline' as const,
    label: 'Tổng đài viên CSKH',
    query: 'Tôi muốn gặp trực tiếp chuyên viên CSKH để giục giao gấp',
  },
];

interface FloatingAiChatModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FormattedMessageProps {
  text: string;
  isUser: boolean;
}

const RenderFormattedMessage: React.FC<FormattedMessageProps> = ({ text, isUser }) => {
  if (isUser) {
    return <Text style={[styles.messageText, styles.messageTextUser]}>{text}</Text>;
  }

  // 1. Tiền xử lý: dọn sạch hoàn toàn các dấu backticks thừa và dấu sao thô
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

  // Phân tách và hiển thị in đậm cho các đoạn có **in đậm**
  const renderInlineBold = (content: string, keyPrefix: string) => {
    const parts = content.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, pIdx) => {
      if (pIdx % 2 === 1) {
        return (
          <Text key={`${keyPrefix}-b-${pIdx}`} style={styles.boldTextBot}>
            {part}
          </Text>
        );
      }
      return (
        <Text key={`${keyPrefix}-t-${pIdx}`} style={styles.messageTextBot}>
          {part}
        </Text>
      );
    });
  };

  return (
    <View style={styles.formattedContainer}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={idx} style={styles.emptyLineSpacer} />;
        }

        // 1. Dòng gạch đầu dòng (• hoặc - hoặc *)
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const itemContent = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletTextWrapper}>
                {renderInlineBold(itemContent, `bullet-${idx}`)}
              </Text>
            </View>
          );
        }

        // 2. Dòng tiêu đề mục / Section có emoji hoặc viết hoa ngắn
        const isHeader = /^[📦📍🏷️👤💰🏢⏰🚚📋💡✅❌⚠️]/.test(trimmed) && trimmed.length < 80;
        if (isHeader) {
          return (
            <View key={idx} style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderText}>
                {renderInlineBold(trimmed, `hdr-${idx}`)}
              </Text>
            </View>
          );
        }

        // 3. Dòng thông thường
        return (
          <Text key={idx} style={[styles.messageText, styles.messageTextBot, styles.paragraphText]}>
            {renderInlineBold(trimmed, `p-${idx}`)}
          </Text>
        );
      })}
    </View>
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

export function FloatingAiChatModal({ visible, onClose }: FloatingAiChatModalProps): React.JSX.Element {
  const currentUser = authStore.getUser();
  const currentUserId = currentUser?.id || currentUser?.phone || null;

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Kính chào Quý khách!\nTôi là Chuyên Viên Điều Phối Bưu Chính Nexus Express trực tuyến 24/7.\nTôi sẵn sàng hỗ trợ Quý khách: Tra cứu hành trình bưu phẩm, đặt lịch bưu tá lấy hàng tận nơi, tính cước tuyến liên tỉnh và giải đáp chính sách bưu chính 24/7.',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Reset và phân lập đoạn chat khi đổi tài khoản
  useEffect(() => {
    setMessages([
      {
        id: 'welcome_' + (currentUserId || 'guest'),
        sender: 'bot',
        text: currentUserId
          ? `Kính chào Quý khách ${currentUser?.displayName || currentUser?.username || currentUser?.phone || ''}!\nTôi là Chuyên Viên Điều Phối Bưu Chính Nexus Express trực tuyến 24/7.\nTôi sẵn sàng hỗ trợ Quý khách: Tra cứu vận trình bưu phẩm thời gian thực, điều phối bưu tá qua lấy hàng tận nơi, báo giá cước IATA chuẩn xác và giải quyết hồ sơ bồi thường theo đúng Luật Bưu chính.`
          : 'Kính chào Quý khách!\nTôi là Chuyên Viên Điều Phối Bưu Chính Nexus Express trực tuyến 24/7.\nTôi sẵn sàng hỗ trợ Quý khách: Tra cứu hành trình bưu phẩm, đặt lịch bưu tá lấy hàng tận nơi, tính cước tuyến liên tỉnh và giải đáp chính sách bưu chính 24/7.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [currentUserId]);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  useEffect(() => {
    if (visible) {
      scrollToBottom();
    }
  }, [visible, messages]);

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
    scrollToBottom();

    try {
      // 1. Thử gọi trực tiếp Gateway BFF qua customerApiClient, nếu lỗi tự động gọi thẳng Chatbot Service (:3013)
      const currentUser = authStore.getUser();
      const requestPayload = {
        message: query,
        userId: currentUser?.id || currentUser?.phone,
        senderRole: 'CUSTOMER',
      };

      let answerData: any = null;
      try {
        answerData = await customerApiClient.request<any>('/api/v1/ai-assistant/message', {
          method: 'POST',
          body: requestPayload,
        });
      } catch {
        // Fallback gọi thẳng sang Chatbot Service hoặc Gateway candidates
        const devHost = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
        const candidateUrls = [
          `${appEnv.gatewayBaseUrl}/api/v1/ai-assistant/message`,
          `http://${devHost}:3000/api/v1/ai-assistant/message`,
          `http://${devHost}:3013/api/v1/chat/message`,
          `http://localhost:3000/api/v1/ai-assistant/message`,
          `http://localhost:3013/api/v1/chat/message`,
          `http://10.0.2.2:3000/api/v1/ai-assistant/message`,
          `http://10.0.2.2:3013/api/v1/chat/message`,
        ];

        for (const url of candidateUrls) {
          try {
            const fallbackResp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestPayload),
            });
            if (fallbackResp.ok) {
              answerData = await fallbackResp.json();
              if (answerData && answerData.answer) break;
            }
          } catch {
            // Thử candidate tiếp theo
          }
        }
      }

      if (answerData && answerData.answer) {
        const botMsg: ChatMessage = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: answerData.answer,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: answerData.toolsUsed,
          citations: answerData.citations,
          shipmentCards: answerData.shipmentCards,
          actionChips: answerData.actionChips,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('No answer received from server');
      }
    } catch {
      // 2. Fallback thông minh giống 100% Guest Web khi không có kết nối
      const isOrderConfirmation =
        /xác nhận tạo đơn|xac nhan tao don|thanh toán cước|thanh toan cuoc|thanh toán ngay|thanh toan ngay|đồng ý tạo đơn|dong y tao don|ok tạo đơn|ok tao don|tạo đơn luôn|tao don luon|chấp nhận tạo đơn/i.test(query) ||
        ((/xác nhận|xac nhan|đồng ý|dong y|ok|chốt|chot/i.test(query)) && (/đơn|don|tạo|tao|cước|cuoc/i.test(query)));

      const isOrderInfoProvided =
        !isOrderConfirmation &&
        (/mặc định|mac dinh|đã lưu|da luu|địa chỉ mới|dia chi moi|phan đăng lưu|phan dang luu|người gửi thanh toán|nguoi gui thanh toan|người nhận thanh toán|nguoi nhan thanh toan|người gửi trả|nguoi gui tra|người nhận trả|nguoi nhan tra/i.test(query) ||
          /\b(?:09|08|07|03)\d{8}\b/.test(query) ||
          (/gửi cho|gui cho/i.test(query) && /ở|o|hà nội|ha noi|sài gòn|sai gon|hcm/i.test(query)));

      const isClaimQuery = /CLM|khiếu nại|bồi thường|đền bù/i.test(query);
      const isDamageQuery = /hỏng|hư|bể|vỡ|móp|thiệt hại/i.test(query);
      const isReturnQuery = /hoàn|bom|phí hoàn/i.test(query);

      let fallbackText = '';
      let toolsUsed: string[] = [];

      if (isDamageQuery) {
        toolsUsed = ['getDamageAndClaimPolicy(Fragile Goods & Damage Settlement)'];
        fallbackText =
          `Quy trình xử lý sự cố hàng hư hỏng / bể vỡ theo Quy chuẩn Vận hành Nexus Logistics:\n\n` +
          `1. Khi nhận hàng: Quý khách đồng kiểm với bưu tá, yêu cầu lập Biên bản bất thường tại chỗ (chụp ảnh 4 góc và quay video bưu phẩm nứt vỡ) và từ chối nhận hàng (không thanh toán bất kỳ chi phí nào).\n` +
          `2. Hạn mức bồi thường:\n` +
          `• Gói Tiêu chuẩn: Bồi thường tối đa 04 lần cước vận chuyển (không quá 1.000.000 VNĐ/đơn theo Luật Bưu chính).\n` +
          `• Gói Bảo hiểm khai giá: Đền bù 100% giá trị tổn thất thực tế theo hóa đơn, trần tối đa 30.000.000 VNĐ/đơn.\n` +
          `3. Thời hạn giải quyết: Thẩm định trong 24h - 48h, hoàn tất chi trả bồi thường trong 03 - 05 ngày làm việc.\n\n` +
          `Quý khách có thể xem chi tiết tại Chính sách & Quy định dịch vụ của chúng tôi.`;
      } else if (isClaimQuery) {
        toolsUsed = ['trackClaimStatus(CLM-Policy)'];
        fallbackText =
          `Dạ chào bạn, quy trình tra cứu hồ sơ khiếu nại bồi thường Nexus Logistics:\n\n` +
          `• Để tra cứu tiến độ hồ sơ khiếu nại, bạn vui lòng gửi kèm mã hồ sơ khiếu nại (ví dụ: CLM-202609-001) hoặc mã vận đơn bưu gửi có phát sinh sự cố.\n` +
          `• Thời hạn thẩm định hồ sơ: 24h - 48h làm việc kể từ khi lập biên bản đồng kiểm.\n` +
          `• Hình thức giải ngân bồi thường: Chuyển khoản trực tiếp vào tài khoản ngân hàng hoặc cấn trừ kỳ đối soát gần nhất.\n\n` +
          `Nếu cần khiếu nại gấp, bạn có thể gọi hotline trực ban CSKH: 1900 6868 để được nhân viên thụ lý hồ sơ.`;
      } else if (isReturnQuery) {
        toolsUsed = ['calculateReturnFee(Rule-based Policy)'];
        fallbackText =
          `Theo Quy chuẩn Cước chuyển hoàn bưu gửi của Nexus Logistics:\n\n` +
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
      scrollToBottom();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatSheet}>
            {/* 1. Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.botIconWrapper}>
                  <Ionicons name="bus" size={20} color="#38BDF8" />
                </View>
                <View>
                  <View style={styles.titleRow}>
                    <Text style={styles.headerTitle}>Trung Tâm Điều Phối Nexus</Text>
                    <View style={styles.ragBadge}>
                      <Text style={styles.ragBadgeText}>Bưu cục 24/7</Text>
                    </View>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.headerSubtitle}>Trực tuyến 24/7 • Hotline 1900 6868</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Operational Linehaul SLA Banner */}
            <View style={styles.slaBanner}>
              <View style={styles.slaLeft}>
                <View style={styles.slaDot} />
                <Text style={styles.slaText}>
                  Tuyến Trục Quốc Gia: <Text style={styles.slaBold}>Bình thường</Text>
                </Text>
              </View>
              <Text style={styles.slaBadge}>SLA 99.4%</Text>
            </View>

            {/* 2. Quick Suggestions Chips */}
            <View style={styles.quickSuggestionsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickSuggestionsContent}
              >
                {QUICK_SUGGESTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionChip}
                    onPress={() => handleSendMessage(item.query)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={item.icon} size={13} color="#1D4ED8" />
                    <Text style={styles.suggestionText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. Message List */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.sender === 'user' ? styles.messageRowUser : styles.messageRowBot,
                  ]}
                >
                  {msg.sender === 'bot' && (
                    <View style={styles.botAvatarMini}>
                      <Ionicons name="bus" size={14} color="#38BDF8" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot,
                    ]}
                  >
                    {/* Tool Used Badge */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <View style={styles.toolsUsedRow}>
                        {msg.toolsUsed.map((tool, tIdx) => {
                          const friendlyLabel = formatToolBadge(tool);
                          if (!friendlyLabel) return null;
                          return (
                            <View key={tIdx} style={styles.toolBadge}>
                              <Ionicons name="shield-checkmark-outline" size={10} color="#1D4ED8" />
                              <Text style={styles.toolBadgeText}>{friendlyLabel}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Text Body */}
                    <RenderFormattedMessage text={msg.text} isUser={msg.sender === 'user'} />

                    {/* Interactive Shipment Cards */}
                    {msg.shipmentCards && msg.shipmentCards.length > 0 && (
                      <View style={styles.shipmentCardsContainer}>
                        <View style={styles.shipmentCardsHeader}>
                          <Text style={styles.shipmentCardsTitle}>DANH SÁCH BƯU KIỆN ({msg.shipmentCards.length})</Text>
                          <Text style={styles.shipmentCardsSub}>Chạm thẻ để tra cứu</Text>
                        </View>
                        {msg.shipmentCards.map((card, idx) => (
                          <TouchableOpacity
                            key={card.code || idx}
                            style={styles.shipmentCardItem}
                            onPress={() => handleSendMessage(`Tra cứu hành trình đơn ${card.code}`)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.shipmentCardRowTop}>
                              <Text style={styles.shipmentCardCode}>{card.code}</Text>
                              <View style={styles.shipmentCardBadge}>
                                <Text style={styles.shipmentCardBadgeText}>
                                   {card.statusText || card.status || 'Đang xử lý'}
                                </Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <Ionicons name="cube-outline" size={13} color="#0052CC" style={{ marginRight: 4 }} />
                              <Text style={styles.shipmentCardItemName} numberOfLines={1}>
                                {card.itemName || 'Kiện hàng'}
                              </Text>
                            </View>
                            <View style={styles.shipmentCardRowBottom}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                                <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
                                <Text style={styles.shipmentCardDest} numberOfLines={1}>
                                  {card.receiverCity || card.receiverName || 'Điểm giao'}
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.shipmentCardAction}>Tra cứu</Text>
                                <Ionicons name="arrow-forward" size={12} color="#0052CC" style={{ marginLeft: 2 }} />
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Link Quy định & Chính sách dịch vụ */}
                    {msg.sender === 'bot' && (
                      <View style={styles.policyRowContainer}>
                        <Ionicons name="shield-checkmark" size={13} color="#1D4ED8" style={{ marginRight: 4 }} />
                        <Text style={styles.policyRowText}>
                          Theo Quy chuẩn & Chính sách dịch vụ Nexus Logistics
                        </Text>
                      </View>
                    )}

                    {/* Interactive Action Chips */}
                    {msg.actionChips && msg.actionChips.length > 0 && (
                      <View style={styles.actionChipsContainer}>
                        {msg.actionChips.map((chip, cIdx) => (
                          <TouchableOpacity
                            key={cIdx}
                            style={styles.actionChipItem}
                            onPress={() => handleSendMessage(chip.query)}
                            disabled={isLoading}
                            activeOpacity={0.7}
                          >
                            <Ionicons name={(chip.icon as any) || 'flash-outline'} size={12} color="#1D4ED8" />
                            <Text style={styles.actionChipText}>{chip.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Timestamp */}
                    <Text
                      style={[
                        styles.timestampText,
                        msg.sender === 'user' ? styles.timestampUser : styles.timestampBot,
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                </View>
              ))}

              {isLoading && (
                <View style={[styles.messageRow, styles.messageRowBot]}>
                  <View style={styles.botAvatarMini}>
                    <Ionicons name="car-outline" size={14} color="#FFFFFF" />
                  </View>
                  <View style={[styles.messageBubble, styles.bubbleBot, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color="#1D4ED8" />
                    <Text style={styles.loadingText}>Đang kết nối bưu cục & tra cứu dữ liệu...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* 4. Footer Input */}
            <View style={styles.footerContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  placeholder="Nhập mã vận đơn, mã CLM hoặc hỏi cước..."
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                  multiline={false}
                  returnKeyType="send"
                  onSubmitEditing={() => handleSendMessage()}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.footerCaption}>Nexus Express • Hệ thống chuyển phát nhanh toàn quốc • Hotline: 1900 1234</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
    height: '92%',
  },
  chatSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ragBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  ragBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34D399',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  slaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  slaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  slaBold: {
    fontWeight: '700',
    color: '#E2E8F0',
  },
  slaBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quickSuggestionsWrapper: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  quickSuggestionsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    ...shadows.sm,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  botAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#1D4ED8',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
    ...shadows.sm,
  },
  toolsUsedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  messageTextBot: {
    color: '#1E293B',
  },
  formattedContainer: {
    gap: 2,
  },
  emptyLineSpacer: {
    height: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 2,
    marginVertical: 1.5,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1D4ED8',
    marginTop: 7,
  },
  bulletTextWrapper: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#1E293B',
  },
  boldTextBot: {
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeaderRow: {
    marginTop: 4,
    marginBottom: 2,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
  },
  paragraphText: {
    marginVertical: 1,
  },
  policyRowContainer: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyRowText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
    flex: 1,
  },
  timestampText: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampBot: {
    color: '#94A3B8',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  footerContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  footerCaption: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  shipmentCardsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  shipmentCardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shipmentCardsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  shipmentCardsSub: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  shipmentCardItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 9,
    gap: 4,
  },
  shipmentCardRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shipmentCardCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    fontSize: 12,
    color: '#0F172A',
  },
  shipmentCardBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shipmentCardBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  shipmentCardItemName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
  },
  shipmentCardRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  shipmentCardDest: {
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  shipmentCardAction: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  actionChipsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionChipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
});
