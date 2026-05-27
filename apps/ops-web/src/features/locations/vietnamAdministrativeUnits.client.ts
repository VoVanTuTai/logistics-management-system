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

export const vietnamAdministrativeUnitsClient = {
  listProvinces: async (accessToken: string): Promise<VietnamProvinceDto[]> => {
    const payload = await opsApiClient.request<unknown>(
      opsEndpoints.masterdata.vietnamAdministrativeUnits,
      { accessToken },
    );

    if (!Array.isArray(payload)) {
      throw new Error('Dữ liệu địa chỉ Việt Nam không đúng định dạng.');
    }

    return payload
      .map((province) => mapProvince(province as VietnamProvinceApiResponse))
      .filter((province): province is VietnamProvinceDto => Boolean(province));
  },
};
