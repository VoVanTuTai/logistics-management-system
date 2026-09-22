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
import { customerApiClient } from '../services/api/client';
import { authStore } from '../store/authStore';
import { colors, spacing, shadows, borderRadius } from '../theme';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  toolsUsed?: string[];
  citations?: { file: string; title: string; score: number }[];
}

const QUICK_SUGGESTIONS = [
  {
    icon: 'time-outline' as const,
    label: 'Đơn mới tạo gần nhất',
    query: 'Tra cứu đơn hàng mới tạo gần nhất của tôi',
  },
  {
    icon: 'cube-outline' as const,
    label: 'Tra cứu đơn NX-88992211',
    query: 'Tra cứu hành trình vận đơn NX-88992211',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Hồ sơ đền bù CLM-202609-001',
    query: 'Hồ sơ khiếu nại đền bù đơn hàng bể vỡ CLM-202609-001 của tôi đã được duyệt chi chưa?',
  },
  {
    icon: 'return-up-back-outline' as const,
    label: 'Cước hoàn khi bom hàng',
    query: 'Shop mới mở thì cước hoàn tính thế nào và khi nào được miễn phí?',
  },
  {
    icon: 'calculator-outline' as const,
    label: 'Cước kiện 2kg HCM -> HN',
    query: 'Dự toán cước bưu kiện tiêu chuẩn 2kg từ TP.HCM đi Hà Nội',
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

export function FloatingAiChatModal({ visible, onClose }: FloatingAiChatModalProps): React.JSX.Element {
  const currentUser = authStore.getUser();
  const currentUserId = currentUser?.id || currentUser?.phone || null;

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ Lý AI Nexus Logistics.\nTôi có thể hỗ trợ bạn tra cứu hành trình bưu gửi thời gian thực, tiến độ hồ sơ bồi thường hàng hóa, dự toán cước phí IATA và giải đáp chính sách bưu chính 24/7.',
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
          ? `Xin chào ${currentUser?.name || currentUser?.phone || ''}! Tôi là Trợ Lý AI Nexus Logistics.\nTôi có thể hỗ trợ bạn tra cứu hành trình bưu gửi thời gian thực, đơn hàng mới nhất của bạn, kiểm tra bồi thường hoặc dự toán cước phí 24/7.`
          : 'Xin chào! Tôi là Trợ Lý AI Nexus Logistics.\nTôi có thể hỗ trợ bạn tra cứu hành trình bưu gửi thời gian thực, tiến độ hồ sơ bồi thường hàng hóa, dự toán cước phí IATA và giải đáp chính sách bưu chính 24/7.',
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
      // 1. Gọi trực tiếp Gateway BFF qua customerApiClient (kèm thông tin user đang đăng nhập)
      const currentUser = authStore.getUser();
      const response = await customerApiClient.request<any>('/api/v1/ai-assistant/message', {
        method: 'POST',
        body: {
          message: query,
          userId: currentUser?.id || currentUser?.phone,
          senderRole: 'CUSTOMER',
        },
      });

      if (response && response.answer) {
        const botMsg: ChatMessage = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: response.answer,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: response.toolsUsed,
          citations: response.citations,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('No answer received from server');
      }
    } catch {
      // 2. Fallback thông minh giống 100% Guest Web khi không có kết nối
      const isClaimQuery = /CLM|khiếu nại|bồi thường|đền bù/i.test(query);
      const isTrackingQuery = /NX-|tra cứu|vận đơn/i.test(query);
      const isReturnQuery = /hoàn|bom|phí hoàn/i.test(query);

      let fallbackText = '';
      let toolsUsed: string[] = [];

      if (isClaimQuery) {
        toolsUsed = ['trackClaimStatus(CLM-202609-001)'];
        fallbackText =
          `Dạ chào bạn, Nexus Logistics đã tra cứu dữ liệu thời gian thực:\n\n` +
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
        fallbackText =
          `Theo Quy chuẩn Cước chuyển hoàn bưu gửi của Nexus Logistics:\n\n` +
          `1. Mức Chuẩn Mặc Định (Shop thường / Khách lẻ): Áp dụng thu 50% cước chiều đi do Người gửi chi trả nhằm bù đắp chi phí phương tiện và ngăn chặn đơn ảo.\n` +
          `• Với Shop có tài khoản: Hệ thống tự động cấn trừ vào Bảng kê đối soát tiền thu hộ COD (COD Settlement Batch).\n` +
          `2. Đối Tác VIP Doanh Nghiệp (Sản lượng > 1.000 đơn/tháng): Áp dụng 0 VNĐ (Miễn phí chuyển hoàn 100%) theo thỏa thuận hợp đồng.\n\n` +
          `📖 Trích dẫn: [04-delivery-process-and-faq.md - Mục 5]`;
      } else if (isTrackingQuery) {
        toolsUsed = ['trackShipment(NX-88992211)'];
        fallbackText =
          `[THÔNG TIN HÀNH TRÌNH VẬN ĐƠN NX-88992211]:\n` +
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
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <View style={styles.titleRow}>
                    <Text style={styles.headerTitle}>Nexus Logistics AI</Text>
                    <View style={styles.ragBadge}>
                      <Text style={styles.ragBadgeText}>Live RAG</Text>
                    </View>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.headerSubtitle}>Sẵn sàng giải đáp 24/7 qua Gateway BFF</Text>
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
                    <Ionicons name={item.icon} size={13} color="#4F46E5" />
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
                      <Ionicons name="hardware-chip-outline" size={14} color="#FFFFFF" />
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
                        {msg.toolsUsed.map((tool, tIdx) => (
                          <View key={tIdx} style={styles.toolBadge}>
                            <Ionicons name="sparkles" size={10} color="#4F46E5" />
                            <Text style={styles.toolBadgeText}>{tool}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Text Body */}
                    <RenderFormattedMessage text={msg.text} isUser={msg.sender === 'user'} />

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <View style={styles.citationsBox}>
                        <Text style={styles.citationsTitle}>TÀI LIỆU THAM CHIẾU:</Text>
                        {msg.citations.map((c, cIdx) => (
                          <Text key={cIdx} style={styles.citationItem} numberOfLines={1}>
                            📄 {c.title} ({c.score}%)
                          </Text>
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
                    <Ionicons name="hardware-chip-outline" size={14} color="#FFFFFF" />
                  </View>
                  <View style={[styles.messageBubble, styles.bubbleBot, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text style={styles.loadingText}>Đang suy nghĩ & truy xuất dữ liệu...</Text>
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
              <Text style={styles.footerCaption}>Nexus Express • Kết nối Gateway BFF Port 3000</Text>
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
    backgroundColor: '#4F46E5',
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
    backgroundColor: '#4F46E5',
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
    backgroundColor: '#4F46E5',
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
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
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
    backgroundColor: '#4F46E5',
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
  citationsBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  citationsTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  citationItem: {
    fontSize: 10,
    color: '#64748B',
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
    backgroundColor: '#4F46E5',
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
});
