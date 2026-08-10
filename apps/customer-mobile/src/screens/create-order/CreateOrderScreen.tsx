import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AddressSelectorModal, type StructuredAddress } from '../../components/AddressSelectorModal';
import { AppHeader } from '../../components/AppHeader';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepIndicator } from '../../components/StepIndicator';
import { MOCK_SHIPPING_SERVICES } from '../../mock/mockServices';
import type { RootStackParamList } from '../../navigation/types';
import { ApiClientError } from '../../services/api/client';
import { pricingApi, type PricingQuoteResponse } from '../../services/api/pricing.api';
import { shipmentApi } from '../../services/api/shipment.api';
import { authStore, useAuthSession } from '../../store/authStore';
import { colors, shadows, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOrder'>;

function formatVnd(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

export function CreateOrderScreen({ navigation }: Props): React.JSX.Element {
  const session = useAuthSession();
  const user = session?.user;

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [liveFee, setLiveFee] = useState<number>(22000);
  const [liveQuote, setLiveQuote] = useState<PricingQuoteResponse | null>(null);

  // Address Modals state
  const [showSenderAddressModal, setShowSenderAddressModal] = useState(false);
  const [showReceiverAddressModal, setShowReceiverAddressModal] = useState(false);

  // Sender details
  const [senderName, setSenderName] = useState(user?.displayName || user?.username || '');
  const [senderPhone, setSenderPhone] = useState(user?.phone || user?.username || '');
  const [senderAddress, setSenderAddress] = useState<StructuredAddress | null>(null);

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

  const handleNextStep = async () => {
    if (step === 1) {
      if (!senderName.trim() || !senderPhone.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số điện thoại người gửi.');
        return;
      }
      if (!senderAddress) {
        Alert.alert('Thiếu thông tin', 'Vui lòng chọn địa chỉ người gửi.');
        return;
      }
      if (!receiverName.trim() || !receiverPhone.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số điện thoại người nhận.');
        return;
      }
      if (!receiverAddress) {
        Alert.alert('Thiếu thông tin', 'Vui lòng chọn địa chỉ người nhận.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!itemName.trim() || !weightKg.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên hàng hóa và khối lượng.');
        return;
      }
      setStep(3);
    } else {
      // Step 3 -> Create Shipment on Live Backend using SAME Merchant API & DTO
      const token = authStore.getAccessToken() || session?.accessToken;
      if (!token) {
        Alert.alert('Phiên làm việc', 'Vui lòng đăng nhập lại để tiếp tục tạo đơn.');
        navigation.replace('Login');
        return;
      }

      if (!senderAddress || !receiverAddress) {
        Alert.alert('Lỗi địa chỉ', 'Vui lòng chọn đầy đủ địa chỉ gửi và địa chỉ nhận.');
        return;
      }

      setSubmitting(true);
      try {
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
            ward: senderAddress.ward,
            hubCode: senderAddress.hubCode,
          },
          receiver: {
            name: receiverName.trim(),
            phone: receiverPhone.trim(),
            address: receiverAddress.composedAddress,
            addressDetail: receiverAddress.addressDetail,
            region: receiverAddress.province,
            province: receiverAddress.province,
            ward: receiverAddress.ward,
            hubCode: receiverAddress.hubCode,
          },
          package: {
            itemType: itemName.trim(),
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
          },
          codAmount: hasCod ? Number(codAmount) || 0 : 0,
          deliveryNote: notes.trim() || null,
          estimatedFee: liveFee,
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
        Alert.alert('Lỗi tạo đơn', msg);
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader title="Tạo đơn hàng mới" onBackPress={handlePrevStep} />
      <StepIndicator currentStep={step} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* STEP 1: ĐỊA CHỈ GỬI & NHẬN (Lấy từ Database Masterdata) */}
        {step === 1 ? (
          <View style={styles.stepBlock}>
            {/* SENDER CARD */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="location" size={20} color={colors.info} />
                <Text style={styles.cardTitle}>Thông tin người gửi</Text>
              </View>

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

              <Text style={styles.fieldLabel}>Địa chỉ người gửi (Chọn từ Database) *</Text>
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
                  <Text style={styles.addressPlaceholderText}>+ Bấm để chọn Tỉnh / Thành / Bưu cục gửi</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
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
    paddingBottom: spacing.xxl,
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
});
