import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddressResult {
  street: string;
  ward: string;
  district: string;
  province: string;
  composedAddress: string;
}

export const locationService = {
  /**
   * Yêu cầu quyền vị trí GPS từ hệ thống thiết bị di động
   */
  requestPermission: async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Lấy tọa độ GPS (Vĩ độ, Kinh độ) thực tế hiện tại của thiết bị
   */
  getCurrentLocation: async (): Promise<LocationCoordinates | null> => {
    try {
      const hasPermission = await locationService.requestPermission();
      if (!hasPermission) return null;

      // 1. Lấy vị trí đã lưu mới nhất để phản hồi tức thì
      const lastLoc = await Location.getLastKnownPositionAsync();
      if (lastLoc && lastLoc.coords && lastLoc.coords.latitude && lastLoc.coords.longitude) {
        return {
          latitude: lastLoc.coords.latitude,
          longitude: lastLoc.coords.longitude,
        };
      }

      // 2. Lấy vị trí GPS hiện tại chính xác
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (currentLoc && currentLoc.coords && currentLoc.coords.latitude && currentLoc.coords.longitude) {
        return {
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude,
        };
      }
    } catch {
      // Bỏ qua lỗi định vị
    }

    // Default Fallback: TP.HCM (An Phú Đông, Q12: 10.867, 106.696)
    return {
      latitude: 10.867,
      longitude: 106.696,
    };
  },

  /**
   * Giải mã Tọa độ GPS (Lat, Lng) ➔ Địa chỉ chi tiết (Tên đường, Phường/Xã chính xác, Tỉnh/Thành)
   */
  reverseGeocode: async (lat: number, lng: number): Promise<GeocodedAddressResult> => {
    // 1. Prioritize OpenStreetMap Reverse Geocoding for exact Ward names in Vietnam
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
        {
          headers: {
            'User-Agent': 'NexusLogisticsApp/1.0',
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const displayName = data.display_name || '';
        const addr = data.address || {};

        const parts = displayName.split(',').map((s: string) => s.trim());

        // Extract Ward (Phường / Xã / Thị trấn) from display name or address attributes
        let ward = parts.find((p: string) => /^(phường|xã|thị trấn)\s+/i.test(p)) ||
                   addr.suburb || addr.quarter || addr.village || addr.town || addr.neighbourhood || addr.residential || addr.subdistrict || '';

        // Extract District (Quận / Huyện / Thị xã)
        let district = parts.find((p: string) => /^(quận|huyện|thị xã)\s+/i.test(p)) ||
                       addr.city_district || addr.county || addr.district || '';

        // Extract Street (Đường / Số nhà)
        const street = addr.road || addr.pedestrian || parts[0] || 'Vị trí trên bản đồ';

        // Extract Province (Tỉnh / Thành phố)
        let province = addr.state || addr.city || addr.province || parts.find((p: string) => /^(thành phố|tỉnh)\s+/i.test(p)) || 'Thành phố Hồ Chí Minh';

        if (province.toLowerCase().includes('hồ chí minh') || province.toLowerCase().includes('ho chi minh')) province = 'Thành phố Hồ Chí Minh';
        else if (province.toLowerCase().includes('hà nội')) province = 'Thành phố Hà Nội';
        else if (province.toLowerCase().includes('đà nẵng')) province = 'Thành phố Đà Nẵng';
        else if (province.toLowerCase().includes('cần thơ')) province = 'Thành phố Cần Thơ';
        else if (province.toLowerCase().includes('cao bằng')) province = 'Tỉnh Cao Bằng';
        else if (!province.startsWith('Tỉnh ') && !province.startsWith('Thành phố ')) {
          province = `Tỉnh ${province}`;
        }

        if (!ward || ward.toLowerCase().includes('trung tâm')) {
          ward = 'Phường An Phú Đông';
        }

        const composed = [street, ward, province].filter(Boolean).join(', ');
        return {
          street,
          ward,
          district,
          province,
          composedAddress: composed,
        };
      }
    } catch {
      // Ignore network errors
    }

    // 2. Fallback Native Expo Location Reverse Geocode
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (results && results.length > 0) {
        const item = results[0];
        const street = [item.streetNumber, item.street || item.name].filter(Boolean).join(' ') || 'Vị trí trên bản đồ';
        const ward = item.subregion || item.district || 'Phường An Phú Đông';
        const district = item.district || '';
        let province = item.region || item.city || 'Thành phố Hồ Chí Minh';

        if (province.toLowerCase().includes('hồ chí minh')) province = 'Thành phố Hồ Chí Minh';
        else if (province.toLowerCase().includes('hà nội')) province = 'Thành phố Hà Nội';
        else if (province.toLowerCase().includes('đà nẵng')) province = 'Thành phố Đà Nẵng';

        const composed = [street, ward, province].filter(Boolean).join(', ');
        return {
          street,
          ward,
          district,
          province,
          composedAddress: composed,
        };
      }
    } catch {
      // Ignore errors
    }

    return {
      street: '1013A Hà Huy Giáp',
      ward: 'Phường An Phú Đông',
      district: 'Quận 12',
      province: 'Thành phố Hồ Chí Minh',
      composedAddress: '1013A Hà Huy Giáp, Phường An Phú Đông, Thành phố Hồ Chí Minh',
    };
  },
};
