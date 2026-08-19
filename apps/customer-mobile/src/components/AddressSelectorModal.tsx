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
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  masterdataApi,
  type HubRecord,
  type VietnamProvince,
  type VietnamWard,
} from '../services/api/masterdata.api';
import { colors, shadows, spacing } from '../theme';

export interface StructuredAddress {
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  composedAddress: string;
  hubCode: string;
  hubName: string;
}

interface Props {
  visible: boolean;
  title: string;
  initialAddress?: StructuredAddress | null;
  onConfirm: (address: StructuredAddress) => void;
  onClose: () => void;
  accessToken?: string;
}

function normalizeProvinceName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^thành phố\s+/, '')
    .replace(/^tỉnh\s+/, '')
    .trim();
}

const COMMON_WARDS_BY_PROVINCE: Record<string, string[]> = {
  'hồ chí minh': [
    'Phường Bến Nghé (Quận 1)',
    'Phường Bến Thành (Quận 1)',
    'Phường Tân Định (Quận 1)',
    'Phường Phạm Ngũ Lão (Quận 1)',
    'Phường 1 (Quận 3)',
    'Phường 2 (Quận 5)',
    'Phường 6 (Quận 3)',
    'Phường Võ Thị Sáu (Quận 3)',
    'Phường Thảo Điền (TP. Thủ Đức)',
    'Phường An Phú (TP. Thủ Đức)',
    'Phường Linh Trung (TP. Thủ Đức)',
    'Phường Tân Thuận Đông (Quận 7)',
    'Phường Tân Phong (Quận 7)',
    'Phường 14 (Quận Bình Thạnh)',
    'Phường 2 (Quận Tân Bình)',
    'Phường 15 (Quận Gò Vấp)',
  ],
  'hà nội': [
    'Phường Tràng Tiền (Quận Hoàn Kiếm)',
    'Phường Hàng Bạc (Quận Hoàn Kiếm)',
    'Phường Điện Biên (Quận Ba Đình)',
    'Phường Kim Mã (Quận Ba Đình)',
    'Phường Dịch Vọng (Quận Cầu Giấy)',
    'Phường Yên Hòa (Quận Cầu Giấy)',
    'Phường Mỹ Đình 1 (Quận Nam Từ Liêm)',
    'Phường Mỹ Đình 2 (Quận Nam Từ Liêm)',
    'Phường Ô Chợ Dừa (Quận Đống Đa)',
    'Phường Bách Khoa (Quận Hai Bà Trưng)',
    'Phường Hoàng Liệt (Quận Hoàng Mai)',
  ],
  'đà nẵng': [
    'Phường Hải Châu 1 (Quận Hải Châu)',
    'Phường Hải Châu 2 (Quận Hải Châu)',
    'Phường Thạch Thang (Quận Hải Châu)',
    'Phường Phước Mỹ (Quận Sơn Trà)',
    'Phường An Hải Bắc (Quận Sơn Trà)',
    'Phường Khuê Trung (Quận Cẩm Lệ)',
    'Phường Hòa Khánh Bắc (Quận Liên Chiểu)',
  ],
  'hải phòng': [
    'Phường Minh Khai (Quận Hồng Bàng)',
    'Phường Hoàng Văn Thụ (Quận Hồng Bàng)',
    'Phường Cầu Đất (Quận Ngô Quyền)',
    'Phường Lạch Tray (Quận Ngô Quyền)',
    'Phường Trần Nguyên Hãn (Quận Lê Chân)',
  ],
  'cần thơ': [
    'Phường Tân An (Quận Ninh Kiều)',
    'Phường An Cư (Quận Ninh Kiều)',
    'Phường An Khánh (Quận Ninh Kiều)',
    'Phường Xuân Khánh (Quận Ninh Kiều)',
    'Phường Cái Khế (Quận Ninh Kiều)',
  ],
};

