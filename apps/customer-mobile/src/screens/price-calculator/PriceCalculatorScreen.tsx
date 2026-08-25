import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AddressSelectorModal, type StructuredAddress } from '../../components/AddressSelectorModal';
import type { RootStackParamList } from '../../navigation/types';
import { pricingApi } from '../../services/api/pricing.api';
import { authStore } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PriceCalculator'>;

const INTERNATIONAL_COUNTRIES = [
  'Hoa Kỳ (United States)',
  'Nhật Bản (Japan)',
  'Hàn Quốc (South Korea)',
  'Úc (Australia)',
  'Singapore',
  'Trung Quốc (China)',
  'Anh (United Kingdom)',
  'Pháp (France)',
  'Đức (Germany)',
  'Canada',
];

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function PriceCalculatorScreen({ navigation }: Props): React.JSX.Element {
  const token = authStore.getAccessToken();

  // FORM STATES
  const [shippingScope, setShippingScope] = useState<'DOMESTIC' | 'INTERNATIONAL'>('DOMESTIC');
  const [packageType, setPackageType] = useState<'PARCEL' | 'DOCUMENT'>('PARCEL');

  // ADDRESSES FROM DATABASE
  const [senderAddress, setSenderAddress] = useState<StructuredAddress | null>(null);
  const [senderDetail, setSenderDetail] = useState<string>('');

  const [receiverAddress, setReceiverAddress] = useState<StructuredAddress | null>(null);
  const [receiverDetail, setReceiverDetail] = useState<string>('');

  // INTERNATIONAL RECEIVER COUNTRY
  const [receiverCountry, setReceiverCountry] = useState<string>('Hoa Kỳ (United States)');

  // ADDRESS SELECTOR MODALS
  const [showSenderAddressModal, setShowSenderAddressModal] = useState<boolean>(false);
  const [showReceiverAddressModal, setShowReceiverAddressModal] = useState<boolean>(false);
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);

  // PACKAGE SPECS
  const [weightGrams, setWeightGrams] = useState<string>('500');
  const [lengthCm, setLengthCm] = useState<string>('10');
  const [widthCm, setWidthCm] = useState<string>('10');
  const [heightCm, setHeightCm] = useState<string>('10');

  // COD
  const [isCodEnabled, setIsCodEnabled] = useState<boolean>(false);
  const [codAmount, setCodAmount] = useState<string>('0');

  // RESULT MODAL
  const [calculating, setCalculating] = useState<boolean>(false);
  const [resultModalVisible, setResultModalVisible] = useState<boolean>(false);
  const [calculatedFee, setCalculatedFee] = useState<{
    baseFee: number;
    codFee: number;
    insuranceFee: number;
    totalFee: number;
    estimatedDays: string;
  } | null>(null);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const weightNum = Number(weightGrams) / 1000 || 0.5;
      const codNum = isCodEnabled ? Number(codAmount) || 0 : 0;

      let baseFee = 22000;
      let estimatedDays = '1 - 2 ngày làm việc';

      const sProv = senderAddress?.province || 'Thành phố Hồ Chí Minh';
      const rProv = receiverAddress?.province || 'Thành phố Hà Nội';

      if (shippingScope === 'INTERNATIONAL') {
        baseFee = 350000 + weightNum * 120000;
        estimatedDays = '3 - 5 ngày làm việc';
      } else {
        if (sProv !== rProv) {
          baseFee = 32000 + Math.max(0, weightNum - 0.5) * 10000;
          estimatedDays = '2 - 3 ngày làm việc';
        } else {
          baseFee = 22000 + Math.max(0, weightNum - 0.5) * 5000;
          estimatedDays = 'Trong ngày / 24h';
        }

        if (packageType === 'DOCUMENT') {
          baseFee = Math.max(16000, baseFee * 0.8);
        }
      }

      // Call backend pricing API if available
      if (shippingScope === 'DOMESTIC') {
        try {
          const apiRes = await pricingApi.calculateQuote({
            serviceType: 'REGULAR',
            sender: { province: sProv, hubCode: senderAddress?.hubCode },
            receiver: { province: rProv, hubCode: receiverAddress?.hubCode },
            package: {
              weightKg: weightNum,
              dimensionsCm: {
                length: Number(lengthCm) || 10,
                width: Number(widthCm) || 10,
                height: Number(heightCm) || 10,
              },
            },
            codAmount: codNum,
          });
          if (apiRes && apiRes.totalFee) {
            baseFee = Number(apiRes.totalFee);
          }
        } catch {
          // Fallback to local calculation
        }
      }

      const codFee = isCodEnabled ? Math.max(0, codNum * 0.008) : 0;
      const insuranceFee = 0;
      const totalFee = Math.round(baseFee + codFee + insuranceFee);

      setCalculatedFee({
        baseFee: Math.round(baseFee),
        codFee: Math.round(codFee),
        insuranceFee,
        totalFee,
        estimatedDays,
      });

      setResultModalVisible(true);
    } catch {
      // Handled
    } finally {
      setCalculating(false);
    }
  };

  const handleApplyToCreateOrder = () => {
    setResultModalVisible(false);

    // Compose final addresses with custom detail input if provided
    const finalSender: StructuredAddress | undefined = senderAddress
      ? {
          ...senderAddress,
          addressDetail: senderDetail.trim() || senderAddress.addressDetail,
          composedAddress: senderDetail.trim()
            ? [senderDetail.trim(), senderAddress.ward, senderAddress.province].filter(Boolean).join(', ')
            : senderAddress.composedAddress,
        }
      : undefined;

    const finalReceiver: StructuredAddress | undefined = receiverAddress
      ? {
          ...receiverAddress,
          addressDetail: receiverDetail.trim() || receiverAddress.addressDetail,
          composedAddress: receiverDetail.trim()
            ? [receiverDetail.trim(), receiverAddress.ward, receiverAddress.province].filter(Boolean).join(', ')
            : receiverAddress.composedAddress,
        }
      : undefined;

    navigation.navigate('CreateOrder', {
      prefilledSenderAddress: finalSender,
      prefilledReceiverAddress: finalReceiver,
      prefilledWeightKg: (Number(weightGrams) / 1000 || 0.5).toString(),
      prefilledLengthCm: lengthCm,
      prefilledWidthCm: widthCm,
      prefilledHeightCm: heightCm,
      prefilledHasCod: isCodEnabled,
      prefilledCodAmount: codAmount,
    });
  };

  return (
    <View style={styles.flex}>
      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tra cước phí</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* 1. CARD VẬN CHUYỂN TOGGLE */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Vận chuyển</Text>
              <View style={styles.radioGroupRow}>
                <TouchableOpacity
                  style={styles.radioOption}
                  activeOpacity={0.8}
                  onPress={() => setShippingScope('DOMESTIC')}
                >
                  <Ionicons
                    name={shippingScope === 'DOMESTIC' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={shippingScope === 'DOMESTIC' ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.radioLabel}>Trong nước</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  activeOpacity={0.8}
                  onPress={() => setShippingScope('INTERNATIONAL')}
                >
                  <Ionicons
                    name={shippingScope === 'INTERNATIONAL' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={shippingScope === 'INTERNATIONAL' ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.radioLabel}>Quốc tế</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 2. CARD ĐỊA ĐIỂM (NGƯỜI GỬI & NGƯỜI NHẬN) */}
          <View style={styles.card}>
            {/* NGƯỜI GỬI */}
            <Text style={styles.subTitleLabel}>Địa chỉ Người gửi</Text>
            <TouchableOpacity
              style={styles.addressPickerBtn}
              activeOpacity={0.8}
              onPress={() => setShowSenderAddressModal(true)}
            >
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.addressPickerText,
                  !senderAddress && styles.addressPlaceholderText,
                ]}
                numberOfLines={2}
              >
                {senderAddress
                  ? `${senderAddress.composedAddress} (${senderAddress.hubName})`
                  : 'Bấm để chọn Tỉnh/Thành & Phường/Xã... *'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Ô NHẬP ĐỊA CHỈ CHI TIẾT NGƯỜI GỬI */}
            <Text style={styles.detailLabel}>Số nhà, tên đường chi tiết (Người gửi)</Text>
            <TextInput
              style={styles.detailInput}
              placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, Phường Bến Thành..."
              placeholderTextColor={colors.textMuted}
              value={senderDetail}
              onChangeText={setSenderDetail}
            />

            {/* NGƯỜI NHẬN */}
            <Text style={[styles.subTitleLabel, { marginTop: spacing.lg }]}>
              Địa chỉ Người nhận {shippingScope === 'INTERNATIONAL' ? '(Quốc tế)' : ''}
            </Text>

            {shippingScope === 'DOMESTIC' ? (
              <React.Fragment>
                <TouchableOpacity
                  style={styles.addressPickerBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowReceiverAddressModal(true)}
                >
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <Text
                    style={[
                      styles.addressPickerText,
                      !receiverAddress && styles.addressPlaceholderText,
                    ]}
                    numberOfLines={2}
                  >
                    {receiverAddress
                      ? `${receiverAddress.composedAddress} (${receiverAddress.hubName})`
                      : 'Bấm để chọn Tỉnh/Thành & Phường/Xã... *'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Ô NHẬP ĐỊA CHỈ CHI TIẾT NGƯỜI NHẬN */}
                <Text style={styles.detailLabel}>Số nhà, tên đường chi tiết (Người nhận)</Text>
                <TextInput
                  style={styles.detailInput}
                  placeholder="Ví dụ: 456 Cầu Giấy, Phường Dịch Vọng..."
                  placeholderTextColor={colors.textMuted}
                  value={receiverDetail}
                  onChangeText={setReceiverDetail}
                />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <TouchableOpacity
                  style={styles.addressPickerBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowCountryModal(true)}
                >
                  <Ionicons name="globe-outline" size={20} color={colors.primary} />
                  <Text style={styles.addressPickerText} numberOfLines={1}>
                    {receiverCountry}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.detailLabel}>Địa chỉ chi tiết quốc tế</Text>
                <TextInput
                  style={styles.detailInput}
                  placeholder="Street address, City, Zipcode..."
                  placeholderTextColor={colors.textMuted}
                  value={receiverDetail}
                  onChangeText={setReceiverDetail}
                />
              </React.Fragment>
            )}
          </View>

          {/* 3. CARD THÔNG TIN HÀNG HÓA */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Thông tin hàng hóa</Text>

            {shippingScope === 'DOMESTIC' ? (
              <View style={[styles.radioGroupRow, { marginVertical: spacing.sm }]}>
                <TouchableOpacity
                  style={styles.radioOption}
                  activeOpacity={0.8}
                  onPress={() => setPackageType('PARCEL')}
                >
                  <Ionicons
                    name={packageType === 'PARCEL' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={packageType === 'PARCEL' ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.radioLabel}>Bưu kiện</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  activeOpacity={0.8}
                  onPress={() => setPackageType('DOCUMENT')}
                >
                  <Ionicons
                    name={packageType === 'DOCUMENT' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={packageType === 'DOCUMENT' ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.radioLabel}>Tài liệu</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* KHỐI LƯỢNG */}
            <Text style={styles.subTitleLabel}>Khối lượng *</Text>
            <View style={styles.inputWithSuffixBox}>
              <TextInput
                style={styles.textInputStyle}
                keyboardType="numeric"
                value={weightGrams}
                onChangeText={setWeightGrams}
                placeholder="0"
              />
              <Text style={styles.suffixText}>g</Text>
            </View>

            {/* KÍCH THƯỚC */}
            <Text style={[styles.subTitleLabel, { marginTop: spacing.md }]}>Kích thước</Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionBox}>
                <TextInput
                  style={styles.dimInput}
                  keyboardType="numeric"
                  value={lengthCm}
                  onChangeText={setLengthCm}
                  placeholder="0"
                />
                <Text style={styles.dimSuffix}>cm</Text>
              </View>
              <Text style={styles.dimTimes}>x</Text>
              <View style={styles.dimensionBox}>
                <TextInput
                  style={styles.dimInput}
                  keyboardType="numeric"
                  value={widthCm}
                  onChangeText={setWidthCm}
                  placeholder="0"
                />
                <Text style={styles.dimSuffix}>cm</Text>
              </View>
              <Text style={styles.dimTimes}>x</Text>
              <View style={styles.dimensionBox}>
                <TextInput
                  style={styles.dimInput}
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="0"
                />
                <Text style={styles.dimSuffix}>cm</Text>
              </View>
            </View>

            {/* COD CHECKBOX */}
            {shippingScope === 'DOMESTIC' ? (
              <View style={{ marginTop: spacing.md }}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => setIsCodEnabled(!isCodEnabled)}
                >
                  <Ionicons
                    name={isCodEnabled ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isCodEnabled ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.checkboxLabel}>Thu hộ (COD)</Text>
                </TouchableOpacity>

                {isCodEnabled ? (
                  <View style={[styles.inputWithSuffixBox, { marginTop: spacing.xs }]}>
                    <TextInput
                      style={styles.textInputStyle}
                      keyboardType="numeric"
                      value={codAmount}
                      onChangeText={setCodAmount}
                      placeholder="0"
                    />
                    <Text style={styles.suffixText}>VNĐ</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* FOOTER ACTION BUTTON INSIDE KEYBOARD AVOIDING VIEW */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.88}
            disabled={calculating}
            onPress={handleCalculate}
          >
            {calculating ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitBtnText}>Tra cứu</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* SENDER ADDRESS SELECTOR MODAL */}
      <AddressSelectorModal
        visible={showSenderAddressModal}
        title="Chọn địa chỉ người gửi"
        initialAddress={senderAddress}
        accessToken={token ?? undefined}
        onConfirm={(addr) => {
          setSenderAddress(addr);
          if (addr.addressDetail && !senderDetail) {
            setSenderDetail(addr.addressDetail);
          }
        }}
        onClose={() => setShowSenderAddressModal(false)}
      />

      {/* RECEIVER ADDRESS SELECTOR MODAL */}
      <AddressSelectorModal
        visible={showReceiverAddressModal}
        title="Chọn địa chỉ người nhận"
        initialAddress={receiverAddress}
        accessToken={token ?? undefined}
        onConfirm={(addr) => {
          setReceiverAddress(addr);
          if (addr.addressDetail && !receiverDetail) {
            setReceiverDetail(addr.addressDetail);
          }
        }}
        onClose={() => setShowReceiverAddressModal(false)}
      />

      {/* COUNTRY SELECTOR MODAL */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerHeaderTitle}>Chọn Quốc gia nhận</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {INTERNATIONAL_COUNTRIES.map((country, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.pickerItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setReceiverCountry(country);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{country}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* RESULT MODAL */}
      <Modal
        visible={resultModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setResultModalVisible(false)}
      >
        <View style={styles.resultOverlay}>
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Cước phí ước tính</Text>
              <TouchableOpacity onPress={() => setResultModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {calculatedFee ? (
              <View style={styles.resultBody}>
                <View style={styles.totalFeeCard}>
                  <Text style={styles.totalFeeLabel}>TỔNG CƯỚC ƯỚC TÍNH</Text>
                  <Text style={styles.totalFeeVal}>{formatVnd(calculatedFee.totalFee)}</Text>
                  <Text style={styles.estimatedTimeText}>
                    ⚡ Dự kiến giao: {calculatedFee.estimatedDays}
                  </Text>
                </View>

                <View style={styles.feeBreakdownGroup}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeRowLabel}>Cước vận chuyển chính</Text>
                    <Text style={styles.feeRowVal}>{formatVnd(calculatedFee.baseFee)}</Text>
                  </View>
                  {calculatedFee.codFee > 0 ? (
                    <View style={styles.feeRow}>
                      <Text style={styles.feeRowLabel}>Phí thu hộ (COD)</Text>
                      <Text style={styles.feeRowVal}>{formatVnd(calculatedFee.codFee)}</Text>
                    </View>
                  ) : null}
                  <View style={styles.feeRow}>
                    <Text style={styles.feeRowLabel}>Phí bảo hiểm hàng hóa</Text>
                    <Text style={styles.feeRowVal}>Miễn phí</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.createOrderBtn}
                  activeOpacity={0.88}
                  onPress={handleApplyToCreateOrder}
                >
                  <Ionicons name="cube" size={20} color={colors.surface} />
                  <Text style={styles.createOrderBtnText}>Tạo đơn ngay với cước phí này</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl + 18,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 220,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  radioGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subTitleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.xs + 2,
    marginBottom: 4,
  },
  addressPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    gap: 8,
  },
  addressPickerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  addressPlaceholderText: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  detailInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 13,
    color: colors.textPrimary,
  },
  inputWithSuffixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  textInputStyle: {
    flex: 1,
    paddingVertical: spacing.md - 2,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  suffixText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dimensionBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  dimInput: {
    flex: 1,
    paddingVertical: spacing.md - 2,
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  dimSuffix: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dimTimes: {
    fontSize: 13,
    color: colors.textMuted,
    marginHorizontal: 4,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footerContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.surface,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.lg,
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  resultContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 10,
    ...shadows.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  resultBody: {
    gap: spacing.md,
  },
  totalFeeCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  totalFeeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  totalFeeVal: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 4,
  },
  estimatedTimeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  feeBreakdownGroup: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    gap: 8,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeRowLabel: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  feeRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  createOrderBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xs,
    ...shadows.md,
  },
  createOrderBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.surface,
  },
});
