import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AddressSelectorModal, type StructuredAddress } from '../../components/AddressSelectorModal';
import { SavedAddressPickerModal } from '../../components/SavedAddressPickerModal';
import { AppHeader } from '../../components/AppHeader';
import { AppModal, type ModalVariant } from '../../components/common/AppModal';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepIndicator } from '../../components/StepIndicator';
import { MOCK_SHIPPING_SERVICES } from '../../mock/mockServices';
import type { RootStackParamList } from '../../navigation/types';
import { ApiClientError } from '../../services/api/client';
import { pricingApi, type PricingQuoteResponse } from '../../services/api/pricing.api';
import { shipmentApi } from '../../services/api/shipment.api';
import {
  DEFAULT_HUB_RECORDS,
  masterdataApi,
  type HubRecord,
} from '../../services/api/masterdata.api';
import { authStore, useAuthSession } from '../../store/authStore';
import { savedAddressStore } from '../../store/savedAddressStore';
import { colors, shadows, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOrder'>;

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

export function CreateOrderScreen({ navigation, route }: Props): React.JSX.Element {
  const session = useAuthSession();
  const user = session?.user;

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [liveFee, setLiveFee] = useState<number>(22000);
  const [liveQuote, setLiveQuote] = useState<PricingQuoteResponse | null>(null);

  // Address Modals state
  const [showSenderAddressModal, setShowSenderAddressModal] = useState(false);
  const [showReceiverAddressModal, setShowReceiverAddressModal] = useState(false);
  const [showSavedAddressPickerModal, setShowSavedAddressPickerModal] = useState(false);

  // Pickup mode: Lấy hàng tại nhà vs Gửi hàng tại bưu cục
  const [pickupMethod, setPickupMethod] = useState<'PICKUP' | 'DROP_OFF'>('PICKUP');
  const [allHubs, setAllHubs] = useState<HubRecord[]>(DEFAULT_HUB_RECORDS);
  const [showHubPickerModal, setShowHubPickerModal] = useState(false);
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [selectedDropOffHub, setSelectedDropOffHub] = useState<HubRecord | null>(null);

  // Load hubs on mount
  useEffect(() => {
    masterdataApi
      .getHubs()
      .then((hubs) => {
        if (Array.isArray(hubs) && hubs.length > 0) {
          setAllHubs(hubs);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectPickupMethod = (method: 'PICKUP' | 'DROP_OFF') => {
    setPickupMethod(method);
    if (method === 'DROP_OFF') {
      const hubToSelect = selectedDropOffHub || allHubs[0];
      if (hubToSelect) {
        setSelectedDropOffHub(hubToSelect);
        setSenderAddress({
          province: hubToSelect.province,
          district: hubToSelect.district || '',
          ward: hubToSelect.ward || '',
          addressDetail: hubToSelect.addressDetail || hubToSelect.name,
          composedAddress: `${hubToSelect.name} - ${hubToSelect.addressDetail || hubToSelect.province}`,
          hubCode: hubToSelect.code,
          hubName: hubToSelect.name,
        });
      }
    } else {
      handleSelectSenderMode(senderAddressMode);
    }
  };

  const handleChooseDropOffHub = (hub: HubRecord) => {
    setSelectedDropOffHub(hub);
    setSenderAddress({
      province: hub.province,
      district: hub.district || '',
      ward: hub.ward || '',
      addressDetail: hub.addressDetail || hub.name,
      composedAddress: `${hub.name} - ${hub.addressDetail || hub.province}`,
      hubCode: hub.code,
      hubName: hub.name,
    });
    setShowHubPickerModal(false);
  };

  const filteredHubs = useMemo(() => {
    if (!hubSearchQuery.trim()) return allHubs;
    const q = hubSearchQuery.trim().toLowerCase();
    return allHubs.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        h.province.toLowerCase().includes(q) ||
        (h.district || '').toLowerCase().includes(q) ||
        (h.addressDetail || '').toLowerCase().includes(q),
    );
  }, [allHubs, hubSearchQuery]);

  // Sender details
  const [senderAddressMode, setSenderAddressMode] = useState<'SAVED' | 'MANUAL'>('SAVED');
  const [senderName, setSenderName] = useState(user?.displayName || user?.username || '');
  const [senderPhone, setSenderPhone] = useState(user?.phone || user?.username || '');
  const [senderAddress, setSenderAddress] = useState<StructuredAddress | null>(null);

  const handleSelectSenderMode = async (mode: 'SAVED' | 'MANUAL') => {
    setSenderAddressMode(mode);
    if (mode === 'SAVED') {
      const def = await savedAddressStore.getDefaultAddress();
      if (def) {
        setSenderName(def.name);
        setSenderPhone(def.phone);
        setSenderAddress({
          province: def.province || '',
          district: def.district || '',
          ward: def.ward || '',
          addressDetail: def.addressDetail || '',
          composedAddress: def.composedAddress || '',
          hubCode: def.hubCode || '',
          hubName: def.hubName || '',
          latitude: def.latitude,
          longitude: def.longitude,
        });
      }
    } else {
      setSenderName(user?.displayName || user?.username || '');
      setSenderPhone(user?.phone || user?.username || '');
      setSenderAddress(null);
    }
  };

  // Receiver details
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState<StructuredAddress | null>(null);

  // Package & Service details
  const [itemName, setItemName] = useState('');
  const [weightKg, setWeightKg] = useState('0.5');
  const [lengthCm, setLengthCm] = useState('10');
  const [widthCm, setWidthCm] = useState('10');
  const [heightCm, setHeightCm] = useState('5');
  const [declaredValue, setDeclaredValue] = useState('');
  const [hasCod, setHasCod] = useState(false);
  const [codAmount, setCodAmount] = useState('');

  const [serviceId, setServiceId] = useState('STANDARD');
  const [extraCheckGoods, setExtraCheckGoods] = useState(true);
  const [extraInsurance, setExtraInsurance] = useState(false);
  const [notes, setNotes] = useState('');

  // Auto-sync sender details when session loads
  useEffect(() => {
    if (user) {
      if (!senderName) setSenderName(user.displayName || user.username || '');
      if (!senderPhone) setSenderPhone(user.phone || user.username || '');
    }
  }, [user]);

  // Auto-prefill default sender address from savedAddressStore if no route params override
  useEffect(() => {
    let isMounted = true;
    savedAddressStore.getDefaultAddress().then((def) => {
      if (def && isMounted && !route.params?.prefilledSenderAddress) {
        setSenderName(def.name);
        setSenderPhone(def.phone);
        setSenderAddress({
          province: def.province || '',
          district: def.district || '',
          ward: def.ward || '',
          addressDetail: def.addressDetail || '',
          composedAddress: def.composedAddress || '',
          hubCode: def.hubCode || '',
          hubName: def.hubName || '',
          latitude: def.latitude,
          longitude: def.longitude,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync prefilled params from PriceCalculatorScreen
  useEffect(() => {
    const params = route.params;
    if (params) {
      if (params.prefilledSenderAddress) setSenderAddress(params.prefilledSenderAddress);
      if (params.prefilledReceiverAddress) setReceiverAddress(params.prefilledReceiverAddress);
      if (params.prefilledWeightKg) setWeightKg(params.prefilledWeightKg);
      if (params.prefilledLengthCm) setLengthCm(params.prefilledLengthCm);
      if (params.prefilledWidthCm) setWidthCm(params.prefilledWidthCm);
      if (params.prefilledHeightCm) setHeightCm(params.prefilledHeightCm);
      if (params.prefilledHasCod !== undefined) setHasCod(params.prefilledHasCod);
      if (params.prefilledCodAmount) setCodAmount(params.prefilledCodAmount);
    }
  }, [route.params]);

  // Calculate pricing quote dynamically from live backend pricing-service
  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      if (!senderAddress || !receiverAddress) return;

      try {
        const quote = await pricingApi.calculateQuote({
          serviceType: serviceId,
          sender: {
            province: senderAddress.province,
            hubCode: senderAddress.hubCode,
          },
          receiver: {
            province: receiverAddress.province,
            hubCode: receiverAddress.hubCode,
          },
          package: {
            weightKg: Number(weightKg) || 0.5,
            dimensionsCm: {
              length: Number(lengthCm) || 10,
              width: Number(widthCm) || 10,
              height: Number(heightCm) || 5,
            },
            declaredValue: Number(declaredValue) || 0,
          },
          codAmount: hasCod ? Number(codAmount) || 0 : 0,
        });

        if (isMounted && quote?.totalFee) {
          setLiveFee(quote.totalFee);
          setLiveQuote(quote);
        }
      } catch {
        // Keep current fee fallback
      }
    };

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [
    serviceId,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    declaredValue,
    hasCod,
    codAmount,
    senderAddress?.province,
    senderAddress?.hubCode,
    receiverAddress?.province,
    receiverAddress?.hubCode,
  ]);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    variant: ModalVariant;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    variant: 'warning',
    title: '',
    message: '',
  });

  const showModal = (
    title: string,
    message: string,
    variant: ModalVariant = 'warning',
    onConfirm?: () => void,
  ) => {
    setModalConfig({
      visible: true,
      variant,
      title,
      message,
      onConfirm,
    });
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!senderName.trim() || !senderPhone.trim()) {
        showModal('Thiếu thông tin', 'Vui lòng nhập tên và số điện thoại người gửi.');
        return;
      }
      if (pickupMethod === 'DROP_OFF' && !senderAddress) {
        showModal('Thiếu thông tin', 'Vui lòng chọn bưu cục tiếp nhận gửi hàng.');
        return;
      }
      if (pickupMethod === 'PICKUP' && !senderAddress) {
        showModal('Thiếu thông tin', 'Vui lòng chọn địa chỉ lấy hàng tại nhà.');
        return;
      }
      if (!receiverName.trim() || !receiverPhone.trim()) {
        showModal('Thiếu thông tin', 'Vui lòng nhập tên và số điện thoại người nhận.');
        return;
      }
      if (!receiverAddress) {
        showModal('Thiếu thông tin', 'Vui lòng chọn địa chỉ người nhận.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!itemName.trim() || !weightKg.trim()) {
        showModal('Thiếu thông tin', 'Vui lòng nhập tên hàng hóa và khối lượng.');
        return;
      }
      setStep(3);
    } else {
      // Step 3 -> Create Shipment on Live Backend using SAME Merchant API & DTO
      const token = authStore.getAccessToken() || session?.accessToken;
      if (!token) {
        showModal('Phiên làm việc', 'Vui lòng đăng nhập lại để tiếp tục tạo đơn.', 'warning', () => navigation.replace('Login'));
        return;
      }

      if (!senderAddress || !receiverAddress) {
        showModal('Lỗi địa chỉ', 'Vui lòng chọn đầy đủ địa chỉ gửi và địa chỉ nhận.');
        return;
      }

      setSubmitting(true);
      try {
        const senderCoords = senderAddress.latitude && senderAddress.longitude
          ? { latitude: senderAddress.latitude, longitude: senderAddress.longitude }
          : null;
        const receiverCoords = receiverAddress.latitude && receiverAddress.longitude
          ? { latitude: receiverAddress.latitude, longitude: receiverAddress.longitude }
          : null;

        const metadataPayload = {
          createdBy: {
            username: user?.username || senderPhone,
            userId: user?.id || senderPhone,
          },
          createdByUsername: user?.username || senderPhone,
          createdByUserId: user?.id || senderPhone,
          sender: {
            name: senderName.trim(),
            phone: senderPhone.trim(),
            address: senderAddress.composedAddress,
            addressDetail: senderAddress.addressDetail,
            province: senderAddress.province,
            district: senderAddress.district,
            ward: senderAddress.ward,
            hubCode: senderAddress.hubCode,
            latitude: senderCoords?.latitude,
            longitude: senderCoords?.longitude,
            coordinate: senderCoords ?? undefined,
          },
          receiver: {
            name: receiverName.trim(),
            phone: receiverPhone.trim(),
            address: receiverAddress.composedAddress,
            addressDetail: receiverAddress.addressDetail,
            region: receiverAddress.province,
            province: receiverAddress.province,
            district: receiverAddress.district,
            ward: receiverAddress.ward,
            hubCode: receiverAddress.hubCode,
            latitude: receiverCoords?.latitude,
            longitude: receiverCoords?.longitude,
            coordinate: receiverCoords ?? undefined,
          },
          pickupLatitude: senderCoords?.latitude,
          pickupLongitude: senderCoords?.longitude,
          pickupCoordinate: senderCoords ?? undefined,
          deliveryLatitude: receiverCoords?.latitude,
          deliveryLongitude: receiverCoords?.longitude,
          deliveryCoordinate: receiverCoords ?? undefined,
          pickupType: pickupMethod,
          package: {
            itemType: itemName.trim(),
            itemName: itemName.trim(),
            weightKg: Number(weightKg) || 0.5,
            dimensionsCm: {
              length: Number(lengthCm) || 10,
              width: Number(widthCm) || 10,
              height: Number(heightCm) || 5,
            },
            declaredValue: Number(declaredValue) || 0,
          },
          service: {
            type: serviceId,
            pickupType: pickupMethod,
          },
          codAmount: hasCod ? Number(codAmount) || 0 : 0,
          deliveryNote: notes.trim() || null,
          estimatedFee: liveFee,
          originHubCode: senderAddress.hubCode,
          destinationHubCode: receiverAddress.hubCode,
          senderHubCode: senderAddress.hubCode,
          receiverHubCode: receiverAddress.hubCode,
          routing: {
            originHubCode: senderAddress.hubCode,
            destinationHubCode: receiverAddress.hubCode,
          },
          pricing: liveQuote
            ? {
                quoteId: liveQuote.quoteId,
                currency: 'VND',
                totalFee: liveQuote.totalFee,
                serviceType: liveQuote.serviceType,
                actualWeightKg: liveQuote.actualWeightKg,
                volumetricWeightKg: liveQuote.volumetricWeightKg,
                chargeableWeightKg: liveQuote.chargeableWeightKg,
                source: 'pricing-service',
              }
            : null,
          source: 'customer-mobile',
        };

        const createdShipment = await shipmentApi.createShipment(token, metadataPayload);

        navigation.replace('CreateOrderSuccess', { orderCode: createdShipment.code });
      } catch (error) {
        const msg = error instanceof ApiClientError ? error.message : 'Tạo vận đơn thất bại.';
        showModal('Lỗi tạo đơn', msg, 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
    >
      <AppHeader title="Tạo đơn hàng mới" onBackPress={handlePrevStep} />
      <StepIndicator currentStep={step} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: ĐỊA CHỈ GỬI & NHẬN (Lấy từ Database Masterdata) */}
        {step === 1 ? (
          <View style={styles.stepBlock}>
            {/* HÌNH THỨC GỬI HÀNG */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Hình thức gửi hàng</Text>
              </View>

              <View style={styles.methodChoiceRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.methodChoiceBtn,
                    pickupMethod === 'PICKUP' && styles.methodChoiceBtnActive,
                  ]}
                  onPress={() => handleSelectPickupMethod('PICKUP')}
                >
                  <View
                    style={[
                      styles.methodChoiceIconCircle,
                      pickupMethod === 'PICKUP' && styles.methodChoiceIconCircleActive,
                    ]}
                  >
                    <Ionicons
                      name="home"
                      size={18}
                      color={pickupMethod === 'PICKUP' ? colors.surface : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.methodChoiceTitle,
                      pickupMethod === 'PICKUP' && styles.methodChoiceTitleActive,
                    ]}
                  >
                    Lấy hàng tại nhà
                  </Text>
                  <Text style={styles.methodChoiceDesc}>
                    Bưu tá đến tận nơi nhận theo địa chỉ của bạn
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.methodChoiceBtn,
                    pickupMethod === 'DROP_OFF' && styles.methodChoiceBtnActive,
                  ]}
                  onPress={() => handleSelectPickupMethod('DROP_OFF')}
                >
                  <View
                    style={[
                      styles.methodChoiceIconCircle,
                      pickupMethod === 'DROP_OFF' && styles.methodChoiceIconCircleActive,
                    ]}
                  >
                    <Ionicons
                      name="business"
                      size={18}
                      color={pickupMethod === 'DROP_OFF' ? colors.surface : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.methodChoiceTitle,
                      pickupMethod === 'DROP_OFF' && styles.methodChoiceTitleActive,
                    ]}
                  >
                    Gửi tại bưu cục
                  </Text>
                  <Text style={styles.methodChoiceDesc}>
                    Tự mang hàng ra bưu cục Nexus gần nhất
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SENDER CARD */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="location" size={20} color={colors.info} />
                <Text style={styles.cardTitle}>Thông tin người gửi</Text>
              </View>

              {pickupMethod === 'DROP_OFF' ? (
                /* DROP-OFF MODE: Chọn Bưu cục gửi */
                <View style={styles.modeSection}>
                  <InputField
                    label="Họ và tên người gửi"
                    placeholder="Nhập tên người gửi"
                    value={senderName}
                    onChangeText={setSenderName}
                    required
                  />
                  <InputField
                    label="Số điện thoại người gửi"
                    placeholder="09xxxxxxxx"
                    keyboardType="phone-pad"
                    value={senderPhone}
                    onChangeText={setSenderPhone}
                    required
                  />

                  <Text style={styles.fieldLabel}>Bưu cục tiếp nhận gửi hàng (Nexus Hub) *</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.addressBoxSelect, !senderAddress && styles.addressBoxUnselected]}
                    onPress={() => setShowHubPickerModal(true)}
                  >
                    {senderAddress ? (
                      <View style={styles.addressBoxTextCol}>
                        <Text style={styles.addressComposedText}>{senderAddress.hubName}</Text>
                        <Text style={styles.addressHubText}>
                          🏢 [{senderAddress.hubCode}] • {senderAddress.addressDetail || senderAddress.province}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.addressPlaceholderText}>+ Bấm để chọn Bưu cục tiếp nhận gửi hàng</Text>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                /* PICKUP MODE: Lấy tận nhà */
                <>
                  {/* MODE SELECTOR: SAVED ADDRESS vs MANUAL ENTRY */}
                  <View style={styles.senderModeGroup}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.senderModePill, senderAddressMode === 'SAVED' && styles.senderModePillActive]}
                      onPress={() => handleSelectSenderMode('SAVED')}
                    >
                      <Ionicons
                        name={senderAddressMode === 'SAVED' ? 'radio-button-on' : 'radio-button-off'}
                        size={17}
                        color={senderAddressMode === 'SAVED' ? colors.primary : colors.textMuted}
                      />
                      <Text style={[styles.senderModeText, senderAddressMode === 'SAVED' && styles.senderModeTextActive]}>
                        Địa chỉ của tôi (Mặc định)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.senderModePill, senderAddressMode === 'MANUAL' && styles.senderModePillActive]}
                      onPress={() => handleSelectSenderMode('MANUAL')}
                    >
                      <Ionicons
                        name={senderAddressMode === 'MANUAL' ? 'radio-button-on' : 'radio-button-off'}
                        size={17}
                        color={senderAddressMode === 'MANUAL' ? colors.primary : colors.textMuted}
                      />
                      <Text style={[styles.senderModeText, senderAddressMode === 'MANUAL' && styles.senderModeTextActive]}>
                        Tự nhập địa chỉ mới
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {senderAddressMode === 'SAVED' ? (
                    <View style={styles.modeSection}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.pickSavedBtn}
                        onPress={() => setShowSavedAddressPickerModal(true)}
                      >
                        <Ionicons name="book-outline" size={16} color={colors.primary} />
                        <Text style={styles.pickSavedBtnText}>Đổi từ danh sách Địa chỉ của tôi</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                      </TouchableOpacity>

                      <InputField
                        label="Họ và tên người gửi"
                        placeholder="Nhập tên người gửi"
                        value={senderName}
                        onChangeText={setSenderName}
                        required
                      />
                      <InputField
                        label="Số điện thoại người gửi"
                        placeholder="09xxxxxxxx"
                        keyboardType="phone-pad"
                        value={senderPhone}
                        onChangeText={setSenderPhone}
                        required
                      />

                      <Text style={styles.fieldLabel}>Địa chỉ lấy hàng (Đã chọn từ Địa chỉ của tôi) *</Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.addressBoxSelect, !senderAddress && styles.addressBoxUnselected]}
                        onPress={() => setShowSavedAddressPickerModal(true)}
                      >
                        {senderAddress ? (
                          <View style={styles.addressBoxTextCol}>
                            <Text style={styles.addressComposedText}>{senderAddress.composedAddress}</Text>
                            <Text style={styles.addressHubText}>📍 Bưu cục gửi: {senderAddress.hubName} [{senderAddress.hubCode}]</Text>
                          </View>
                        ) : (
                          <Text style={styles.addressPlaceholderText}>+ Bấm để chọn từ danh sách Địa chỉ của tôi</Text>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.modeSection}>
                      <InputField
                        label="Họ và tên người gửi"
                        placeholder="Nhập tên người gửi mới"
                        value={senderName}
                        onChangeText={setSenderName}
                        required
                      />
                      <InputField
                        label="Số điện thoại người gửi"
                        placeholder="09xxxxxxxx"
                        keyboardType="phone-pad"
                        value={senderPhone}
                        onChangeText={setSenderPhone}
                        required
                      />

                      <Text style={styles.fieldLabel}>Địa chỉ lấy hàng mới (Chọn từ Database) *</Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.addressBoxSelect, !senderAddress && styles.addressBoxUnselected]}
                        onPress={() => setShowSenderAddressModal(true)}
                      >
                        {senderAddress ? (
                          <View style={styles.addressBoxTextCol}>
                            <Text style={styles.addressComposedText}>{senderAddress.composedAddress}</Text>
                            <Text style={styles.addressHubText}>📍 Bưu cục gửi: {senderAddress.hubName} [{senderAddress.hubCode}]</Text>
                          </View>
                        ) : (
                          <Text style={styles.addressPlaceholderText}>+ Bấm để chọn Tỉnh / Thành / Bưu cục gửi mới</Text>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* RECEIVER CARD */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Thông tin người nhận</Text>
              </View>

              <InputField
                label="Họ và tên người nhận"
                placeholder="Nhập tên người nhận"
                value={receiverName}
                onChangeText={setReceiverName}
                required
              />
              <InputField
                label="Số điện thoại người nhận"
                placeholder="09xxxxxxxx"
                keyboardType="phone-pad"
                value={receiverPhone}
                onChangeText={setReceiverPhone}
                required
              />

              <Text style={styles.fieldLabel}>Địa chỉ người nhận (Chọn từ Database) *</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.addressBoxSelect, !receiverAddress && styles.addressBoxUnselected]}
                onPress={() => setShowReceiverAddressModal(true)}
              >
                {receiverAddress ? (
                  <View style={styles.addressBoxTextCol}>
                    <Text style={styles.addressComposedText}>{receiverAddress.composedAddress}</Text>
                    <Text style={styles.addressHubText}>📍 Bưu cục nhận: {receiverAddress.hubName} [{receiverAddress.hubCode}]</Text>
                  </View>
                ) : (
                  <Text style={styles.addressPlaceholderText}>+ Bấm để chọn Tỉnh / Thành / Bưu cục nhận</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* STEP 2: THÔNG TIN HÀNG HÓA */}
        {step === 2 ? (
          <View style={styles.stepBlock}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="cube" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Thông tin bưu gửi</Text>
              </View>

              <InputField
                label="Tên hàng hóa"
                placeholder="Ví dụ: Quần áo, Điện thoại, Sách..."
                value={itemName}
                onChangeText={setItemName}
                required
              />

              <InputField
                label="Khối lượng (kg)"
                placeholder="0.5"
                keyboardType="decimal-pad"
                value={weightKg}
                onChangeText={setWeightKg}
                required
              />

              <Text style={styles.fieldGroupLabel}>Kích thước (Dài x Rộng x Cao cm)</Text>
              <View style={styles.rowThreeCols}>
                <View style={styles.col}>
                  <InputField
                    placeholder="Dài"
                    keyboardType="number-pad"
                    value={lengthCm}
                    onChangeText={setLengthCm}
                  />
                </View>
                <View style={styles.col}>
                  <InputField
                    placeholder="Rộng"
                    keyboardType="number-pad"
                    value={widthCm}
                    onChangeText={setWidthCm}
                  />
                </View>
                <View style={styles.col}>
                  <InputField
                    placeholder="Cao"
                    keyboardType="number-pad"
                    value={heightCm}
                    onChangeText={setHeightCm}
                  />
                </View>
              </View>

              <InputField
                label="Giá trị hàng hóa (VNĐ)"
                placeholder="500.000"
                keyboardType="number-pad"
                value={declaredValue}
                onChangeText={setDeclaredValue}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.checkboxRow}
                onPress={() => setHasCod(!hasCod)}
              >
                <View style={[styles.checkbox, hasCod && styles.checkboxActive]}>
                  {hasCod ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
                </View>
                <Text style={styles.checkboxLabel}>Thu hộ tiền COD</Text>
              </TouchableOpacity>

              {hasCod ? (
                <InputField
                  label="Số tiền thu hộ COD (VNĐ)"
                  placeholder="500.000"
                  keyboardType="number-pad"
                  value={codAmount}
                  onChangeText={setCodAmount}
                  required
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* STEP 3: DỊCH VỤ CƯỚC PHÍ & XÁC NHẬN */}
        {step === 3 ? (
          <View style={styles.stepBlock}>
            {/* SERVICE SELECTION */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="pricetags" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Chọn dịch vụ chuyển phát</Text>
              </View>

              {MOCK_SHIPPING_SERVICES.map((srv) => {
                const isSelected = serviceId === srv.id;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    activeOpacity={0.8}
                    style={[styles.serviceCardOption, isSelected && styles.serviceCardOptionActive]}
                    onPress={() => setServiceId(srv.id)}
                  >
                    <View style={styles.serviceHeaderRow}>
                      <View style={styles.serviceTitleRow}>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected ? <View style={styles.radioDot} /> : null}
                        </View>
                        <Text style={[styles.serviceName, isSelected && styles.serviceNameActive]}>
                          {srv.name}
                        </Text>
                      </View>
                      <Text style={styles.serviceFee}>
                        {isSelected ? formatVnd(liveFee) : formatVnd(srv.fee)}
                      </Text>
                    </View>
                    <Text style={styles.serviceEst}>{srv.estimatedHours}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* EXTRA SERVICES & NOTES */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ghi chú & Dịch vụ cộng thêm</Text>

              <InputField
                label="Ghi chú giao hàng"
                placeholder="Ví dụ: Giao giờ hành chính..."
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.checkboxRow}
                onPress={() => setExtraCheckGoods(!extraCheckGoods)}
              >
                <View style={[styles.checkbox, extraCheckGoods && styles.checkboxActive]}>
                  {extraCheckGoods ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
                </View>
                <Text style={styles.checkboxLabel}>Cho người nhận đồng kiểm (xem hàng)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.checkboxRow}
                onPress={() => setExtraInsurance(!extraInsurance)}
              >
                <View style={[styles.checkbox, extraInsurance && styles.checkboxActive]}>
                  {extraInsurance ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
                </View>
                <Text style={styles.checkboxLabel}>Bảo hiểm & khai giá an toàn</Text>
              </TouchableOpacity>
            </View>

            {/* SUMMARY REVIEW */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Tổng quan chi phí (API Pricing Quote)</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hình thức gửi hàng:</Text>
                <Text style={styles.summaryVal}>
                  {pickupMethod === 'PICKUP' ? '🚚 Lấy hàng tại nhà' : '🏢 Gửi tại bưu cục'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cước vận chuyển:</Text>
                <Text style={styles.summaryVal}>{formatVnd(liveFee)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Thu hộ COD:</Text>
                <Text style={styles.summaryVal}>
                  {hasCod ? formatVnd(Number(codAmount) || 0) : '0đ'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRowTotal}>
                <Text style={styles.summaryLabelTotal}>TỔNG CƯỚC THANH TOÁN:</Text>
                <Text style={styles.summaryValTotal}>{formatVnd(liveFee)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* BUTTON FOOTER */}
        <View style={styles.footerRow}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backStepBtn} onPress={handlePrevStep}>
              <Text style={styles.backStepBtnText}>Quay lại</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.nextStepBtnCol}>
            <PrimaryButton
              title={step === 3 ? 'Xác nhận tạo đơn' : 'Tiếp tục'}
              onPress={handleNextStep}
              loading={submitting}
              size="lg"
            />
          </View>
        </View>
      </ScrollView>

      {/* ADDRESS SELECTOR MODALS */}
      <AddressSelectorModal
        visible={showSenderAddressModal}
        title="Chọn địa chỉ người gửi"
        initialAddress={senderAddress}
        accessToken={session?.accessToken}
        onConfirm={(addr) => setSenderAddress(addr)}
        onClose={() => setShowSenderAddressModal(false)}
      />

      <AddressSelectorModal
        visible={showReceiverAddressModal}
        title="Chọn địa chỉ người nhận"
        initialAddress={receiverAddress}
        accessToken={session?.accessToken}
        onConfirm={(addr) => setReceiverAddress(addr)}
        onClose={() => setShowReceiverAddressModal(false)}
      />

      {/* SAVED ADDRESS PICKER MODAL */}
      <SavedAddressPickerModal
        visible={showSavedAddressPickerModal}
        onClose={() => setShowSavedAddressPickerModal(false)}
        onSelectAddress={(picked) => {
          setSenderName(picked.name);
          setSenderPhone(picked.phone);
          setSenderAddress({
            province: picked.province || '',
            district: picked.district || '',
            ward: picked.ward || '',
            addressDetail: picked.addressDetail || '',
            composedAddress: picked.composedAddress || '',
            hubCode: picked.hubCode || '',
            hubName: picked.hubName || '',
          });
        }}
        onManageAddresses={() => navigation.navigate('AddressManagement')}
      />

      <AppModal
        visible={modalConfig.visible}
        variant={modalConfig.variant}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={() => {
          setModalConfig((prev) => ({ ...prev, visible: false }));
          if (modalConfig.onConfirm) {
            modalConfig.onConfirm();
          }
        }}
      />
      {/* DROP-OFF HUB PICKER MODAL */}
      <Modal
        visible={showHubPickerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHubPickerModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.hubModalOverlay}
        >
          <View style={styles.hubModalContent}>
            <View style={styles.hubModalHeader}>
              <View>
                <Text style={styles.hubModalTitle}>Chọn Bưu Cục Gửi Hàng</Text>
                <Text style={styles.hubModalSubtitle}>
                  Chọn điểm bưu cục thuận tiện ({allHubs.length} bưu cục)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHubPickerModal(false)}
                style={styles.hubModalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.hubSearchContainer}>
              <Ionicons name="search" size={18} color={colors.textMuted} style={styles.hubSearchIcon} />
              <TextInput
                style={styles.hubSearchInput}
                placeholder="Tìm tên bưu cục, mã Hub, Tỉnh/Thành..."
                placeholderTextColor={colors.textMuted}
                value={hubSearchQuery}
                onChangeText={setHubSearchQuery}
              />
              {hubSearchQuery ? (
                <TouchableOpacity onPress={() => setHubSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={styles.hubListScroll} keyboardShouldPersistTaps="handled">
              {filteredHubs.map((hub) => {
                const isSelected = selectedDropOffHub?.code === hub.code;
                return (
                  <TouchableOpacity
                    key={hub.code}
                    activeOpacity={0.8}
                    style={[styles.hubItemCard, isSelected && styles.hubItemCardSelected]}
                    onPress={() => handleChooseDropOffHub(hub)}
                  >
                    <View style={styles.hubItemLeft}>
                      <View style={[styles.hubIconBox, isSelected && styles.hubIconBoxSelected]}>
                        <Ionicons
                          name="business"
                          size={20}
                          color={isSelected ? colors.surface : colors.primary}
                        />
                      </View>
                      <View style={styles.hubItemInfo}>
                        <Text style={[styles.hubItemName, isSelected && styles.hubItemNameSelected]}>
                          {hub.name}
                        </Text>
                        <Text style={styles.hubItemAddress}>
                          📍 {hub.addressDetail || hub.province}
                        </Text>
                        <View style={styles.hubBadgeRow}>
                          <View style={styles.hubCodeBadge}>
                            <Text style={styles.hubCodeBadgeText}>{hub.code}</Text>
                          </View>
                          <Text style={styles.hubProvinceText}>{hub.province}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                      size={20}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 220,
  },
  stepBlock: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  addressBoxSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.2)',
    marginBottom: spacing.md,
  },
  addressBoxUnselected: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  addressPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  addressBoxTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addressComposedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressHubText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  rowThreeCols: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  fieldGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  serviceCardOption: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  serviceCardOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  serviceNameActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  serviceFee: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  serviceEst: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: 26,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabelTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryValTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: 12,
  },
  backStepBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backStepBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nextStepBtnCol: {
    flex: 1,
  },
  senderModeGroup: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: spacing.md,
  },
  senderModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 8,
  },
  senderModePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  senderModeText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  senderModeTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  modeSection: {
    gap: spacing.xs,
  },
  pickSavedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  pickSavedBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  methodChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xs,
  },
  methodChoiceBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  methodChoiceBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodChoiceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodChoiceIconCircleActive: {
    backgroundColor: colors.primary,
  },
  methodChoiceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  methodChoiceTitleActive: {
    color: colors.primary,
  },
  methodChoiceDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  hubModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  hubModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  hubModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  hubModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  hubModalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  hubModalCloseBtn: {
    padding: 6,
  },
  hubSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: spacing.md,
  },
  hubSearchIcon: {
    marginRight: 8,
  },
  hubSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  hubListScroll: {
    maxHeight: 380,
  },
  hubItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  hubItemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  hubItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  hubIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hubIconBoxSelected: {
    backgroundColor: colors.primary,
  },
  hubItemInfo: {
    flex: 1,
  },
  hubItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  hubItemNameSelected: {
    color: colors.primary,
  },
  hubItemAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hubBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hubCodeBadge: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hubCodeBadgeText: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  hubProvinceText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