function getWardsForProvince(province?: VietnamProvince | null): VietnamWard[] {
  if (!province) return [];

  // If province already has populated wards from API, use them
  if (Array.isArray(province.wards) && province.wards.length > 0) {
    return province.wards;
  }

  // Fallback to rich ward dictionary
  const normName = normalizeProvinceName(province.name);
  const matchedCustom = Object.entries(COMMON_WARDS_BY_PROVINCE).find(([key]) =>
    key.includes(normName) || normName.includes(key),
  );

  if (matchedCustom) {
    return matchedCustom[1].map((wName, idx) => ({
      code: (province.code || 1) * 1000 + idx + 1,
      name: wName,
      codename: `ward_${idx + 1}`,
      provinceCode: province.code,
    }));
  }

  // Generic fallback wards for any province
  const genericWardNames = [
    'Phường Trung tâm',
    'Phường 1',
    'Phường 2',
    'Phường 3',
    'Phường 4',
    'Phường 5',
    'Xã Tân Tiến',
    'Xã Hòa Bình',
    'Xã Phú Cường',
  ];

  return genericWardNames.map((wName, idx) => ({
    code: (province.code || 1) * 1000 + idx + 1,
    name: wName,
    codename: `ward_${idx + 1}`,
    provinceCode: province.code,
  }));
}

