import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AddressSelectorModal, type StructuredAddress } from '../../components/AddressSelectorModal';
import { AppErrorModal } from '../../components/common/AppErrorModal';
import { AppModal } from '../../components/common/AppModal';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';
import { authStore } from '../../store/authStore';
import { savedAddressStore, type SavedAddress } from '../../store/savedAddressStore';
import { colors, shadows, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddressManagement'>;

export function AddressManagementScreen({ navigation }: Props): React.JSX.Element {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStructuredAddress, setSelectedStructuredAddress] = useState<StructuredAddress | null>(null);
  const [detailInput, setDetailInput] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Selector Modals
  const [showDbLocationSelector, setShowDbLocationSelector] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const loadData = async () => {
    const list = await savedAddressStore.getAddresses();
    setAddresses(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setName('');
    setPhone('');
    setSelectedStructuredAddress(null);
    setDetailInput('');
    setIsDefault(addresses.length === 0);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: SavedAddress) => {
    setEditingAddressId(item.id);
    setName(item.name);
    setPhone(item.phone);
    setSelectedStructuredAddress({
      province: item.province || '',
      district: item.district || '',
      ward: item.ward || '',
      addressDetail: item.addressDetail || '',
      composedAddress: item.composedAddress || '',
      hubCode: item.hubCode || '',
      hubName: item.hubName || '',
    });
    setDetailInput(item.addressDetail);
    setIsDefault(item.isDefault);
    setShowAddModal(true);
  };

  const handleSaveForm = async () => {
    if (!name.trim()) {
      setErrorModal({ visible: true, title: 'Thiếu thông tin', message: 'Vui lòng nhập họ và tên.' });
      return;
    }
    if (!phone.trim()) {
      setErrorModal({ visible: true, title: 'Thiếu thông tin', message: 'Vui lòng nhập số điện thoại.' });
      return;
    }
    if (!selectedStructuredAddress || !selectedStructuredAddress.province || !selectedStructuredAddress.ward) {
      setErrorModal({ visible: true, title: 'Thiếu địa chỉ', message: 'Vui lòng chọn Tỉnh/Thành phố và Phường/Xã.' });
      return;
    }

    const composed = [
      detailInput.trim(),
      selectedStructuredAddress.ward,
      selectedStructuredAddress.district,
      selectedStructuredAddress.province,
    ]
      .filter(Boolean)
      .join(', ');

    await savedAddressStore.saveAddress({
      id: editingAddressId || undefined,
      name: name.trim(),
      phone: phone.trim(),
      province: selectedStructuredAddress.province,
      district: selectedStructuredAddress.district,
      ward: selectedStructuredAddress.ward,
      addressDetail: detailInput.trim(),
      composedAddress: composed,
      hubCode: selectedStructuredAddress.hubCode,
      hubName: selectedStructuredAddress.hubName,
      isDefault,
    });

    setShowAddModal(false);
    loadData();
  };

  const handleSetDefault = async (id: string) => {
    const list = await savedAddressStore.setDefaultAddress(id);
    setAddresses(list);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const list = await savedAddressStore.deleteAddress(deleteTargetId);
    setAddresses(list);
    setDeleteTargetId(null);
  };

  return (
    <View style={styles.flex}>
      {/* HEADER BAR WITH BACK & (+) ADD BUTTON */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Địa chỉ của tôi</Text>

        <TouchableOpacity style={styles.addHeaderBtn} activeOpacity={0.8} onPress={handleOpenAddModal}>
          <Ionicons name="add" size={22} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* ADDRESS LIST */}
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.userInfoRow}>
                <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.phoneText}>({item.phone})</Text>
              </View>

              {item.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Ionicons name="star" size={11} color="#92400E" />
                  <Text style={styles.defaultBadgeText}>Mặc định</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.divider} />

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={{ marginTop: 2 }} />
              <Text style={styles.addressText}>{item.composedAddress}</Text>
            </View>

            {item.hubName ? (
              <View style={styles.hubTag}>
                <Ionicons name="business-outline" size={13} color={colors.primary} />
                <Text style={styles.hubTagText}>Bưu cục: {item.hubName}</Text>
              </View>
            ) : null}

            {/* ACTION BUTTONS */}
            <View style={styles.actionRow}>
              {!item.isDefault ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.setDefaultBtn}
                  onPress={() => handleSetDefault(item.id)}
                >
                  <Ionicons name="radio-button-off" size={16} color={colors.textMuted} />
                  <Text style={styles.actionBtnText}>Đặt làm mặc định</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.activeDefaultRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={styles.activeDefaultText}>Địa chỉ gửi mặc định</Text>
                </View>
              )}

              <View style={styles.rightActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.editBtn}
                  onPress={() => handleOpenEditModal(item)}
                >
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editBtnText}>Sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.deleteBtn}
                  onPress={() => setDeleteTargetId(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={54} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có địa chỉ nào được tạo</Text>
            <Text style={styles.emptySub}>Bấm dấu (+) phía trên để tạo địa chỉ gửi hàng mặc định.</Text>
            <PrimaryButton title="Thêm địa chỉ ngay" onPress={handleOpenAddModal} style={{ marginTop: spacing.md }} />
          </View>
        }
      />

      {/* ADD / EDIT ADDRESS MODAL */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.formModal}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ gửi hàng mới'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.iconBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
              <InputField
                label="Họ và tên người gửi"
                placeholder="Nhập họ và tên người gửi"
                value={name}
                onChangeText={setName}
                iconName="person-outline"
                required
              />

              <InputField
                label="Số điện thoại người gửi"
                placeholder="09xxxxxxxx"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                iconName="call-outline"
                required
              />

              {/* TỈNH THÀNH / PHƯỜNG XÃ SELECTOR FROM DB */}
              <Text style={styles.fieldLabel}>Tỉnh thành / Phường xã (Database) <Text style={{ color: colors.danger }}>*</Text></Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.pickerBox}
                onPress={() => {
                  setShowAddModal(false);
                  setTimeout(() => setShowDbLocationSelector(true), 150);
                }}
              >
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <Text style={selectedStructuredAddress ? styles.pickerValText : styles.pickerPlaceholder}>
                  {selectedStructuredAddress
                    ? `${selectedStructuredAddress.ward}, ${selectedStructuredAddress.province}`
                    : 'Chọn Tỉnh thành & Phường xã...'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <InputField
                label="Địa chỉ chi tiết (Số nhà, tên đường...)"
                placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
                value={detailInput}
                onChangeText={setDetailInput}
                iconName="home-outline"
              />

              {/* SET DEFAULT SWITCH */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchTitle}>Đặt làm địa chỉ mặc định</Text>
                  <Text style={styles.switchSub}>Tự động điền khi tạo đơn hàng mới</Text>
                </View>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                  thumbColor={isDefault ? colors.primary : '#94A3B8'}
                />
              </View>

              <PrimaryButton
                title="💾 Lưu địa chỉ"
                onPress={handleSaveForm}
                size="lg"
                style={styles.saveSubmitBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DATABASE LOCATION SELECTOR MODAL */}
      <AddressSelectorModal
        visible={showDbLocationSelector}
        title="Chọn Tỉnh thành & Phường xã"
        accessToken={authStore.getAccessToken() || undefined}
        onClose={() => {
          setShowDbLocationSelector(false);
          setTimeout(() => setShowAddModal(true), 150);
        }}
        onConfirm={(addr: StructuredAddress) => {
          setSelectedStructuredAddress(addr);
          setDetailInput(addr.addressDetail || '');
          setShowDbLocationSelector(false);
          setTimeout(() => setShowAddModal(true), 150);
        }}
      />

      {/* ERROR MODAL */}
      <AppErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* DELETE CONFIRM MODAL */}
      <AppModal
        visible={!!deleteTargetId}
        variant="confirm"
        title="Xóa địa chỉ"
        message="Bạn có chắc chắn muốn xóa địa chỉ này khỏi danh sách Địa chỉ của tôi?"
        confirmText="Xóa địa chỉ"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingTop: spacing.xl + 14,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  phoneText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm + 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: spacing.xs,
  },
  addressText: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 19,
    fontWeight: '500',
  },
  hubTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: spacing.sm,
  },
  hubTagText: {
    fontSize: 11.5,
    color: colors.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  setDefaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  activeDefaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDefaultText: {
    fontSize: 12.5,
    color: colors.primary,
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  editBtnText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl + 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  formBody: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.md,
  },
  pickerValText: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textMuted,
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  switchLabelCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  switchSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveSubmitBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
});
