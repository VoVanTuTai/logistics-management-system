import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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

function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
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

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

  // 4. Spatial proximity match if GPS coords available
  if (coords?.latitude && coords?.longitude) {
    let nearest: HubRecord | null = null;
    let minDist = Infinity;
    for (const h of hubs) {
      if (typeof h.latitude === 'number' && typeof h.longitude === 'number') {
        const d = calculateDistanceKm(coords.latitude, coords.longitude, h.latitude, h.longitude);
        if (d < minDist) {
          minDist = d;
          nearest = h;
        }
      }
    }
    if (nearest && minDist <= 25) {
      return nearest;
    }
  }

  // 5. Central provincial hub or first available hub
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

const COMMON_WARDS_BY_PROVINCE: Record<string, string[]> = {
  'hồ chí minh': [
    'Phường An Nhơn (Quận Gò Vấp)',
    'Phường 15 (Quận Gò Vấp)',
    'Phường 10 (Quận Gò Vấp)',
    'Phường An Phú Đông (Quận 12)',
    'Phường Thạnh Lộc (Quận 12)',
    'Phường Tân Chánh Hiệp (Quận 12)',
    'Phường Hiệp Thành (Quận 12)',
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
  'cao bằng': [
    'Thành phố Cao Bằng',
    'Huyện Bảo Lâm',
    'Huyện Bảo Lạc',
    'Huyện Hà Quảng',
    'Huyện Trùng Khánh',
    'Huyện Hạ Lang',
    'Huyện Quảng Hòa',
    'Huyện Hòa An',
    'Huyện Nguyên Bình',
    'Huyện Thạch An',
    'Phường Hợp Giang (TP. Cao Bằng)',
    'Phường Sông Hiến (TP. Cao Bằng)',
    'Phường Đề Thám (TP. Cao Bằng)',
    'Phường Tân Giang (TP. Cao Bằng)',
    'Thị trấn Bảo Lạc (Huyện Bảo Lạc)',
    'Thị trấn Pác Miầu (Huyện Bảo Lâm)',
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

  // 3. Fallback to rich ward dictionary
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
  const [provinceList, setProvinceList] = useState<VietnamProvince[]>(FALLBACK_VIETNAM_PROVINCES as unknown as VietnamProvince[]);
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
  const [stepView, setStepView] = useState<'FORM' | 'SELECT_PROVINCE' | 'SELECT_WARD' | 'SELECT_HUB'>('FORM');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMapPickerModal, setShowMapPickerModal] = useState(false);
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
          const validProvinces = Array.isArray(provinces) && provinces.length > 0
            ? provinces
            : (FALLBACK_VIETNAM_PROVINCES as unknown as VietnamProvince[]);
          const validHubs = Array.isArray(hubs) && hubs.length > 0 ? hubs : DEFAULT_HUB_RECORDS;

          setProvinceList(validProvinces);
          setHubList(validHubs);

          // If initialAddress exists, match existing province and ward safely
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
            // When initialAddress is null/empty (e.g. fresh receiver address selection):
            setSelectedProvince(null);
            setSelectedWard(null);
            setAddressDetail('');
            setSelectedHub(null);
            setCoords(null);
          }
        }
      } catch {
        // Keep initial fallbacks on error
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
  }, [visible, initialAddress]);

  // Find all hubs matching current selected province
  const normSelectedProv = selectedProvince ? cleanName(selectedProvince.name) : '';

  const matchedDirectHubs = hubList.filter((h) => {
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

  const matchingHubs = matchedDirectHubs.length > 0 ? matchedDirectHubs : hubList;

  // Auto-pick best matching hub when province or ward changes, or initial load
  useEffect(() => {
    if (selectedProvince && matchingHubs.length > 0) {
      if (selectedWard) {
        let cleanWard = selectedWard.wardName || selectedWard.name;
        let cleanDistrict = selectedWard.district || '';
        if (!cleanDistrict) {
          const match = selectedWard.name.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            cleanWard = match[1].trim();
            cleanDistrict = match[2].trim();
          }
        }

        const bestHub = findBestHubForWard(cleanWard, cleanDistrict, coords, matchingHubs);
        if (bestHub) {
          setSelectedHub(bestHub);
          return;
        }
      }

      // Prioritize existing hub if it already matches current province
      const currentMatches = selectedHub && matchingHubs.some((h) => h.code === selectedHub.code);
      if (!currentMatches) {
        setSelectedHub(matchingHubs[0]);
      }
    }
  }, [selectedProvince, selectedWard, coords, hubList]);

  const rawAvailableWards = selectedProvince ? getWardsForProvince(selectedProvince) : [];
  const availableWards = selectedWard && !rawAvailableWards.some((w) => w.code === selectedWard.code)
    ? [selectedWard, ...rawAvailableWards]
    : rawAvailableWards;

  const handleSave = () => {
    if (!selectedProvince) return;
    if (!selectedWard) return;
    if (!addressDetail.trim()) return;

    const hub = selectedHub || matchingHubs[0] || { code: 'HUB-DEFAULT', name: 'Bưu cục trung tâm' };

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
    const foundProv = provinceList.find(
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

    const foundHub = hubList.find((h) => h.code === res.hubCode) || {
      code: res.hubCode,
      name: res.hubName,
      province: res.province,
      district: res.district,
      ward: res.ward,
      addressDetail: res.street,
    };
    setSelectedHub(foundHub);
  };

  const queryNorm = removeAccents(searchQuery ?? '');
  const filteredProvinces = provinceList.filter((p) =>
    removeAccents(p?.name ?? '').includes(queryNorm),
  );
  const filteredWards = availableWards.filter((w) =>
    removeAccents(w?.name ?? '').includes(queryNorm),
  );
  const filteredMatchingHubs = matchingHubs.filter((h) =>
    removeAccents(h?.name ?? '').includes(queryNorm) ||
    removeAccents(h?.code ?? '').includes(queryNorm),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent={true} onRequestClose={onClose}>
      <View style={stepView === 'FORM' ? styles.overlay : styles.overlaySelection}>
        {stepView === 'FORM' ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.sheetContainer,
              Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight },
            ]}
          >
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
                    <Text style={styles.orDividerText}>hoặc chọn bên dưới</Text>
                    <View style={styles.orDividerLine} />
                  </View>
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
              </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <View
            style={[
              styles.sheetContainerSelection,
              Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight },
            ]}
          >
            <View style={styles.selectionContainer}>
              {/* PINNED HEADER (CỐ ĐỊNH Ở TRÊN, KHÔNG BỊ TRÔI HOẶC ẨN) */}
              <View style={styles.selectionHeader}>
                <TouchableOpacity
                  style={styles.selectionBackBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setStepView('FORM');
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.primary} />
                  <Text style={styles.selectionBackText}>Quay lại</Text>
                </TouchableOpacity>

                <View style={styles.selectionTitleContainer}>
                  <Text style={styles.selectionTitle} numberOfLines={1}>
                    {stepView === 'SELECT_PROVINCE'
                      ? 'Chọn Tỉnh / Thành phố'
                      : stepView === 'SELECT_WARD'
                      ? `Phường / Xã (${selectedProvince?.name || ''})`
                      : `Bưu cục phục vụ (${selectedProvince?.name || 'khu vực'})`}
                  </Text>
                </View>

                <View style={styles.selectionCountBadge}>
                  <Text style={styles.selectionCountText}>
                    {stepView === 'SELECT_PROVINCE'
                      ? `${filteredProvinces.length} Tỉnh/TP`
                      : stepView === 'SELECT_WARD'
                      ? `${filteredWards.length} xã/phường`
                      : `${filteredMatchingHubs.length} bưu cục`}
                  </Text>
                </View>
              </View>

              {/* PINNED SEARCH BAR (CỐ ĐỊNH, KHÔNG BỊ BÀN PHÍM CHE HOẶC CUỘN MẤT) */}
              <View style={styles.searchBarWrapper}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.pinnedSearchInput}
                  placeholder={
                    stepView === 'SELECT_PROVINCE'
                      ? 'Tìm Tỉnh / Thành phố (ví dụ: Hà Nội, Hồ Chí Minh)...'
                      : stepView === 'SELECT_WARD'
                      ? 'Tìm Phường / Xã (ví dụ: An Nhơn, Bến Nghé)...'
                      : 'Tìm bưu cục theo tên hoặc mã...'
                  }
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* SCROLLABLE LIST OF LOCATIONS (CUỘN ĐỘC LẬP TRÊN BÀN PHÍM) */}
              <ScrollView
                style={styles.selectionScroll}
                contentContainerStyle={styles.selectionScrollContent}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={true}
              >
                {/* 1. SELECT PROVINCE */}
                {stepView === 'SELECT_PROVINCE' && (
                  loadingData ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
                  ) : filteredProvinces.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                      <Text style={styles.emptyStateTitle}>Không tìm thấy Tỉnh / Thành phố</Text>
                      <Text style={styles.emptyStateSub}>
                        Không có kết quả khớp với "{searchQuery}". Vui lòng thử từ khóa không dấu.
                      </Text>
                    </View>
                  ) : (
                    filteredProvinces.map((item) => {
                      const isSelected = selectedProvince?.code === item.code;
                      const wardCount = Array.isArray(item.wards) && item.wards.length > 0
                        ? item.wards.length
                        : getWardsForProvince(item).length;

                      return (
                        <TouchableOpacity
                          key={item.code}
                          style={[styles.provinceOptionRow, isSelected && styles.provinceOptionRowSelected]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedProvince(item);
                            setSelectedWard(null);
                            setSearchQuery('');
                            setStepView('FORM');
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={styles.provinceNameRow}>
                              <Text style={[styles.provinceNameText, isSelected && styles.provinceNameTextSelected]}>
                                {item.name}
                              </Text>
                              <View style={styles.provinceActiveBadge}>
                                <Text style={styles.provinceActiveBadgeText}>Toàn quốc</Text>
                              </View>
                            </View>
                            <Text style={styles.provinceSubText}>
                              {wardCount} Phường / Xã khả dụng kết nối mạng lưới bưu cục
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
                )}

                {/* 2. SELECT WARD */}
                {stepView === 'SELECT_WARD' && (
                  filteredWards.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                      <Text style={styles.emptyStateTitle}>Không tìm thấy Phường / Xã</Text>
                      <Text style={styles.emptyStateSub}>
                        Không có phường/xã nào khớp với "{searchQuery}". Vui lòng kiểm tra lại chính tả hoặc chọn tỉnh thành khác.
                      </Text>
                    </View>
                  ) : (
                    filteredWards.map((item) => {
                      const isSelected = selectedWard?.code === item.code || selectedWard?.name === item.name;

                      // Phân giải bưu cục phục vụ trực tiếp chuẩn Ops
                      let cleanWard = item.wardName || item.name;
                      let cleanDistrict = item.district || '';
                      if (!cleanDistrict) {
                        const match = item.name.match(/^(.*?)\s*\((.*?)\)$/);
                        if (match) {
                          cleanWard = match[1].trim();
                          cleanDistrict = match[2].trim();
                        }
                      }
                      const designatedHub = findBestHubForWard(cleanWard, cleanDistrict, coords, matchingHubs);

                      return (
                        <TouchableOpacity
                          key={item.code}
                          style={[styles.wardOptionRow, isSelected && styles.wardOptionRowSelected]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedWard(item);
                            if (designatedHub) {
                              setSelectedHub(designatedHub);
                            }
                            setSearchQuery('');
                            setStepView('FORM');
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={styles.wardNameRow}>
                              <Text style={[styles.wardNameText, isSelected && styles.wardNameTextSelected]}>
                                {item.name}
                              </Text>
                              <View style={styles.wardActiveBadge}>
                                <Text style={styles.wardActiveBadgeText}>Khả dụng</Text>
                              </View>
                            </View>
                            {designatedHub && (
                              <View style={styles.wardHubRow}>
                                <Ionicons name="business" size={13} color={colors.primary} />
                                <Text style={styles.wardHubText} numberOfLines={1}>
                                  Bưu cục phục vụ: <Text style={styles.wardHubCode}>[{designatedHub.code}]</Text> {designatedHub.name}
                                </Text>
                              </View>
                            )}
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

                {/* 3. SELECT HUB */}
                {stepView === 'SELECT_HUB' && (
                  filteredMatchingHubs.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                      <Text style={styles.emptyStateTitle}>Không tìm thấy bưu cục</Text>
                      <Text style={styles.emptyStateSub}>
                        Không có bưu cục nào khớp với "{searchQuery}".
                      </Text>
                    </View>
                  ) : (
                    filteredMatchingHubs.map((item) => {
                      const isSelected = selectedHub?.code === item.code;
                      return (
                        <TouchableOpacity
                          key={item.code}
                          style={[styles.hubOptionRow, isSelected && styles.hubOptionRowSelected]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedHub(item);
                            setSearchQuery('');
                            setStepView('FORM');
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={styles.hubOptionNameRow}>
                              <Text style={[styles.hubOptionCodeText, isSelected && styles.hubOptionCodeTextSelected]}>
                                [{item.code}]
                              </Text>
                              <Text style={[styles.hubOptionNameText, isSelected && styles.hubOptionNameTextSelected]} numberOfLines={1}>
                                {item.name}
                              </Text>
                            </View>
                            <Text style={styles.hubOptionAddressText} numberOfLines={2}>
                              {item.addressDetail ? `${item.addressDetail}, ` : ''}{item.district ? `${item.district}, ` : ''}{item.province}
                            </Text>
                            <View style={styles.hubActiveChip}>
                              <Ionicons name="checkmark-done" size={12} color="#15803d" />
                              <Text style={styles.hubActiveChipText}>Bưu cục đang hoạt động</Text>
                            </View>
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
          </View>
        )}
      </View>

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
  overlaySelection: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'flex-start',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === 'ios' ? '88%' : '90%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sheetContainerSelection: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'android' ? 36 : 48,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  selectionContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  selectionBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  selectionBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  selectionTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selectionCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  selectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  pinnedSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  searchClearBtn: {
    padding: 4,
  },
  selectionScroll: {
    flex: 1,
  },
  selectionScrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  provinceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  provinceOptionRowSelected: {
    backgroundColor: colors.primaryLight + '55',
  },
  provinceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  provinceNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  provinceNameTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  provinceActiveBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  provinceActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  provinceSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  wardOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  wardOptionRowSelected: {
    backgroundColor: colors.primaryLight + '55',
  },
  wardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wardNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  wardNameTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  wardActiveBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  wardActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  wardHubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  wardHubText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    flex: 1,
  },
  wardHubCode: {
    fontWeight: '700',
    color: colors.primary,
  },
  hubOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  hubOptionRowSelected: {
    backgroundColor: colors.primaryLight + '55',
  },
  hubOptionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hubOptionCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  hubOptionCodeTextSelected: {
    color: colors.primary,
  },
  hubOptionNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  hubOptionNameTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  hubOptionAddressText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 3,
  },
  hubActiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hubActiveChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#15803d',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  gpsMapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    marginBottom: spacing.xs,
  },
  gpsMapPickerBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
    marginLeft: 6,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
    gap: 8,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  orDividerText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
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
    flex: 1,
    paddingRight: 8,
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
    flex: 1,
    paddingRight: 8,
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
