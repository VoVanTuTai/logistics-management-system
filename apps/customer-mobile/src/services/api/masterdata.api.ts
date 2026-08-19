import { customerApiClient } from './client';
import { FALLBACK_VIETNAM_PROVINCES } from '../../utils/vietnamProvincesData';

export interface HubRecord {
  id?: string;
  code: string;
  name: string;
  province: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  isActive?: boolean;
}

export interface VietnamWard {
  code: number;
  name: string;
  codename: string;
  provinceCode?: number;
}

export interface VietnamProvince {
  code: number;
  name: string;
  codename: string;
  divisionType?: string;
  phoneCode?: number | null;
  wards?: VietnamWard[];
}

export function parseHubRecord(raw: any): HubRecord {
  if (!raw) return { code: 'HUB-DEFAULT', name: 'Bưu cục trung tâm', province: '' };
  
  let addrObj: any = {};
  if (typeof raw.address === 'string') {
    try {
      addrObj = JSON.parse(raw.address);
    } catch {
      addrObj = {};
    }
  } else if (raw.address && typeof raw.address === 'object') {
    addrObj = raw.address;
  }

  const nameStr = raw.name || '';
  let province = addrObj.province || raw.province || '';

  if (!province) {
    if (nameStr.includes('Hồ Chí Minh')) province = 'Thành phố Hồ Chí Minh';
    else if (nameStr.includes('Hà Nội')) province = 'Thành phố Hà Nội';
    else if (nameStr.includes('Đà Nẵng')) province = 'Thành phố Đà Nẵng';
    else if (nameStr.includes('Bưu cục ')) province = nameStr.replace('Bưu cục ', 'Tỉnh ');
    else province = nameStr;
  }

  const ward = addrObj.ward || raw.ward || '';
  const district = addrObj.district || raw.district || '';
  const addressDetail = addrObj.addressLine || addrObj.addressDetail || raw.addressDetail || '';

  return {
    id: raw.id,
    code: raw.code || '',
    name: nameStr,
    province,
    district,
    ward,
    addressDetail,
    isActive: raw.isActive ?? true,
  };
}

export const masterdataApi = {
  getHubs: async (accessToken?: string): Promise<HubRecord[]> => {
    const endpoints = [
      '/public/masterdata/hubs?isActive=true',
      '/customer/masterdata/hubs?isActive=true',
    ];
    for (const ep of endpoints) {
      try {
        const rawList = await customerApiClient.request<any[]>(ep, {
          method: 'GET',
          accessToken,
        });
        if (Array.isArray(rawList) && rawList.length > 0) {
          return rawList.map(parseHubRecord);
        }
      } catch {
        // try next endpoint
      }
    }
    return [];
  },

  getAdministrativeUnits: async (accessToken?: string): Promise<VietnamProvince[]> => {
    const endpoints = [
      '/public/masterdata/locations/vietnam-administrative-units',
      '/customer/masterdata/locations/vietnam-administrative-units',
    ];
    for (const ep of endpoints) {
      try {
        const res = await customerApiClient.request<VietnamProvince[]>(ep, {
          method: 'GET',
          accessToken,
        });
        if (Array.isArray(res) && res.length > 0) {
          return res;
        }
      } catch {
        // try next endpoint
      }
    }
    return FALLBACK_VIETNAM_PROVINCES as unknown as VietnamProvince[];
  },
};
