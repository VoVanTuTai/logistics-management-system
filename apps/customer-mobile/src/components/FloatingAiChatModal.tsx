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
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import {
  ALL_VIETNAMESE_PROVINCES,
  removeAccents,
  getWardsForProvinceName,
  resolveHubForAddress,
  parseWardAndDistrict,
  type ResolvedWard,
} from '../utils/vietnamProvincesData';
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
  orderFormRequested?: boolean;
  orderConfirmation?: any;
}

const QUICK_SUGGESTIONS = [
  {
    icon: 'add-circle-outline' as const,
    label: 'Tạo đơn ngay',
    query: 'Tôi muốn tạo đơn hàng',
  },
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

  // 1. Tiền xử lý: chuẩn hóa công thức toán LaTeX sang văn bản thuần túy, dọn sạch backticks và dấu sao thô
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

export interface OrderFormDataMobile {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderWard: string;
  senderDistrict?: string;
  senderHubCode?: string;
  senderHubName?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverWard: string;
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

const OrderCreationFormMobile: React.FC<{
  defaultSenderName?: string;
  defaultSenderPhone?: string;
  onSubmit: (data: OrderFormDataMobile) => void;
  onCancel: () => void;
  disabled?: boolean;
}> = ({ defaultSenderName = '', defaultSenderPhone = '', onSubmit, onCancel, disabled = false }) => {
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [senderPhone, setSenderPhone] = useState(defaultSenderPhone);
  const [senderCity, setSenderCity] = useState('TP. Hồ Chí Minh');
  const [senderWard, setSenderWard] = useState('Phường An Nhơn (Quận Gò Vấp)');
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

  // Quản lý modal chọn Tỉnh/Thành hoặc Phường/Xã
  const [activePicker, setActivePicker] = useState<
    'SENDER_PROVINCE' | 'RECEIVER_PROVINCE' | 'SENDER_WARD' | 'RECEIVER_WARD' | null
  >(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Xác định Bưu cục điều phối lấy hàng và bưu cục phát
  const senderHub = resolveHubForAddress(senderCity, senderWard);
  const receiverHub = resolveHubForAddress(receiverCity, receiverWard);

  const handleSubmit = () => {
    if (!senderName.trim() || !senderPhone.trim()) {
      setErrorMsg('Vui lòng điền họ tên và SĐT người gửi.');
      return;
    }
    if (!senderWard.trim()) {
      setErrorMsg('Vui lòng chọn Phường / Xã người gửi để bưu cục điều phối bưu tá.');
      return;
    }
    if (!senderAddress.trim()) {
      setErrorMsg('Vui lòng nhập số nhà, tên đường người gửi.');
      return;
    }
    if (!receiverName.trim() || !receiverPhone.trim()) {
      setErrorMsg('Vui lòng điền họ tên và SĐT người nhận.');
      return;
    }
    if (!receiverWard.trim()) {
      setErrorMsg('Vui lòng chọn Phường / Xã người nhận để gán bưu cục giao hàng.');
      return;
    }
    if (!receiverAddress.trim()) {
      setErrorMsg('Vui lòng nhập số nhà, tên đường người nhận.');
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

    const senderParsed = parseWardAndDistrict(senderWard);
    const receiverParsed = parseWardAndDistrict(receiverWard);

    onSubmit({
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderAddress: senderAddress.trim(),
      senderCity,
      senderWard,
      senderDistrict: senderParsed.district,
      senderHubCode: senderHub.hubCode,
      senderHubName: senderHub.hubName,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAddress: receiverAddress.trim(),
      receiverCity,
      receiverWard,
      receiverDistrict: receiverParsed.district,
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
      <View style={formStyles.submittedCard}>
        <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
        <Text style={formStyles.submittedText}>Đã gửi thông tin đơn hàng - Đang chờ xác nhận</Text>
      </View>
    );
  }

  // 1. Màn hình chọn Tỉnh / Thành phố (trong 63 tỉnh)
  if (activePicker === 'SENDER_PROVINCE' || activePicker === 'RECEIVER_PROVINCE') {
    const isSenderPicker = activePicker === 'SENDER_PROVINCE';
    const currentSelected = isSenderPicker ? senderCity : receiverCity;
    const title = isSenderPicker ? 'Chọn Tỉnh / Thành người gửi' : 'Chọn Tỉnh / Thành người nhận';

    const filteredProvinces = ALL_VIETNAMESE_PROVINCES.filter((p) => {
      if (!pickerSearch.trim()) return true;
      const cleanP = removeAccents(p);
      const cleanQ = removeAccents(pickerSearch.trim());
      return cleanP.includes(cleanQ) || p.toLowerCase().includes(pickerSearch.trim().toLowerCase());
    });

    const handleSelectProvince = (prov: string) => {
      const wards = getWardsForProvinceName(prov);
      const defaultWard = wards[0]?.name || '';
      if (isSenderPicker) {
        setSenderCity(prov);
        setSenderWard(defaultWard);
      } else {
        setReceiverCity(prov);
        setReceiverWard(defaultWard);
      }
      setActivePicker(null);
      setPickerSearch('');
    };

    return (
      <View style={formStyles.pickerContainer}>
        <View style={formStyles.pickerHeader}>
          <TouchableOpacity
            style={formStyles.pickerBackBtn}
            onPress={() => {
              setActivePicker(null);
              setPickerSearch('');
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#1D4ED8" />
            <Text style={formStyles.pickerBackText}>Quay lại</Text>
          </TouchableOpacity>
          <Text style={formStyles.pickerTitle}>{title}</Text>
        </View>

        <View style={formStyles.pickerSearchBox}>
          <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={formStyles.pickerSearchInput}
            placeholder="Tìm theo tên tỉnh thành (vd: Hà Nội, Đồng Nai...)"
            placeholderTextColor="#94A3B8"
            value={pickerSearch}
            onChangeText={setPickerSearch}
            autoFocus
          />
          {pickerSearch ? (
            <TouchableOpacity onPress={() => setPickerSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {!pickerSearch && (
          <View style={formStyles.pickerQuickWrapper}>
            <Text style={formStyles.pickerQuickLabel}>Phổ biến:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={formStyles.pickerQuickRow}>
              {['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai', 'Hải Phòng', 'Cần Thơ'].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[formStyles.pickerQuickPill, currentSelected === city && formStyles.pickerQuickPillActive]}
                  onPress={() => handleSelectProvince(city)}
                >
                  <Text style={[formStyles.pickerQuickPillText, currentSelected === city && formStyles.pickerQuickPillTextActive]}>
                    {city === 'TP. Hồ Chí Minh' ? 'TP.HCM' : city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={formStyles.pickerCountText}>Toàn bộ 63 Tỉnh / Thành phố ({filteredProvinces.length})</Text>

        <ScrollView style={formStyles.pickerList} keyboardShouldPersistTaps="handled">
          {filteredProvinces.map((prov) => {
            const isSelected = currentSelected === prov;
            return (
              <TouchableOpacity
                key={prov}
                style={[formStyles.pickerItem, isSelected && formStyles.pickerItemActive]}
                onPress={() => handleSelectProvince(prov)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? '#1D4ED8' : '#94A3B8'}
                  style={{ marginRight: 10 }}
                />
                <Text style={[formStyles.pickerItemText, isSelected && formStyles.pickerItemTextActive]}>
                  {prov}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color="#1D4ED8" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // 2. Màn hình chọn Phường / Xã (kèm Quận / Huyện) theo Tỉnh đã chọn
  if (activePicker === 'SENDER_WARD' || activePicker === 'RECEIVER_WARD') {
    const isSender = activePicker === 'SENDER_WARD';
    const targetCity = isSender ? senderCity : receiverCity;
    const currentSelected = isSender ? senderWard : receiverWard;
    const title = isSender ? `Chọn Phường / Xã gửi (${targetCity})` : `Chọn Phường / Xã nhận (${targetCity})`;

    const allWards = getWardsForProvinceName(targetCity);
    const filteredWards = allWards.filter((w) => {
      if (!pickerSearch.trim()) return true;
      const cleanW = removeAccents(w.name);
      const cleanQ = removeAccents(pickerSearch.trim());
      return cleanW.includes(cleanQ) || w.name.toLowerCase().includes(pickerSearch.trim().toLowerCase());
    });

    const handleSelectWard = (w: ResolvedWard) => {
      if (isSender) {
        setSenderWard(w.name);
      } else {
        setReceiverWard(w.name);
      }
      setActivePicker(null);
      setPickerSearch('');
    };

    return (
      <View style={formStyles.pickerContainer}>
        <View style={formStyles.pickerHeader}>
          <TouchableOpacity
            style={formStyles.pickerBackBtn}
            onPress={() => {
              setActivePicker(null);
              setPickerSearch('');
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#1D4ED8" />
            <Text style={formStyles.pickerBackText}>Quay lại</Text>
          </TouchableOpacity>
          <Text style={formStyles.pickerTitle} numberOfLines={1}>{title}</Text>
        </View>

        <View style={formStyles.pickerSearchBox}>
          <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={formStyles.pickerSearchInput}
            placeholder="Tìm theo tên phường, xã, quận, huyện..."
            placeholderTextColor="#94A3B8"
            value={pickerSearch}
            onChangeText={setPickerSearch}
            autoFocus
          />
          {pickerSearch ? (
            <TouchableOpacity onPress={() => setPickerSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={formStyles.pickerCountText}>Danh sách Phường / Xã ({filteredWards.length})</Text>

        <ScrollView style={formStyles.pickerList} keyboardShouldPersistTaps="handled">
          {filteredWards.map((w) => {
            const isSelected = currentSelected === w.name;
            return (
              <TouchableOpacity
                key={w.name}
                style={[formStyles.pickerItem, isSelected && formStyles.pickerItemActive]}
                onPress={() => handleSelectWard(w)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSelected ? '#1D4ED8' : '#94A3B8'}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[formStyles.pickerItemText, isSelected && formStyles.pickerItemTextActive]}>
                    {w.wardName}
                  </Text>
                  {w.district && (
                    <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                      {w.district}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color="#1D4ED8" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={formStyles.container}>
      <View style={formStyles.headerRow}>
        <View>
          <Text style={formStyles.headerTitle}>Biểu mẫu tạo đơn hàng</Text>
          <Text style={formStyles.headerSub}>Bưu tá qua lấy tận nơi • Toàn quốc</Text>
        </View>
        <View style={formStyles.stdBadge}>
          <Text style={formStyles.stdBadgeText}>Chuẩn Carrier</Text>
        </View>
      </View>

      {/* 1. NGƯỜI GỬI */}
      <Text style={formStyles.sectionTitle}>1. THÔNG TIN NGƯỜI GỬI (ĐỊA CHỈ LẤY HÀNG)</Text>
      <View style={formStyles.inputRow}>
        <TextInput
          style={[formStyles.input, { flex: 1, marginRight: 6 }]}
          placeholder="Họ tên người gửi *"
          placeholderTextColor="#94A3B8"
          value={senderName}
          onChangeText={setSenderName}
        />
        <TextInput
          style={[formStyles.input, { flex: 1 }]}
          placeholder="SĐT người gửi *"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          value={senderPhone}
          onChangeText={setSenderPhone}
        />
      </View>

      {/* Chọn Tỉnh/Thành gửi */}
      <View style={formStyles.provinceSelectorBox}>
        <Text style={formStyles.labelTiny}>Tỉnh / Thành phố gửi *:</Text>
        <TouchableOpacity
          style={formStyles.provinceSelectBtn}
          onPress={() => {
            setActivePicker('SENDER_PROVINCE');
            setPickerSearch('');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
          <Text style={formStyles.provinceSelectText}>{senderCity}</Text>
          <View style={formStyles.provinceChangeBadge}>
            <Text style={formStyles.provinceChangeText}>Đổi trong 63 tỉnh ▾</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick selection pills người gửi */}
      <View style={formStyles.citySelectorRow}>
        {['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương'].map((city) => (
          <TouchableOpacity
            key={city}
            style={[formStyles.cityPill, senderCity === city && formStyles.cityPillActive]}
            onPress={() => {
              setSenderCity(city);
              const wards = getWardsForProvinceName(city);
              setSenderWard(wards[0]?.name || '');
            }}
          >
            <Text style={[formStyles.cityPillText, senderCity === city && formStyles.cityPillTextActive]}>
              {city === 'TP. Hồ Chí Minh' ? 'TP.HCM' : city}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phường / Xã gửi - Hiện khi đã có tỉnh */}
      <View style={formStyles.provinceSelectorBox}>
        <Text style={formStyles.labelTiny}>Phường / Xã & Quận / Huyện gửi * (điều phối bưu tá lấy hàng):</Text>
        <TouchableOpacity
          style={formStyles.provinceSelectBtn}
          onPress={() => {
            setActivePicker('SENDER_WARD');
            setPickerSearch('');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="business" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
          <Text style={[formStyles.provinceSelectText, !senderWard && formStyles.wardSelectPlaceholder]} numberOfLines={1}>
            {senderWard || 'Chạm để chọn Phường / Xã ▾'}
          </Text>
          <View style={formStyles.provinceChangeBadge}>
            <Text style={formStyles.provinceChangeText}>Chọn ▾</Text>
          </View>
        </TouchableOpacity>
        {senderHub && (
          <View style={formStyles.hubBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#15803D" style={{ marginRight: 4 }} />
            <Text style={formStyles.hubBadgeText}>
              Bưu cục điều phối lấy hàng: [{senderHub.hubCode}] {senderHub.hubName}
            </Text>
          </View>
        )}
      </View>

      <TextInput
        style={[formStyles.input, { marginTop: 6 }]}
        placeholder="Số nhà, tên đường (Địa chỉ nhà lấy hàng) *"
        placeholderTextColor="#94A3B8"
        value={senderAddress}
        onChangeText={setSenderAddress}
      />

      {/* 2. NGƯỜI NHẬN */}
      <Text style={[formStyles.sectionTitle, { marginTop: 12 }]}>2. THÔNG TIN NGƯỜI NHẬN (ĐỊA CHỈ GIAO HÀNG)</Text>
      <View style={formStyles.inputRow}>
        <TextInput
          style={[formStyles.input, { flex: 1, marginRight: 6 }]}
          placeholder="Họ tên người nhận *"
          placeholderTextColor="#94A3B8"
          value={receiverName}
          onChangeText={setReceiverName}
        />
        <TextInput
          style={[formStyles.input, { flex: 1 }]}
          placeholder="SĐT người nhận *"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          value={receiverPhone}
          onChangeText={setReceiverPhone}
        />
      </View>

      {/* Chọn Tỉnh/Thành nhận */}
      <View style={formStyles.provinceSelectorBox}>
        <Text style={formStyles.labelTiny}>Tỉnh / Thành phố nhận *:</Text>
        <TouchableOpacity
          style={formStyles.provinceSelectBtn}
          onPress={() => {
            setActivePicker('RECEIVER_PROVINCE');
            setPickerSearch('');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
          <Text style={formStyles.provinceSelectText}>{receiverCity}</Text>
          <View style={formStyles.provinceChangeBadge}>
            <Text style={formStyles.provinceChangeText}>Đổi trong 63 tỉnh ▾</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick selection pills người nhận */}
      <View style={formStyles.citySelectorRow}>
        {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'].map((city) => (
          <TouchableOpacity
            key={city}
            style={[formStyles.cityPill, receiverCity === city && formStyles.cityPillActive]}
            onPress={() => {
              setReceiverCity(city);
              const wards = getWardsForProvinceName(city);
              setReceiverWard(wards[0]?.name || '');
            }}
          >
            <Text style={[formStyles.cityPillText, receiverCity === city && formStyles.cityPillTextActive]}>
              {city === 'TP. Hồ Chí Minh' ? 'TP.HCM' : city}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phường / Xã nhận - Hiện khi đã có tỉnh */}
      <View style={formStyles.provinceSelectorBox}>
        <Text style={formStyles.labelTiny}>Phường / Xã & Quận / Huyện nhận * (phục vụ phát hàng):</Text>
        <TouchableOpacity
          style={formStyles.provinceSelectBtn}
          onPress={() => {
            setActivePicker('RECEIVER_WARD');
            setPickerSearch('');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="business" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
          <Text style={[formStyles.provinceSelectText, !receiverWard && formStyles.wardSelectPlaceholder]} numberOfLines={1}>
            {receiverWard || 'Chạm để chọn Phường / Xã ▾'}
          </Text>
          <View style={formStyles.provinceChangeBadge}>
            <Text style={formStyles.provinceChangeText}>Chọn ▾</Text>
          </View>
        </TouchableOpacity>
        {receiverHub && (
          <View style={formStyles.hubBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#15803D" style={{ marginRight: 4 }} />
            <Text style={formStyles.hubBadgeText}>
              Bưu cục phát: [{receiverHub.hubCode}] {receiverHub.hubName}
            </Text>
          </View>
        )}
      </View>

      <TextInput
        style={[formStyles.input, { marginTop: 6 }]}
        placeholder="Số nhà, tên đường (Địa chỉ nhà giao hàng) *"
        placeholderTextColor="#94A3B8"
        value={receiverAddress}
        onChangeText={setReceiverAddress}
      />

      {/* 3. BƯU PHẨM & CƯỚC */}
      <Text style={[formStyles.sectionTitle, { marginTop: 12 }]}>3. BƯU PHẨM & CƯỚC VẬN CHUYỂN</Text>
      <TextInput
        style={formStyles.input}
        placeholder="Tên hàng hóa (ví dụ: Quần áo, tài liệu, đồ gia dụng...) *"
        placeholderTextColor="#94A3B8"
        value={itemName}
        onChangeText={setItemName}
      />

      <View style={[formStyles.inputRow, { marginTop: 6 }]}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={formStyles.labelTiny}>Khối lượng (kg) *</Text>
          <TextInput
            style={formStyles.input}
            placeholder="1"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={weightKg}
            onChangeText={setWeightKg}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={formStyles.labelTiny}>Tiền thu hộ COD (đ)</Text>
          <TextInput
            style={formStyles.input}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={codAmount}
            onChangeText={setCodAmount}
          />
        </View>
      </View>

      {/* Kích thước Dài x Rộng x Cao (cm) & Quy đổi thể tích IATA */}
      <View style={{ marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={formStyles.labelTiny}>Kích thước (Dài x Rộng x Cao cm) *</Text>
          <Text style={{ fontSize: 9, color: '#94A3B8' }}>IATA: D x R x C / 6000</Text>
        </View>
        <View style={formStyles.inputRowThree}>
          <View style={{ flex: 1, marginRight: 4 }}>
            <TextInput
              style={[formStyles.input, { textAlign: 'center' }]}
              placeholder="Dài (cm)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={lengthCm}
              onChangeText={setLengthCm}
            />
          </View>
          <View style={{ flex: 1, marginRight: 4 }}>
            <TextInput
              style={[formStyles.input, { textAlign: 'center' }]}
              placeholder="Rộng (cm)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={widthCm}
              onChangeText={setWidthCm}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[formStyles.input, { textAlign: 'center' }]}
              placeholder="Cao (cm)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCm}
            />
          </View>
        </View>

        {/* Volumetric Weight & Bulky/Ceiling badge */}
        <View style={formStyles.volumetricBox}>
          <Text style={formStyles.volumetricText}>
            Quy đổi IATA: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{volW} kg</Text>
            {isVolApplied ? ' (Tính cước)' : ''}
          </Text>
          <Text style={formStyles.chargeableText}>
            Tính cước: {chargeableW} kg
          </Text>
        </View>
        {isBulky && !isOverLimit && (
          <View style={formStyles.bulkyBadge}>
            <Ionicons name="warning-outline" size={12} color="#92400E" style={{ marginRight: 4 }} />
            <Text style={formStyles.bulkyBadgeText}>Hàng cồng kềnh - Cần điều phối xe tải</Text>
          </View>
        )}
        {isOverLimit && (
          <View style={formStyles.overLimitBadge}>
            <Ionicons name="alert-circle-outline" size={12} color="#BE123C" style={{ marginRight: 4 }} />
            <Text style={formStyles.overLimitBadgeText}>Vượt trần bưu cục (&gt;70kg hoặc cạnh &gt;150cm)</Text>
          </View>
        )}
      </View>

      <TextInput
        style={[formStyles.input, { marginTop: 6 }]}
        placeholder="Ghi chú giao hàng (ví dụ: Cho xem hàng, gọi trước khi giao)"
        placeholderTextColor="#94A3B8"
        value={notes}
        onChangeText={setNotes}
      />

      <Text style={[formStyles.labelTiny, { marginTop: 8 }]}>Bên thanh toán cước vận chuyển:</Text>
      <View style={formStyles.payerRow}>
        <TouchableOpacity
          style={[formStyles.payerBtn, payer === 'RECEIVER' && formStyles.payerBtnActive]}
          onPress={() => setPayer('RECEIVER')}
        >
          <Text style={[formStyles.payerText, payer === 'RECEIVER' && formStyles.payerTextActive]}>
            Người nhận trả khi nhận
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[formStyles.payerBtn, payer === 'SENDER' && formStyles.payerBtnActive]}
          onPress={() => setPayer('SENDER')}
        >
          <Text style={[formStyles.payerText, payer === 'SENDER' && formStyles.payerTextActive]}>
            Người gửi thanh toán khi gửi
          </Text>
        </TouchableOpacity>
      </View>

      {errorMsg ? <Text style={formStyles.errorText}>{errorMsg}</Text> : null}

      <View style={formStyles.btnRow}>
        <TouchableOpacity style={formStyles.submitBtn} onPress={handleSubmit}>
          <Text style={formStyles.submitBtnText}>Xác nhận gửi thông tin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={formStyles.cancelBtn} onPress={onCancel}>
          <Text style={formStyles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const formStyles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '500',
  },
  stdBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  stdBadgeText: {
    fontSize: 9,
    color: '#4338CA',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputRowThree: {
    flexDirection: 'row',
  },
  volumetricBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  volumetricText: {
    fontSize: 10,
    color: '#64748B',
  },
  chargeableText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  bulkyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  bulkyBadgeText: {
    fontSize: 9,
    color: '#92400E',
    fontWeight: '600',
  },
  overLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  overLimitBadgeText: {
    fontSize: 9,
    color: '#BE123C',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
  },
  provinceSelectorBox: {
    marginTop: 6,
  },
  provinceSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 2,
  },
  provinceSelectText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  provinceChangeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  provinceChangeText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '600',
  },
  citySelectorRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 4,
    flexWrap: 'wrap',
  },
  cityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cityPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  cityPillText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  cityPillTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  hubBadgeText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '600',
  },
  wardSelectPlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  emptyGuideText: {
    fontSize: 11,
    color: '#D97706',
    fontStyle: 'italic',
    marginTop: 4,
  },
  labelTiny: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  payerRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  payerBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  payerBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  payerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  payerTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  errorText: {
    color: '#E11D48',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  // Style cho màn hình chọn 63 Tỉnh/Thành
  pickerContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minHeight: 340,
    maxHeight: 440,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  pickerBackText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
    marginLeft: 4,
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    paddingVertical: 2,
  },
  pickerQuickWrapper: {
    marginBottom: 8,
  },
  pickerQuickLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  pickerQuickRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pickerQuickPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerQuickPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  pickerQuickPillText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  pickerQuickPillTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  pickerCountText: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  pickerList: {
    maxHeight: 240,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  pickerItemText: {
    fontSize: 12,
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  submittedCard: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  submittedText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  confirmationCard: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  confHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  confBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },
  confBody: {
    gap: 2,
  },
  confLine: {
    fontSize: 11,
    color: '#475569',
  },
  confBold: {
    fontWeight: '600',
    color: '#0F172A',
  },
  confFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  confFee: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  confBtnRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  confConfirmBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  confConfirmText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  confCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
  },
  confCancelText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
});

export function FloatingAiChatModal({ visible, onClose }: FloatingAiChatModalProps): React.JSX.Element {
  const currentUser = authStore.getUser();
  const currentUserId = currentUser?.id || currentUser?.phone || null;

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Chào Quý khách. Tôi là Trợ lý AI của Nexus Logistics. Tôi có thể hỗ trợ Quý khách giải đáp dịch vụ bưu chính, dự toán cước hoặc tạo đơn gửi hàng. Quý khách cần hỗ trợ thông tin gì ạ?',
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
          ? `Chào Quý khách ${currentUser?.displayName || currentUser?.username || currentUser?.phone || ''}. Tôi là Trợ lý AI của Nexus Logistics. Tôi có thể hỗ trợ Quý khách giải đáp dịch vụ bưu chính, dự toán cước hoặc tạo đơn gửi hàng. Quý khách cần hỗ trợ thông tin gì ạ?`
          : 'Chào Quý khách. Tôi là Trợ lý AI của Nexus Logistics. Tôi có thể hỗ trợ Quý khách giải đáp dịch vụ bưu chính, dự toán cước hoặc tạo đơn gửi hàng. Quý khách cần hỗ trợ thông tin gì ạ?',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [currentUserId]);

  const scrollViewRef = useRef<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const getLastTrackedShipmentCode = (): string | undefined => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.shipmentCards && msg.shipmentCards.length > 0) {
        return msg.shipmentCards[0].code;
      }
      const formalMatch = msg.text.match(/\b(101\d{9}|111\d{9}|333\d{9}|222\d{9}|NX[-_]?[A-Z0-9]{4,16}|SPX[A-Z0-9]+|VN\d+[A-Z0-9]*|DH\d+)\b/i);
      if (formalMatch) return formalMatch[0].toUpperCase();
      const numMatch = msg.text.match(/\b\d{10,15}\b/);
      if (numMatch && !/^0[35789]\d{8}$/.test(numMatch[0])) {
        return numMatch[0];
      }
    }
    return undefined;
  };

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

  const handleSendMessage = async (textToSend?: string, options?: { action?: string; orderData?: any }) => {
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
      const lastShipmentCode = getLastTrackedShipmentCode();
      const requestPayload = {
        conversationId: conversationId || undefined,
        selectedShipmentCode: lastShipmentCode,
        message: query,
        action: options?.action,
        orderData: options?.orderData,
        userId: currentUser?.id || currentUser?.phone || undefined,
        userPhone: currentUser?.phone || undefined,
        userName: currentUser?.displayName || currentUser?.username || undefined,
        senderRole: currentUser ? 'CUSTOMER' : 'GUEST',
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
        if (answerData.conversationId) {
          setConversationId(answerData.conversationId);
        }
        const botMsg: ChatMessage = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: answerData.answer,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: answerData.toolsUsed,
          citations: answerData.citations,
          shipmentCards: answerData.shipmentCards,
          actionChips: answerData.actionChips,
          orderFormRequested: answerData.orderFormRequested,
          orderConfirmation: answerData.orderConfirmation,
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
          `• Gói Tiêu chuẩn: Bồi thường 04 lần cước vận chuyển (theo Điều 25 Nghị định 47 & Điều 40 Luật Bưu chính; trần tối đa 1.000.000 VNĐ/đơn theo Chính sách công ty).\n` +
          `• Gói Bảo hiểm khai giá: Đền bù 100% giá trị tổn thất thực tế theo hóa đơn (trần tối đa 30.000.000 VNĐ/đơn theo Chính sách bảo hiểm công ty).\n` +
          `3. Thời hạn giải quyết (theo cam kết dịch vụ công ty): Thẩm định trong 24h - 48h, hoàn tất chi trả bồi thường trong 03 - 05 ngày làm việc.\n\n` +
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
          style={[
            styles.keyboardContainer,
            Platform.OS === 'android' && keyboardHeight > 0
              ? { paddingBottom: keyboardHeight, height: '100%' }
              : null,
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatSheet}>
            {/* 1. Header (Synchronized with Web Tracking Nexus AI Robot) */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.botIconWrapper}>
                  <MaterialCommunityIcons name="robot" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <View style={styles.titleRow}>
                    <Text style={styles.headerTitle}>Nexus AI Robot</Text>
                    <View style={styles.ragBadge}>
                      <Text style={styles.ragBadgeText}>AI BOT</Text>
                    </View>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.headerSubtitle}>Trợ lý robot bưu chính trực tuyến 24/7</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
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
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
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
                      <MaterialCommunityIcons name="robot" size={16} color="#FFFFFF" />
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

                    {/* Interactive Order Creation Form */}
                    {msg.orderFormRequested && (
                      <OrderCreationFormMobile
                        defaultSenderName={currentUser?.displayName || currentUser?.username || ''}
                        defaultSenderPhone={currentUser?.phone || ''}
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
                      <View style={formStyles.confirmationCard}>
                        <View style={formStyles.confHeader}>
                          <Text style={formStyles.confTitle}>Đơn hàng chờ xác nhận</Text>
                          <View style={formStyles.confBadge}>
                            <Text style={formStyles.confBadgeText}>Chưa tạo đơn</Text>
                          </View>
                        </View>
                        <View style={formStyles.confBody}>
                          <Text style={formStyles.confLine}>Người gửi: <Text style={formStyles.confBold}>{msg.orderConfirmation.senderName} ({msg.orderConfirmation.senderPhone})</Text></Text>
                          <Text style={formStyles.confLine}>Lấy tại: <Text style={formStyles.confBold}>{[msg.orderConfirmation.senderAddress, msg.orderConfirmation.senderWard, msg.orderConfirmation.senderCity].filter(Boolean).join(', ')} [{msg.orderConfirmation.senderHubCode || '07904W001'}]</Text></Text>
                          <Text style={formStyles.confLine}>Người nhận: <Text style={formStyles.confBold}>{msg.orderConfirmation.receiverName} ({msg.orderConfirmation.receiverPhone})</Text></Text>
                          <Text style={formStyles.confLine}>Giao đến: <Text style={formStyles.confBold}>{[msg.orderConfirmation.receiverAddress, msg.orderConfirmation.receiverWard, msg.orderConfirmation.receiverCity].filter(Boolean).join(', ')} [{msg.orderConfirmation.receiverHubCode || 'HUB-HN-001'}]</Text></Text>
                          <Text style={formStyles.confLine}>Hàng hóa: <Text style={formStyles.confBold}>{msg.orderConfirmation.itemName} ({msg.orderConfirmation.weightKg} kg • {msg.orderConfirmation.lengthCm || 10}x{msg.orderConfirmation.widthCm || 10}x{msg.orderConfirmation.heightCm || 10} cm)</Text></Text>
                          <Text style={[formStyles.confLine, { fontSize: 10, color: '#64748B' }]}>Quy đổi thể tích IATA: {Number((((msg.orderConfirmation.lengthCm || 10) * (msg.orderConfirmation.widthCm || 10) * (msg.orderConfirmation.heightCm || 10)) / 6000).toFixed(2))} kg</Text>
                          <View style={formStyles.confFeeRow}>
                            <Text style={formStyles.confFee}>COD: {Number(msg.orderConfirmation.codAmount || 0).toLocaleString('vi-VN')} đ</Text>
                            <Text style={formStyles.confFee}>Cước: {Number(msg.orderConfirmation.shippingFee || 21500).toLocaleString('vi-VN')} đ</Text>
                          </View>
                        </View>
                        <View style={formStyles.confBtnRow}>
                          <TouchableOpacity
                            style={formStyles.confConfirmBtn}
                            onPress={() => handleSendMessage('Xác nhận tạo đơn', { action: 'CONFIRM_ORDER' })}
                          >
                            <Text style={formStyles.confConfirmText}>Xác nhận tạo đơn</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={formStyles.confCancelBtn}
                            onPress={() => handleSendMessage('Hủy tạo đơn', { action: 'CANCEL_ORDER' })}
                          >
                            <Text style={formStyles.confCancelText}>Hủy</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

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
                            onPress={() => {
                              if (chip.label === 'Xác nhận tạo đơn' || chip.query === 'Xác nhận tạo đơn') {
                                handleSendMessage('Xác nhận tạo đơn', { action: 'CONFIRM_ORDER' });
                              } else if (chip.label === 'Tạo đơn ngay' || chip.query === 'Tạo đơn ngay') {
                                handleSendMessage('Tạo đơn ngay', { action: 'OPEN_ORDER_FORM' });
                              } else if (chip.label === 'Hủy tạo đơn' || chip.query === 'Hủy tạo đơn') {
                                handleSendMessage('Hủy tạo đơn', { action: 'CANCEL_ORDER' });
                              } else {
                                handleSendMessage(chip.query);
                              }
                            }}
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
                    <MaterialCommunityIcons name="robot" size={16} color="#FFFFFF" />
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
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 120);
                  }}
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
    backgroundColor: '#1D4ED8',
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
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.38)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  ragBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#34D399',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#172554',
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
    color: '#BFDBFE',
  },
  slaBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slaBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#93C5FD',
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
    backgroundColor: '#1D4ED8',
    borderWidth: 1,
    borderColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 8,
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
