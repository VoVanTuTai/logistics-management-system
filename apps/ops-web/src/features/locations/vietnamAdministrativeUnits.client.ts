import type {
  VietnamProvinceDto,
  VietnamWardDto,
} from './vietnamAdministrativeUnits.types';
import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';

interface VietnamProvinceApiResponse {
  code?: number;
  name?: string;
  codename?: string;
  division_type?: string;
  divisionType?: string;
  phone_code?: number;
  phoneCode?: number | null;
  wards?: VietnamWardApiResponse[];
}

interface VietnamWardApiResponse {
  code?: number;
  name?: string;
  codename?: string;
  division_type?: string;
  divisionType?: string;
  province_code?: number;
  provinceCode?: number;
}

function mapWard(payload: VietnamWardApiResponse, provinceCode: number): VietnamWardDto | null {
  if (
    typeof payload.code !== 'number' ||
    typeof payload.name !== 'string' ||
    typeof payload.codename !== 'string'
  ) {
    return null;
  }

  return {
    code: payload.code,
    name: payload.name,
    codename: payload.codename,
    divisionType:
      typeof payload.division_type === 'string'
        ? payload.division_type
        : typeof payload.divisionType === 'string'
        ? payload.divisionType
        : '',
    provinceCode:
      typeof payload.province_code === 'number'
        ? payload.province_code
        : typeof payload.provinceCode === 'number'
        ? payload.provinceCode
        : provinceCode,
  };
}

function mapProvince(payload: VietnamProvinceApiResponse): VietnamProvinceDto | null {
  if (
    typeof payload.code !== 'number' ||
    typeof payload.name !== 'string' ||
    typeof payload.codename !== 'string'
  ) {
    return null;
  }

  return {
    code: payload.code,
    name: payload.name,
    codename: payload.codename,
    divisionType:
      typeof payload.division_type === 'string'
        ? payload.division_type
        : typeof payload.divisionType === 'string'
        ? payload.divisionType
        : '',
    phoneCode:
      typeof payload.phone_code === 'number'
        ? payload.phone_code
        : typeof payload.phoneCode === 'number'
        ? payload.phoneCode
        : null,
    wards: Array.isArray(payload.wards)
      ? payload.wards
          .map((ward) => mapWard(ward, payload.code))
          .filter((ward): ward is VietnamWardDto => Boolean(ward))
      : [],
  };
}

const DEFAULT_OFFLINE_PROVINCES: VietnamProvinceDto[] = [
  {
    code: 1,
    name: 'Thành phố Hà Nội',
    divisionType: 'thanh-pho-trung-uong',
    codename: 'ha_noi',
    phoneCode: 24,
    wards: [
      { code: 1, name: 'Phường Hàng Bài', divisionType: 'phuong', codename: 'hang_bai', provinceCode: 1 },
      { code: 2, name: 'Phường Tràng Tiền', divisionType: 'phuong', codename: 'trang_tien', provinceCode: 1 },
      { code: 3, name: 'Phường Lý Thái Tổ', divisionType: 'phuong', codename: 'ly_thai_to', provinceCode: 1 },
      { code: 4, name: 'Phường Kim Mã', divisionType: 'phuong', codename: 'kim_ma', provinceCode: 1 },
      { code: 5, name: 'Phường Dịch Vọng', divisionType: 'phuong', codename: 'dich_vong', provinceCode: 1 },
    ],
  },
  {
    code: 79,
    name: 'Thành phố Hồ Chí Minh',
    divisionType: 'thanh-pho-trung-uong',
    codename: 'ho_chi_minh',
    phoneCode: 28,
    wards: [
      { code: 26734, name: 'Phường Bến Nghé', divisionType: 'phuong', codename: 'ben_nghe', provinceCode: 79 },
      { code: 26737, name: 'Phường Bến Thành', divisionType: 'phuong', codename: 'ben_thanh', provinceCode: 79 },
      { code: 26740, name: 'Phường Tân Định', divisionType: 'phuong', codename: 'tan_dinh', provinceCode: 79 },
    ],
  },
  {
    code: 48,
    name: 'Thành phố Đà Nẵng',
    divisionType: 'thanh-pho-trung-uong',
    codename: 'da_nang',
    phoneCode: 236,
    wards: [
      { code: 20194, name: 'Phường Hải Châu 1', divisionType: 'phuong', codename: 'hai_chau_1', provinceCode: 48 },
      { code: 20197, name: 'Phường Thạch Thang', divisionType: 'phuong', codename: 'thach_thang', provinceCode: 48 },
    ],
  },
];

export const vietnamAdministrativeUnitsClient = {
  listProvinces: async (accessToken: string): Promise<VietnamProvinceDto[]> => {
    try {
      const payload = await opsApiClient.request<unknown>(
        opsEndpoints.masterdata.vietnamAdministrativeUnits,
        { accessToken },
      );

      if (!Array.isArray(payload)) {
        return DEFAULT_OFFLINE_PROVINCES;
      }

      return payload
        .map((province) => mapProvince(province as VietnamProvinceApiResponse))
        .filter((province): province is VietnamProvinceDto => Boolean(province));
    } catch {
      return DEFAULT_OFFLINE_PROVINCES;
    }
  },
};
