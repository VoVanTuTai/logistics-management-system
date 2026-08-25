import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { savedAddressStore, type SavedAddress } from '../store/savedAddressStore';
import { colors, shadows, spacing } from '../theme';

interface SavedAddressPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: SavedAddress) => void;
  onManageAddresses: () => void;
}

export function SavedAddressPickerModal({
  visible,
  onClose,
  onSelectAddress,
  onManageAddresses,
}: SavedAddressPickerModalProps): React.JSX.Element {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (visible) {
      savedAddressStore.getAddresses().then(setAddresses);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="book-outline" size={22} color={colors.primary} />
              <Text style={styles.title}>Chọn từ Địa chỉ của tôi</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ADDRESS LIST */}
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => {
                  onSelectAddress(item);
                  onClose();
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.phoneText}>• {item.phone}</Text>
                  </View>

                  {item.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Ionicons name="star" size={11} color="#92400E" />
                      <Text style={styles.defaultBadgeText}>Mặc định</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.addressText} numberOfLines={2}>
                  {item.composedAddress}
                </Text>

                <View style={styles.selectRow}>
                  <View style={styles.selectChip}>
                    <Ionicons name="checkmark-circle-outline" size={15} color={colors.primary} />
                    <Text style={styles.selectChipText}>Chọn địa chỉ này</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có địa chỉ nào được lưu</Text>
              </View>
            }
          />

          {/* FOOTER MANAGE BUTTON */}
          <TouchableOpacity
            style={styles.manageBtn}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              onManageAddresses();
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.manageBtnText}>Thêm hoặc Quản lý địa chỉ của tôi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  header: {
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  phoneText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 6,
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
