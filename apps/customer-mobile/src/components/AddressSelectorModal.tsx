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

import { LocationPickerMapModal } from './LocationPickerMapModal';
import {
  StandardLocationPickerModal,
  findBestHubForWard,
  getWardsForProvince,
} from './StandardLocationPickerModal';
import {
  DEFAULT_HUB_RECORDS,
  masterdataApi,
  type HubRecord,
  type VietnamProvince,
  type VietnamWard,
} from '../services/api/masterdata.api';
import { colors, shadows, spacing } from '../theme';
import {
  FALLBACK_VIETNAM_PROVINCES,
} from '../utils/vietnamProvincesData';

export { findBestHubForWard };

export interface StructuredAddress {
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  composedAddress: string;
  hubCode: string;
  hubName: string;
  latitude?: number;
  longitude?: number;
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

function cleanName(s?: string | null): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/^(phuong|xa|thi tran|quan|huyen|thanh pho|tp|tinh|thi xa)\s+/, '')
    .trim();
}

export function AddressSelectorModal({
  visible,
  title,
  initialAddress,
  onConfirm,
  onClose,
  accessToken,
}: Props): React.JSX.Element {
  const [provinceList, setProvinceList] = useState<VietnamProvince[]>(
    FALLBACK_VIETNAM_PROVINCES as unknown as VietnamProvince[],
  );
  const [hubList, setHubList] = useState<HubRecord[]>(DEFAULT_HUB_RECORDS);

  const [selectedProvince, setSelectedProvince] = useState<VietnamProvince | null>(null);
  const [selectedWard, setSelectedWard] = useState<VietnamWard | null>(null);
  const [addressDetail, setAddressDetail] = useState<string>(initialAddress?.addressDetail ?? '');
  const [selectedHub, setSelectedHub] = useState<HubRecord | null>(null);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number } | null>(
    initialAddress?.latitude && initialAddress?.longitude
      ? { latitude: initialAddress.latitude, longitude: initialAddress.longitude }
      : null,
  );

  const [loadingData, setLoadingData] = useState(false);
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showWardPicker, setShowWardPicker] = useState(false);
  const [showMapPickerModal, setShowMapPickerModal] = useState(false);

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
          const validProvinces =
            Array.isArray(provinces) && provinces.length > 0
              ? provinces
              : (FALLBACK_VIETNAM_PROVINCES as unknown as VietnamProvince[]);
          const validHubs = Array.isArray(hubs) && hubs.length > 0 ? hubs : DEFAULT_HUB_RECORDS;

          setProvinceList(validProvinces);
          setHubList(validHubs);

          if (initialAddress?.province && validProvinces.length > 0) {
            const initNorm = cleanName(initialAddress.province);
            const foundProv = validProvinces.find(
              (p) =>
                cleanName(p.name) === initNorm ||
                cleanName(p.name).includes(initNorm) ||
                initNorm.includes(cleanName(p.name)),
            );
            if (foundProv) {
              setSelectedProvince(foundProv);
              if (initialAddress?.ward) {
                const targetW = cleanName(initialAddress.ward);
                const targetD = cleanName(initialAddress.district || '');
                const foundWards = getWardsForProvince(foundProv);
                const foundWard = foundWards.find((w) => {
                  const wName = cleanName(w?.name);
                  if (targetD && wName.includes(targetW) && wName.includes(targetD)) return true;
                  return wName.includes(targetW) || targetW.includes(wName);
                });
                if (foundWard) setSelectedWard(foundWard);
              }
            }
            if (initialAddress.hubCode) {
              const matchedH = validHubs.find((h) => h.code === initialAddress.hubCode);
              if (matchedH) setSelectedHub(matchedH);
            }
            setAddressDetail(initialAddress.addressDetail || '');
            if (initialAddress.latitude && initialAddress.longitude) {
              setCoords({ latitude: initialAddress.latitude, longitude: initialAddress.longitude });
            }
          } else {
            setSelectedProvince(null);
            setSelectedWard(null);
            setAddressDetail('');
            setSelectedHub(null);
            setCoords(null);
          }
        }
      } catch {
        // Keep initial fallbacks
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
  }, [visible, initialAddress, accessToken]);

  const normSelectedProv = selectedProvince ? cleanName(selectedProvince.name) : '';
  const matchingHubs = hubList.filter((h) => {
    if (!normSelectedProv) return true;
    const normHubProv = cleanName(h.province);
    const normHubName = cleanName(h.name);
    return (
      normHubProv.includes(normSelectedProv) ||
      normSelectedProv.includes(normHubProv) ||
      normHubName.includes(normSelectedProv) ||
      normSelectedProv.includes(normHubName)
    );
  });

  const handleSave = () => {
    if (!selectedProvince) return;
    if (!selectedWard) return;
    if (!addressDetail.trim()) return;

    const hub = selectedHub || matchingHubs[0] || { code: '001001B001', name: 'Bưu cục trung tâm' };

    let cleanWard = selectedWard.wardName || selectedWard.name;
    let cleanDistrict = selectedWard.district || '';
    if (!cleanDistrict) {
      const match = selectedWard.name.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        cleanWard = match[1].trim();
        cleanDistrict = match[2].trim();
      }
    }

    const composed = [addressDetail.trim(), cleanWard, cleanDistrict, selectedProvince.name]
      .filter(Boolean)
      .join(', ');

    onConfirm({
      province: selectedProvince.name,
      district: cleanDistrict,
      ward: cleanWard,
      addressDetail: addressDetail.trim(),
      composedAddress: composed,
      hubCode: hub.code,
      hubName: hub.name,
      latitude: coords?.latitude ?? initialAddress?.latitude,
      longitude: coords?.longitude ?? initialAddress?.longitude,
    });
    onClose();
  };

  const handleConfirmFromMap = (res: {
    province: string;
    ward: string;
    district?: string;
    street: string;
    composedAddress: string;
    hubCode: string;
    hubName: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const foundProv =
      provinceList.find(
        (p) =>
          normalizeProvinceName(p.name) === normalizeProvinceName(res.province) ||
          p.name.toLowerCase().includes(res.province.toLowerCase()),
      ) || provinceList[0];

    let cleanWard = res.ward;
    let cleanDistrict = res.district || '';
    if (!cleanDistrict) {
      const match = res.ward.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        cleanWard = match[1].trim();
        cleanDistrict = match[2].trim();
      }
    }

    setSelectedProvince(foundProv);
    setSelectedWard({
      code: Math.floor(Math.random() * 9000) + 1000,
      name: cleanDistrict ? `${cleanWard} (${cleanDistrict})` : cleanWard,
      wardName: cleanWard,
      district: cleanDistrict,
      codename: 'map_ward',
      provinceCode: foundProv?.code || 1,
    });
    setAddressDetail(res.street);
    if (res.latitude && res.longitude) {
      setCoords({ latitude: res.latitude, longitude: res.longitude });
    }

    const foundHub =
      hubList.find((h) => h.code === res.hubCode) || {
        code: res.hubCode,
        name: res.hubName,
        province: res.province,
        district: res.district,
        ward: res.ward,
        addressDetail: res.street,
      };
    setSelectedHub(foundHub);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>Chuẩn danh mục Hub Admin quản lý</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formBlock}>
              {/* 0. GPS MAP PICKER ACTION BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.gpsMapPickerBtn}
                onPress={() => setShowMapPickerModal(true)}
              >
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.gpsMapPickerBtnText}>Định vị vị trí GPS / Chọn trên bản đồ</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>

              <View style={styles.orDividerRow}>
                <View style={styles.orDividerLine} />
                <Text style={styles.orDividerText}>hoặc nhập theo form chuẩn</Text>
                <View style={styles.orDividerLine} />
              </View>

              {/* 1. SELECT PROVINCE */}
              <Text style={styles.fieldLabel}>1. Chọn Tỉnh / Thành phố *</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.pickerBtn}
                onPress={() => setShowProvincePicker(true)}
              >
                <Text style={[styles.pickerBtnText, !selectedProvince && styles.placeholderText]}>
                  {selectedProvince?.name || 'Bấm để chọn Tỉnh / Thành phố (34 Tỉnh/TP khả dụng)'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 2. SELECT WARD & HUB */}
              <Text style={styles.fieldLabel}>2. Chọn Phường / Xã & Bưu cục phát *</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.pickerBtn, !selectedProvince && styles.pickerBtnDisabled]}
                disabled={!selectedProvince}
                onPress={() => {
                  if (selectedProvince) setShowWardPicker(true);
                }}
              >
                <Text style={[styles.pickerBtnText, !selectedWard && styles.placeholderText]}>
                  {selectedWard
                    ? `${selectedWard.wardName || selectedWard.name} - ${selectedHub?.name || 'Bưu cục'} (${selectedHub?.code || ''})`
                    : selectedProvince
                    ? 'Bấm để chọn Phường / Xã & Bưu cục phát'
                    : 'Vui lòng chọn Tỉnh / Thành phố trước'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 3. DETAIL ADDRESS */}
              <Text style={styles.fieldLabel}>3. Địa chỉ chi tiết (Số nhà, Tên đường, Tòa nhà) *</Text>
              <TextInput
                style={styles.detailInput}
                placeholder="Ví dụ: 123 Nguyễn Trãi, Tòa Landmark 81..."
                placeholderTextColor={colors.textMuted}
                value={addressDetail}
                onChangeText={setAddressDetail}
              />

              {/* 4. LINKED HUB CARD (KHỚP 100% DATABASE ADMIN) */}
              <Text style={styles.fieldLabel}>4. Bưu cục phục vụ khu vực này (Hub Database)</Text>
              <View style={styles.hubBanner}>
                <View style={styles.hubHeaderRow}>
                  <Ionicons name="business" size={18} color={colors.primary} />
                  <Text style={styles.hubTitle}>Bưu cục liên kết trực tiếp</Text>
                  <View style={styles.hubKhopChip}>
                    <Text style={styles.hubKhopChipText}>• Khớp 100% Hub Admin</Text>
                  </View>
                </View>

                {loadingData ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
                ) : selectedHub ? (
                  <View style={styles.hubSelectRow}>
                    <View style={styles.hubTextCol}>
                      <Text style={styles.hubNameText}>
                        [{selectedHub.code}] {selectedHub.name}
                      </Text>
                      <Text style={styles.hubDetailText}>
                        Khu vực: {selectedHub.province ?? ''} {selectedHub.addressDetail ? `- ${selectedHub.addressDetail}` : ''}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noHubText}>Tự động đồng bộ Hub theo Phường / Xã đã chọn</Text>
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
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* PROVINCE PICKER MODAL */}
      <StandardLocationPickerModal
        visible={showProvincePicker}
        type="PROVINCE"
        selectedProvince={selectedProvince}
        onSelectProvince={(p) => {
          setSelectedProvince(p);
          setSelectedWard(null);
          setSelectedHub(null);
        }}
        onClose={() => setShowProvincePicker(false)}
        accessToken={accessToken}
      />

      {/* WARD & HUB PICKER MODAL */}
      <StandardLocationPickerModal
        visible={showWardPicker}
        type="WARD_HUB"
        selectedProvince={selectedProvince}
        selectedWard={selectedWard}
        selectedHubCode={selectedHub?.code}
        onSelectWardAndHub={(w, h) => {
          setSelectedWard(w);
          setSelectedHub(h);
        }}
        onClose={() => setShowWardPicker(false)}
        accessToken={accessToken}
      />

      {/* GPS MAP PICKER MODAL */}
      <LocationPickerMapModal
        visible={showMapPickerModal}
        onClose={() => setShowMapPickerModal(false)}
        onConfirmLocation={handleConfirmFromMap}
        accessToken={accessToken}
      />
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
    maxHeight: '90%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    paddingTop: spacing.md,
  },
  formBlock: {
    gap: 12,
  },
  gpsMapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  gpsMapPickerBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    marginLeft: 8,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orDividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  pickerBtnDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },
  pickerBtnText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  detailInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  hubBanner: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: spacing.md,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hubTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  hubKhopChip: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubKhopChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  hubSelectRow: {
    marginTop: 2,
  },
  hubTextCol: {
    flex: 1,
  },
  hubNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
  },
  hubDetailText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noHubText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.sm,
  },
  saveBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
  saveBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});
