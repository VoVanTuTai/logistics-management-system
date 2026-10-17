import React, { useEffect, useState } from 'react';
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../components/AppHeader';
import { AppModal } from '../../components/common/AppModal';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import {
  bankAccountStore,
  POPULAR_BANKS,
  type CustomerBankAccount,
} from '../../store/bankAccountStore';
import { colors, shadows, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BankAccount'>;

export function BankAccountScreen({ navigation }: Props): React.JSX.Element {
  const [account, setAccount] = useState<CustomerBankAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form states
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0]);
  const [showBankPicker, setShowBankPicker] = useState<boolean>(false);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Modal alert
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState<boolean>(false);

  const loadAccount = async () => {
    setLoading(true);
    const data = await bankAccountStore.getBankAccount();
    setAccount(data);
    if (data) {
      const foundBank = POPULAR_BANKS.find(
        (b) => b.code === data.bankCode || b.name === data.bankName,
      );
      if (foundBank) setSelectedBank(foundBank);
      setAccountNumber(data.accountNumber);
      setAccountHolder(data.accountHolder);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const handleSave = async () => {
    const cleanNum = accountNumber.trim().replace(/\s/g, '');
    const cleanHolder = accountHolder.trim().toUpperCase();

    if (!cleanNum) {
      setAlertModal({
        visible: true,
        title: 'Thiếu số tài khoản',
        message: 'Vui lòng nhập số tài khoản ngân hàng.',
        variant: 'error',
      });
      return;
    }

    if (!cleanHolder) {
      setAlertModal({
        visible: true,
        title: 'Thiếu tên chủ tài khoản',
        message: 'Vui lòng nhập tên chủ tài khoản (người thụ hưởng).',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const saved = await bankAccountStore.saveBankAccount({
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: cleanNum,
        accountHolder: cleanHolder,
      });
      setAccount(saved);
      setIsEditing(false);
      setAlertModal({
        visible: true,
        title: 'Lưu thành công',
        message: 'Thông tin tài khoản ngân hàng đã được cập nhật thành công.',
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await bankAccountStore.deleteBankAccount();
    setAccount(null);
    setAccountNumber('');
    setAccountHolder('');
    setIsEditing(true);
    setConfirmDeleteVisible(false);
  };

  const handleStartEdit = () => {
    if (account) {
      const foundBank = POPULAR_BANKS.find(
        (b) => b.code === account.bankCode || b.name === account.bankName,
      );
      if (foundBank) setSelectedBank(foundBank);
      setAccountNumber(account.accountNumber);
      setAccountHolder(account.accountHolder);
    }
    setIsEditing(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <AppHeader
        title="Tài khoản nhận tiền"
        subtitle="Thông tin ngân hàng thụ hưởng"
        onBackPress={() => navigation.goBack()}
        rightAction={
          account && !isEditing ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.headerEditBtn}
              onPress={handleStartEdit}
            >
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải thông tin tài khoản...</Text>
          </View>
        ) : !isEditing && account ? (
          /* VIEW MODE: THẺ NGÂN HÀNG */
          <View style={styles.viewModeWrap}>
            {/* ATM CARD STYLE */}
            <View style={styles.atmCard}>
              <View style={styles.atmCardTop}>
                <View>
                  <Text style={styles.atmCardBankName}>{account.bankName}</Text>
                  <Text style={styles.atmCardBankSub}>{account.bankCode}</Text>
                </View>
                <View style={styles.chipSim}>
                  <Ionicons name="card" size={28} color="#D97706" />
                </View>
              </View>

              <View style={styles.atmCardNumberWrap}>
                <Text style={styles.atmCardNumberLabel}>SỐ TÀI KHOẢN</Text>
                <Text style={styles.atmCardNumberText}>{account.accountNumber}</Text>
              </View>

              <View style={styles.atmCardBottom}>
                <View>
                  <Text style={styles.atmCardHolderLabel}>CHỦ TÀI KHOẢN</Text>
                  <Text style={styles.atmCardHolderText}>{account.accountHolder}</Text>
                </View>
                <Ionicons name="shield-checkmark" size={22} color="#10B981" />
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.editBtn}
                activeOpacity={0.8}
                onPress={handleStartEdit}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.editBtnText}>Chỉnh sửa thông tin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                activeOpacity={0.8}
                onPress={() => setConfirmDeleteVisible(true)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.deleteBtnText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* EDIT / CREATE MODE: FORM NHẬP */
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {account ? 'Cập nhật tài khoản ngân hàng' : 'Thiết lập tài khoản ngân hàng'}
            </Text>

            {/* 1. CHỌN NGÂN HÀNG */}
            <Text style={styles.inputLabel}>Ngân hàng *</Text>
            <TouchableOpacity
              style={styles.bankSelectBox}
              activeOpacity={0.8}
              onPress={() => setShowBankPicker(!showBankPicker)}
            >
              <View style={styles.bankSelectInfo}>
                <Text style={styles.bankSelectName}>{selectedBank.name}</Text>
                <Text style={styles.bankSelectSub}>{selectedBank.fullName}</Text>
              </View>
              <Ionicons
                name={showBankPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* MODAL BOTTOM SHEET CHỌN NGÂN HÀNG */}
            <Modal
              visible={showBankPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowBankPicker(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowBankPicker(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={styles.bankPickerBottomSheet}>
                      <View style={styles.bankPickerHeader}>
                        <Text style={styles.bankPickerTitle}>Chọn ngân hàng thụ hưởng</Text>
                        <TouchableOpacity
                          style={styles.bankPickerCloseBtn}
                          onPress={() => setShowBankPicker(false)}
                        >
                          <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        style={styles.bankPickerScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        {POPULAR_BANKS.map((b) => {
                          const isSelected = selectedBank.code === b.code;
                          return (
                            <TouchableOpacity
                              key={b.code}
                              style={[
                                styles.bankPickerItem,
                                isSelected && styles.bankPickerItemActive,
                              ]}
                              activeOpacity={0.7}
                              onPress={() => {
                                setSelectedBank(b);
                                setShowBankPicker(false);
                              }}
                            >
                              <View style={styles.bankPickerItemLeft}>
                                <View style={[styles.bankLogoCircle, isSelected && styles.bankLogoCircleActive]}>
                                  <Ionicons
                                    name="business"
                                    size={18}
                                    color={isSelected ? colors.primary : colors.textSecondary}
                                  />
                                </View>
                                <View style={styles.bankPickerItemInfo}>
                                  <Text
                                    style={[
                                      styles.bankPickerItemName,
                                      isSelected && styles.bankPickerItemNameActive,
                                    ]}
                                  >
                                    {b.name}
                                  </Text>
                                  <Text style={styles.bankPickerItemSub} numberOfLines={1}>
                                    {b.fullName}
                                  </Text>
                                </View>
                              </View>
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            {/* 2. SỐ TÀI KHOẢN */}
            <Text style={styles.inputLabel}>Số tài khoản *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập số tài khoản"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            {/* 3. TÊN CHỦ TÀI KHOẢN */}
            <Text style={styles.inputLabel}>Tên chủ tài khoản (Viết hoa không dấu) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="NGUYEN VAN A"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={accountHolder}
              onChangeText={setAccountHolder}
            />

            {/* NÚT THAO TÁC */}
            <View style={styles.formActionWrap}>
              <PrimaryButton
                title={account ? 'Lưu thay đổi' : 'Lưu tài khoản'}
                onPress={handleSave}
                loading={saving}
              />

              {account && (
                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  activeOpacity={0.7}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelFormBtnText}>Hủy bỏ</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* CONFIRM DELETE MODAL */}
      <AppModal
        visible={confirmDeleteVisible}
        variant="confirm"
        title="Xóa thông tin tài khoản?"
        message="Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?"
        confirmText="Xóa tài khoản"
        cancelText="Giữ lại"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
      />

      {/* ALERT MODAL */}
      <AppModal
        visible={alertModal.visible}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="Đã hiểu"
        onConfirm={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerEditBtn: {
    padding: 6,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centerLoading: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  viewModeWrap: {
    gap: spacing.lg,
  },
  atmCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: spacing.xl,
    minHeight: 180,
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  atmCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  atmCardBankName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  atmCardBankSub: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '600',
    marginTop: 2,
  },
  chipSim: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  atmCardNumberWrap: {
    marginVertical: spacing.md,
  },
  atmCardNumberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C7D2FE',
    letterSpacing: 0.8,
  },
  atmCardNumberText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 4,
  },
  atmCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  atmCardHolderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C7D2FE',
    letterSpacing: 0.8,
  },
  atmCardHolderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    ...shadows.sm,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteBtn: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  bankSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  bankSelectInfo: {
    flex: 1,
  },
  bankSelectName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bankSelectSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bankPickerBottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...shadows.lg,
  },
  bankPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  bankPickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bankPickerCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
  },
  bankPickerScroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bankPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    marginVertical: 4,
    backgroundColor: colors.surface,
  },
  bankPickerItemActive: {
    backgroundColor: colors.primaryLight,
  },
  bankPickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  bankLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLogoCircleActive: {
    backgroundColor: '#fff',
  },
  bankPickerItemInfo: {
    flex: 1,
  },
  bankPickerItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bankPickerItemNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  bankPickerItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  formActionWrap: {
    marginTop: spacing.lg,
    gap: 8,
  },
  cancelFormBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelFormBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
