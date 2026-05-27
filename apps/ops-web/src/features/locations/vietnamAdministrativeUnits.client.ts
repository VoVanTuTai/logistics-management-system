import type {
  VietnamProvinceDto,
  VietnamWardDto,
} from './vietnamAdministrativeUnits.types';

const VIETNAM_PROVINCES_API_URL = 'https://provinces.open-api.vn/api/v2/?depth=2';

interface VietnamProvinceApiResponse {
  code?: number;
  name?: string;
  codename?: string;
  division_type?: string;
  phone_code?: number;
  wards?: VietnamWardApiResponse[];
}

interface VietnamWardApiResponse {
  code?: number;
  name?: string;
  codename?: string;
  division_type?: string;
  province_code?: number;
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
      typeof payload.division_type === 'string' ? payload.division_type : '',
    provinceCode:
      typeof payload.province_code === 'number' ? payload.province_code : provinceCode,
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
      typeof payload.division_type === 'string' ? payload.division_type : '',
    phoneCode: typeof payload.phone_code === 'number' ? payload.phone_code : null,
    wards: Array.isArray(payload.wards)
      ? payload.wards
          .map((ward) => mapWard(ward, payload.code))
          .filter((ward): ward is VietnamWardDto => Boolean(ward))
      : [],
  };
}

export const vietnamAdministrativeUnitsClient = {
  listProvinces: async (): Promise<VietnamProvinceDto[]> => {
    const response = await fetch(VIETNAM_PROVINCES_API_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Không tải được dữ liệu địa chỉ Việt Nam (${response.status}).`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error('Dữ liệu địa chỉ Việt Nam không đúng định dạng.');
    }

    return payload
      .map((province) => mapProvince(province as VietnamProvinceApiResponse))
      .filter((province): province is VietnamProvinceDto => Boolean(province));
  },
};
