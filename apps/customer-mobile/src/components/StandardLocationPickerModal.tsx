import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
  DEFAULT_HUB_RECORDS,
  masterdataApi,
  type HubRecord,
  type VietnamProvince,
  type VietnamWard,
} from '../services/api/masterdata.api';
import { colors, shadows, spacing } from '../theme';
import {
  FALLBACK_VIETNAM_PROVINCES,
  getWardsForProvinceName,
} from '../utils/vietnamProvincesData';

export interface StandardLocationPickerModalProps {
  visible: boolean;
  type: 'PROVINCE' | 'WARD_HUB';
  title?: string;
  selectedProvince?: VietnamProvince | null;
  selectedWard?: VietnamWard | null;
  selectedHubCode?: string | null;
  onSelectProvince?: (province: VietnamProvince) => void;
  onSelectWardAndHub?: (ward: VietnamWard, hub: HubRecord) => void;
  onClose: () => void;
  accessToken?: string;
}

function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
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

function matchStrict(target?: string | null, candidate?: string | null): boolean {
  const t = cleanName(target);
  const c = cleanName(candidate);
  if (!t || !c) return false;
  if (t === c) return true;
  const tNum = t.match(/\d+/);
  const cNum = c.match(/\d+/);
  if (tNum || cNum) {
    return tNum?.[0] === cNum?.[0];
  }
  return t.includes(c) || c.includes(t);
}

function matchDistrict(d1?: string | null, d2?: string | null): boolean {
  if (!d1 || !d2) return true;
  return matchStrict(d1, d2);
}

export function findBestHubForWard(
  cleanWard: string,
  cleanDistrict: string,
  coords: { latitude?: number; longitude?: number } | null,
  hubs: HubRecord[],
): HubRecord | null {
  if (!hubs || hubs.length === 0) return null;

  const targetWard = cleanName(cleanWard);
  const targetDistrict = cleanName(cleanDistrict);

  // 1. Exact Ward AND District match
  if (targetWard && targetDistrict) {
    const exactBoth = hubs.find(
      (h) => cleanName(h.ward) === targetWard && matchStrict(cleanDistrict, h.district || h.name),
    );
    if (exactBoth) return exactBoth;
  }

  // 2. Exact Ward match (district compatible or empty)
  if (targetWard) {
    const exactWard = hubs.find(
      (h) => cleanName(h.ward) === targetWard && matchDistrict(cleanDistrict, h.district),
    );
    if (exactWard) return exactWard;
  }

  // 3. Strict District match
  if (targetDistrict) {
    const distMatch = hubs.find(
      (h) => matchStrict(cleanDistrict, h.district) || matchStrict(cleanDistrict, h.name),
    );
    if (distMatch) return distMatch;
  }

  // 4. Central provincial hub or first available hub
  const centralHub = hubs.find(
    (h) =>
      h.code.includes('001B001') ||
      h.code.includes('079B001') ||
      h.code.includes('048B001') ||
      h.name.includes('Bưu cục Hồ Chí Minh') ||
      h.name.includes('Bưu cục Hà Nội') ||
      h.name.includes('Bưu cục Đà Nẵng'),
  );
  return centralHub || hubs[0];
}

