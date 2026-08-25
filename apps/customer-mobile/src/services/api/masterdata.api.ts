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

export const DEFAULT_HUB_RECORDS: HubRecord[] = [
  {
    code: 'HUB-HN-001',
    name: 'Bưu cục Khai thác Hà Nội',
    province: 'Thành phố Hà Nội',
    district: 'Quận Ba Đình',
    ward: 'Phường Điện Biên',
    addressDetail: '12 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội',
    isActive: true,
  },
  {
    code: 'HUB-CB-001',
    name: 'Bưu cục Khai thác Cao Bằng',
    province: 'Tỉnh Cao Bằng',
    district: 'Thành phố Cao Bằng',
    ward: 'Phường Thục Phán',
    addressDetail: 'Trung tâm khai thác Cao Bằng, Phường Thục Phán, Tỉnh Cao Bằng',
    isActive: true,
  },
  {
    code: 'HUB-HCM-001',
    name: 'Bưu cục Khai thác TP. Hồ Chí Minh',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    addressDetail: '100 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    isActive: true,
  },
  {
    code: 'HUB-DN-001',
    name: 'Bưu cục Khai thác Đà Nẵng',
    province: 'Thành phố Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Hải Châu 1',
    addressDetail: '50 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng',
    isActive: true,
  },
];

export function parseHubRecord(raw: any): HubRecord {
  if (!raw) return DEFAULT_HUB_RECORDS[0];
  
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
    else if (nameStr.includes('Cao Bằng')) province = 'Tỉnh Cao Bằng';
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
    return DEFAULT_HUB_RECORDS;
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