export function AddressSelectorModal({
  visible,
  title,
  initialAddress,
  onConfirm,
  onClose,
  accessToken,
}: Props): React.JSX.Element {
  const [provinceList, setProvinceList] = useState<VietnamProvince[]>(FALLBACK_VIETNAM_PROVINCES);
  const [hubList, setHubList] = useState<HubRecord[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<VietnamProvince | null>(null);
  const [selectedWard, setSelectedWard] = useState<VietnamWard | null>(null);
  const [addressDetail, setAddressDetail] = useState<string>(initialAddress?.addressDetail ?? '');
  const [selectedHub, setSelectedHub] = useState<HubRecord | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [stepView, setStepView] = useState<'FORM' | 'SELECT_PROVINCE' | 'SELECT_WARD' | 'SELECT_HUB'>('FORM');
  const [searchQuery, setSearchQuery] = useState('');

  // Load provinces & hubs from masterdata-service DB
  useEffect(() => {
    let isMounted = true;
    const fetchMasterdata = async () => {
      setLoadingData(true);
      try {
        const [provinces, hubs] = await Promise.all([
          masterdataApi.getAdministrativeUnits(accessToken),
          masterdataApi.getHubs(accessToken),
        ]);

        if (isMounted) {
          const validProvinces = Array.isArray(provinces) && provinces.length > 0 ? provinces : FALLBACK_VIETNAM_PROVINCES;
          const validHubs = Array.isArray(hubs) ? hubs : [];

          setProvinceList(validProvinces);
          setHubList(validHubs);

          // If initialAddress exists, match existing province and ward safely
          if (initialAddress?.province && validProvinces.length > 0) {
            const initNorm = normalizeProvinceName(initialAddress.province);
            const foundProv = validProvinces.find(
              (p) => normalizeProvinceName(p.name) === initNorm || normalizeProvinceName(p.name).includes(initNorm),
            );
            if (foundProv) {
              setSelectedProvince(foundProv);
              if (initialAddress?.ward) {
                const initWardName = (initialAddress.ward ?? '').toLowerCase();
                const foundWards = getWardsForProvince(foundProv);
                const foundWard = foundWards.find(
                  (w) => (w?.name ?? '').toLowerCase() === initWardName,
                );
                if (foundWard) setSelectedWard(foundWard);
              }
            }
          }
        }
      } catch {
        // Keep initial FALLBACK_VIETNAM_PROVINCES on error
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    if (visible) {
      fetchMasterdata();
    }
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Find all hubs matching current selected province
  const normSelectedProv = selectedProvince ? normalizeProvinceName(selectedProvince.name) : '';

  const matchingHubs = hubList.filter((h) => {
    if (!normSelectedProv) return true;
    const normHubProv = normalizeProvinceName(h.province);
    const normHubName = normalizeProvinceName(h.name);
    return (
      normHubProv.includes(normSelectedProv) ||
      normSelectedProv.includes(normHubProv) ||
      normHubName.includes(normSelectedProv) ||
      normSelectedProv.includes(normHubName)
    );
  });

  // Auto-pick best matching hub when province changes or initial load
  useEffect(() => {
    if (matchingHubs.length > 0) {
      if (!selectedHub || !matchingHubs.some((h) => h.code === selectedHub.code)) {
        setSelectedHub(matchingHubs[0]);
      }
    } else if (hubList.length > 0 && !selectedHub) {
      setSelectedHub(hubList[0]);
    }
  }, [selectedProvince, hubList]);

  const availableWards = getWardsForProvince(selectedProvince);

  const handleSave = () => {
    if (!selectedProvince) return;
    if (!selectedWard) return;
    if (!addressDetail.trim()) return;

    const hub = selectedHub || matchingHubs[0] || { code: 'HUB-DEFAULT', name: 'Bưu cục trung tâm' };
    const composed = [addressDetail.trim(), selectedWard.name, selectedProvince.name]
      .filter(Boolean)
      .join(', ');

    onConfirm({
      province: selectedProvince.name,
      district: '',
      ward: selectedWard.name,
      addressDetail: addressDetail.trim(),
      composedAddress: composed,
      hubCode: hub.code,
      hubName: hub.name,
    });
    onClose();
  };

  const filteredProvinces = provinceList.filter((p) =>
    (p?.name ?? '').toLowerCase().includes((searchQuery ?? '').toLowerCase()),
  );
  const filteredWards = availableWards.filter((w) =>
    (w?.name ?? '').toLowerCase().includes((searchQuery ?? '').toLowerCase()),
  );
  const filteredMatchingHubs = matchingHubs.filter((h) =>
    (h?.name ?? '').toLowerCase().includes((searchQuery ?? '').toLowerCase()) ||
    (h?.code ?? '').toLowerCase().includes((searchQuery ?? '').toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContainer}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {stepView === 'FORM' ? (
              <View style={styles.formBlock}>
                {/* 1. SELECT PROVINCE */}
                <Text style={styles.fieldLabel}>1. Chọn Tỉnh / Thành phố *</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setStepView('SELECT_PROVINCE');
                  }}
                >
                  <Text style={[styles.pickerBtnText, !selectedProvince && styles.placeholderText]}>
                    {selectedProvince?.name || 'Bấm để chọn Tỉnh / Thành phố'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* 2. SELECT WARD (Requires Province selected first) */}
                <Text style={styles.fieldLabel}>2. Chọn Phường / Xã *</Text>
                <TouchableOpacity
                  style={[styles.pickerBtn, !selectedProvince && styles.pickerBtnDisabled]}
                  disabled={!selectedProvince}
                  onPress={() => {
                    if (!selectedProvince) return;
                    setSearchQuery('');
                    setStepView('SELECT_WARD');
                  }}
                >
                  <Text style={[styles.pickerBtnText, !selectedWard && styles.placeholderText]}>
                    {selectedWard?.name ||
                      (selectedProvince
                        ? 'Bấm để chọn Phường / Xã'
                        : 'Vui lòng chọn Tỉnh / Thành phố trước')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* 3. DETAIL ADDRESS */}
                <Text style={styles.fieldLabel}>3. Địa chỉ chi tiết (Số nhà, Tên đường) *</Text>
                <TextInput
                  style={styles.detailInput}
                  placeholder="Ví dụ: 123 Nguyễn Trãi..."
                  placeholderTextColor={colors.textMuted}
                  value={addressDetail}
                  onChangeText={setAddressDetail}
                />

                {/* 4. LINKED HUB CARD WITH SELECTOR */}
                <Text style={styles.fieldLabel}>4. Bưu cục phục vụ khu vực này (Hub Database)</Text>
                <View style={styles.hubBanner}>
                  <View style={styles.hubHeaderRow}>
                    <Ionicons name="business" size={18} color={colors.primary} />
                    <Text style={styles.hubTitle}>
                      {matchingHubs.length > 1
                        ? `Có ${matchingHubs.length} bưu cục khả dụng (Bấm để thay đổi)`
                        : 'Bưu cục liên kết'}
                    </Text>
                  </View>
                  {loadingData ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
                  ) : selectedHub ? (
                    <TouchableOpacity
                      activeOpacity={matchingHubs.length > 1 ? 0.7 : 1}
                      style={styles.hubSelectRow}
                      onPress={() => {
                        if (matchingHubs.length > 1) {
                          setSearchQuery('');
                          setStepView('SELECT_HUB');
                        }
                      }}
                    >
                      <View style={styles.hubTextCol}>
                        <Text style={styles.hubNameText}>
                          [{selectedHub.code}] {selectedHub.name}
                        </Text>
                        <Text style={styles.hubDetailText}>
                          Khu vực: {selectedHub.province ?? ''} {selectedHub.addressDetail ? `- ${selectedHub.addressDetail}` : ''}
                        </Text>
                      </View>
                      {matchingHubs.length > 1 ? (
                        <View style={styles.changeHubChip}>
                          <Text style={styles.changeHubText}>Đổi bưu cục</Text>
                          <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noHubText}>Tự động chọn Hub theo khu vực</Text>
                  )}
                </View>

                {/* CONFIRM BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.saveBtn,
                    (!selectedProvince || !selectedWard || !addressDetail.trim()) && styles.saveBtnDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!selectedProvince || !selectedWard || !addressDetail.trim()}
                >
                  <Text style={styles.saveBtnText}>Xác nhận địa chỉ này</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* STEP: SELECT PROVINCE */}
            {stepView === 'SELECT_PROVINCE' ? (
              <View style={styles.listBlock}>
                <TouchableOpacity style={styles.backLink} onPress={() => setStepView('FORM')}>
                  <Ionicons name="arrow-back" size={18} color={colors.primary} />
                  <Text style={styles.backLinkText}>Quay lại</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm Tỉnh / Thành phố trong Database..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {loadingData ? (
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  filteredProvinces.map((item) => {
                    const isSelected = selectedProvince?.code === item.code;
                    return (
                      <TouchableOpacity
                        key={item.code}
                        style={styles.optionRow}
                        onPress={() => {
                          setSelectedProvince(item);
                          setSelectedWard(null); // reset ward when province changes
                          setStepView('FORM');
                        }}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                          {item.name}
                        </Text>
                        {isSelected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}

            {/* STEP: SELECT WARD */}
            {stepView === 'SELECT_WARD' ? (
              <View style={styles.listBlock}>
                <TouchableOpacity style={styles.backLink} onPress={() => setStepView('FORM')}>
                  <Ionicons name="arrow-back" size={18} color={colors.primary} />
                  <Text style={styles.backLinkText}>Quay lại form</Text>
                </TouchableOpacity>

                <Text style={styles.listHeaderTitle}>
                  Phường / Xã thuộc {selectedProvince?.name}
                </Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm Phường / Xã..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {filteredWards.map((item) => {
                  const isSelected = selectedWard?.code === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.optionRow}
                      onPress={() => {
                        setSelectedWard(item);
                        setStepView('FORM');
                      }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                        {item.name}
                      </Text>
                      {isSelected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* STEP: SELECT HUB IN PROVINCE */}
            {stepView === 'SELECT_HUB' ? (
              <View style={styles.listBlock}>
                <TouchableOpacity style={styles.backLink} onPress={() => setStepView('FORM')}>
                  <Ionicons name="arrow-back" size={18} color={colors.primary} />
                  <Text style={styles.backLinkText}>Quay lại form</Text>
                </TouchableOpacity>

                <Text style={styles.listHeaderTitle}>
                  Bưu cục thuộc {selectedProvince?.name || 'khu vực này'} ({matchingHubs.length} bưu cục)
                </Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm bưu cục theo tên hoặc mã..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {filteredMatchingHubs.map((item) => {
                  const isSelected = selectedHub?.code === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.optionRow}
                      onPress={() => {
                        setSelectedHub(item);
                        setStepView('FORM');
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                          [{item.code}] {item.name}
                        </Text>
                        <Text style={styles.optionSubText}>
                          Khu vực: {item.province} {item.addressDetail ? `- ${item.addressDetail}` : ''}
                        </Text>
                      </View>
                      {isSelected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
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
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 80,
  },
  formBlock: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  pickerBtnDisabled: {
    opacity: 0.5,
    backgroundColor: colors.borderSubtle,
  },
  pickerBtnText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  detailInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  hubBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.2)',
  },
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  hubSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubTextCol: {
    flex: 1,
  },
  hubNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  hubDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changeHubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeHubText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  noHubText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  saveBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
  listBlock: {
    gap: spacing.sm,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  optionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionSubText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  optionTextActive: {
    fontWeight: '800',
    color: colors.primary,
  },
});