export function getWardsForProvince(province?: VietnamProvince | null): VietnamWard[] {
  if (!province) return [];

  // 1. If province already has populated wards from API or FALLBACK_VIETNAM_PROVINCES, use them
  if (Array.isArray(province.wards) && province.wards.length > 0) {
    return province.wards;
  }

  // 2. Resolve via rich centralized catalog
  const resolved = getWardsForProvinceName(province.name);
  if (resolved && resolved.length > 0) {
    return resolved.map((w, idx) => ({
      code: w.code || (province.code || 1) * 1000 + idx + 1,
      name: w.name,
      wardName: w.wardName,
      district: w.district,
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

export function StandardLocationPickerModal({
  visible,
  type,
  title,
  selectedProvince,
  selectedWard,
  selectedHubCode,
  onSelectProvince,
  onSelectWardAndHub,
  onClose,
  accessToken,
}: StandardLocationPickerModalProps): React.JSX.Element {
  const [provinceList, setProvinceList] = useState<VietnamProvince[]>(
    FALLBACK_VIETNAM_PROVINCES as unknown as VietnamProvince[],
  );
  const [hubList, setHubList] = useState<HubRecord[]>(DEFAULT_HUB_RECORDS);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fetch live masterdata if available
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [provinces, hubs] = await Promise.all([
          masterdataApi.getAdministrativeUnits(accessToken),
          masterdataApi.getHubs(accessToken),
        ]);

        if (isMounted) {
          if (Array.isArray(provinces) && provinces.length > 0) {
            setProvinceList(provinces);
          }
          if (Array.isArray(hubs) && hubs.length > 0) {
            setHubList(hubs);
          }
        }
      } catch {
        // Fallback to embedded seed
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    if (visible) {
      setSearchQuery('');
      fetchData();
    }
    return () => {
      isMounted = false;
    };
  }, [visible, accessToken]);

  // Wards for current selected province
  const availableWards = useMemo(() => {
    if (!selectedProvince) return [];
    return getWardsForProvince(selectedProvince);
  }, [selectedProvince]);

  // Hubs filtered by province
  const matchingHubs = useMemo(() => {
    if (!selectedProvince) return hubList;
    const normProv = cleanName(selectedProvince.name);
    const matched = hubList.filter((h) => {
      const normHubProv = cleanName(h.province);
      const normHubName = cleanName(h.name);
      return (
        normHubProv.includes(normProv) ||
        normProv.includes(normHubProv) ||
        normHubName.includes(normProv) ||
        normProv.includes(normHubName)
      );
    });
    return matched.length > 0 ? matched : hubList;
  }, [selectedProvince, hubList]);

  // Wards enriched with designated Hub managed by Admin
  const wardsWithHubs = useMemo(() => {
    return availableWards.map((w) => {
      let cleanWard = w.wardName || w.name;
      let cleanDistrict = w.district || '';
      if (!cleanDistrict) {
        const match = w.name.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          cleanWard = match[1].trim();
          cleanDistrict = match[2].trim();
        }
      }
      const designatedHub = findBestHubForWard(cleanWard, cleanDistrict, null, matchingHubs);
      return {
        ward: w,
        hub: designatedHub || matchingHubs[0] || {
          code: '001001B001',
          name: 'Bưu cục trung tâm',
          province: selectedProvince?.name || 'Toàn quốc',
        },
      };
    });
  }, [availableWards, matchingHubs, selectedProvince]);

  // Search filtering
  const queryNorm = removeAccents(searchQuery.trim());

  const filteredProvinces = useMemo(() => {
    if (!queryNorm) return provinceList;
    return provinceList.filter((p) => removeAccents(p.name).includes(queryNorm));
  }, [provinceList, queryNorm]);

  const filteredWardsWithHubs = useMemo(() => {
    if (!queryNorm) return wardsWithHubs;
    return wardsWithHubs.filter(
      ({ ward, hub }) =>
        removeAccents(ward.name).includes(queryNorm) ||
        removeAccents(hub.name).includes(queryNorm) ||
        removeAccents(hub.code).includes(queryNorm) ||
        (ward.district && removeAccents(ward.district).includes(queryNorm)),
    );
  }, [wardsWithHubs, queryNorm]);

  const headerTitle =
    title ||
    (type === 'PROVINCE'
      ? 'Chọn Tỉnh / Thành phố'
      : `Chọn Phường / Xã & Bưu cục phát`);

  const headerSubtitle =
    type === 'PROVINCE'
      ? '34 Tỉnh / Thành phố trên toàn quốc'
      : selectedProvince
      ? `${selectedProvince.name} • ${wardsWithHubs.length} địa bàn khả dụng`
      : 'Vui lòng chọn Tỉnh / Thành trước';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight },
        ]}
      >
        {/* FIXED HEADER AT TOP (KHÔNG BỊ ẨN / TRÔI) */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {headerSubtitle}
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {type === 'PROVINCE'
                ? `${filteredProvinces.length} Tỉnh/TP`
                : `${filteredWardsWithHubs.length} Phường/Xã`}
            </Text>
          </View>
        </View>

        {/* FIXED SEARCH BAR AT TOP (CỐ ĐỊNH, KHÔNG BỊ BÀN PHÍM CHE MẤT) */}
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              type === 'PROVINCE'
                ? 'Tìm Tỉnh / Thành phố (Hà Nội, Hồ Chí Minh, Đà Nẵng)...'
                : 'Tìm Phường, Xã hoặc mã Hub (Bến Thành, An Nhơn, 07901...)...'
            }
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* SCROLLABLE LIST OF LOCATIONS */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollListContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={true}
        >
          {loadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải danh mục bưu cục...</Text>
            </View>
          ) : type === 'PROVINCE' ? (
            filteredProvinces.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyStateTitle}>Không tìm thấy Tỉnh / Thành phố</Text>
                <Text style={styles.emptyStateSub}>
                  Không có kết quả khớp với "{searchQuery}". Vui lòng thử tìm không dấu.
                </Text>
              </View>
            ) : (
              filteredProvinces.map((prov) => {
                const isSelected = selectedProvince?.code === prov.code || selectedProvince?.name === prov.name;
                const wardCount = Array.isArray(prov.wards) && prov.wards.length > 0
                  ? prov.wards.length
                  : getWardsForProvince(prov).length;

                return (
                  <TouchableOpacity
                    key={prov.code}
                    style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelectProvince?.(prov);
                      onClose();
                    }}
                  >
                    <View style={styles.itemMainCol}>
                      <View style={styles.itemNameRow}>
                        <Text style={[styles.itemNameText, isSelected && styles.itemNameTextSelected]}>
                          {prov.name}
                        </Text>
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Toàn quốc</Text>
                        </View>
                      </View>
                      <Text style={styles.itemSubText}>
                        {wardCount} Phường / Xã khả dụng
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            filteredWardsWithHubs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyStateTitle}>Không tìm thấy Phường / Xã</Text>
                <Text style={styles.emptyStateSub}>
                  Không có kết quả khớp với "{searchQuery}" trong {selectedProvince?.name || 'tỉnh này'}.
                </Text>
              </View>
            ) : (
              filteredWardsWithHubs.map(({ ward, hub }) => {
                const isSelected =
                  (selectedWard && (selectedWard.code === ward.code || selectedWard.name === ward.name)) ||
                  (selectedHubCode && selectedHubCode === hub.code);

                return (
                  <TouchableOpacity
                    key={`${ward.code}-${hub.code}`}
                    style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelectWardAndHub?.(ward, hub);
                      onClose();
                    }}
                  >
                    <View style={styles.itemMainCol}>
                      <View style={styles.itemNameRow}>
                        <Text style={[styles.itemNameText, isSelected && styles.itemNameTextSelected]}>
                          {ward.name}
                        </Text>
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Khả dụng</Text>
                        </View>
                      </View>

                      {/* RESPONSIBLE HUB INFO (100% DATABASE ADMIN) */}
                      <View style={styles.hubLinkRow}>
                        <Ionicons name="business" size={13} color={colors.primary} />
                        <Text style={styles.hubLinkText} numberOfLines={1}>
                          Bưu cục phát: <Text style={styles.hubCodeText}>[{hub.code}]</Text> {hub.name}
                        </Text>
                      </View>

                      {hub.addressDetail ? (
                        <Text style={styles.hubAddressText} numberOfLines={1}>
                          Địa chỉ: {hub.addressDetail}
                        </Text>
                      ) : null}
                    </View>

                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })
            )
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    ...shadows.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 46,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  itemRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  itemMainCol: {
    flex: 1,
    paddingRight: 8,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  itemNameTextSelected: {
    color: colors.primary,
  },
  activeBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  itemSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  hubLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hubLinkText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  hubCodeText: {
    fontWeight: '800',
    color: colors.primary,
  },
  hubAddressText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptyStateSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
