import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  ConfigDto,
  ConfigFilters,
  ConfigWriteInput,
  HubDto,
  HubFilters,
  HubWriteInput,
  NdrReasonDto,
  NdrReasonFilters,
  NdrReasonWriteInput,
  ZoneDto,
  ZoneFilters,
  ZoneWriteInput,
  CourierAreaAssignmentDto,
  CourierAreaAssignmentFilters,
  CourierAreaAssignmentWriteInput,
  VietnamProvinceDto,
} from './masterdata.types';

function buildQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue?.trim();

    if (!value) {
      continue;
    }

    params.set(key, value);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const masterdataClient = {
  listHubs: (accessToken: string | null, filters: HubFilters): Promise<HubDto[]> =>
    opsApiClient.request<HubDto[]>(
      `${opsEndpoints.masterdata.hubs}${buildQueryString({
        code: filters.code,
        name: filters.name,
        zoneCode: filters.zoneCode,
        isActive: filters.isActive,
        q: filters.q,
      })}`,
      { accessToken },
    ),
  createHub: (
    accessToken: string | null,
    payload: HubWriteInput,
  ): Promise<HubDto> =>
    opsApiClient.request<HubDto>(opsEndpoints.masterdata.hubs, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  updateHub: (
    accessToken: string | null,
    hubId: string,
    payload: Partial<HubWriteInput>,
  ): Promise<HubDto> =>
    opsApiClient.request<HubDto>(opsEndpoints.masterdata.hubDetail(hubId), {
      method: 'PATCH',
      accessToken,
      body: payload,
    }),
  listZones: (
    accessToken: string | null,
    filters: ZoneFilters,
  ): Promise<ZoneDto[]> =>
    opsApiClient.request<ZoneDto[]>(
      `${opsEndpoints.masterdata.zones}${buildQueryString({
        code: filters.code,
        name: filters.name,
        parentCode: filters.parentCode,
        isActive: filters.isActive,
        q: filters.q,
      })}`,
      { accessToken },
    ),
  createZone: (
    accessToken: string | null,
    payload: ZoneWriteInput,
  ): Promise<ZoneDto> =>
    opsApiClient.request<ZoneDto>(opsEndpoints.masterdata.zones, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  updateZone: (
    accessToken: string | null,
    zoneId: string,
    payload: Partial<ZoneWriteInput>,
  ): Promise<ZoneDto> =>
    opsApiClient.request<ZoneDto>(opsEndpoints.masterdata.zoneDetail(zoneId), {
      method: 'PATCH',
      accessToken,
      body: payload,
    }),
  listNdrReasons: (
    accessToken: string | null,
    filters: NdrReasonFilters,
  ): Promise<NdrReasonDto[]> =>
    opsApiClient.request<NdrReasonDto[]>(
      `${opsEndpoints.masterdata.ndrReasons}${buildQueryString({
        code: filters.code,
        description: filters.description,
        isActive: filters.isActive,
        q: filters.q,
      })}`,
      { accessToken },
    ),
  createNdrReason: (
    accessToken: string | null,
    payload: NdrReasonWriteInput,
  ): Promise<NdrReasonDto> =>
    opsApiClient.request<NdrReasonDto>(opsEndpoints.masterdata.ndrReasons, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  updateNdrReason: (
    accessToken: string | null,
    ndrReasonId: string,
    payload: Partial<NdrReasonWriteInput>,
  ): Promise<NdrReasonDto> =>
    opsApiClient.request<NdrReasonDto>(
      opsEndpoints.masterdata.ndrReasonDetail(ndrReasonId),
      {
        method: 'PATCH',
        accessToken,
        body: payload,
      },
    ),
  listConfigs: (
    accessToken: string | null,
    filters: ConfigFilters,
  ): Promise<ConfigDto[]> =>
    opsApiClient.request<ConfigDto[]>(
      `${opsEndpoints.masterdata.configs}${buildQueryString({
        key: filters.key,
        scope: filters.scope,
        q: filters.q,
      })}`,
      { accessToken },
    ),
  createConfig: (
    accessToken: string | null,
    payload: ConfigWriteInput,
  ): Promise<ConfigDto> =>
    opsApiClient.request<ConfigDto>(opsEndpoints.masterdata.configs, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  updateConfig: (
    accessToken: string | null,
    configId: string,
    payload: Partial<ConfigWriteInput>,
  ): Promise<ConfigDto> =>
    opsApiClient.request<ConfigDto>(opsEndpoints.masterdata.configDetail(configId), {
      method: 'PATCH',
      accessToken,
      body: payload,
    }),
  listCourierAreaAssignments: (
    accessToken: string | null,
    filters: CourierAreaAssignmentFilters,
  ): Promise<CourierAreaAssignmentDto[]> =>
    opsApiClient.request<CourierAreaAssignmentDto[]>(
      `${opsEndpoints.masterdata.courierAreaAssignments}${buildQueryString({
        courierId: filters.courierId,
        hubCode: filters.hubCode,
        province: filters.province,
        district: filters.district,
        ward: filters.ward,
        isActive: filters.isActive,
      })}`,
      { accessToken },
    ),
  createCourierAreaAssignment: (
    accessToken: string | null,
    payload: CourierAreaAssignmentWriteInput,
  ): Promise<CourierAreaAssignmentDto> =>
    opsApiClient.request<CourierAreaAssignmentDto>(
      opsEndpoints.masterdata.courierAreaAssignments,
      {
        method: 'POST',
        accessToken,
        body: payload,
      },
    ),
  updateCourierAreaAssignment: (
    accessToken: string | null,
    id: string,
    payload: Partial<CourierAreaAssignmentWriteInput>,
  ): Promise<CourierAreaAssignmentDto> =>
    opsApiClient.request<CourierAreaAssignmentDto>(
      opsEndpoints.masterdata.courierAreaAssignmentDetail(id),
      {
        method: 'PATCH',
        accessToken,
        body: payload,
      },
    ),
  deleteCourierAreaAssignment: (
    accessToken: string | null,
    id: string,
  ): Promise<{ success: boolean }> =>
    opsApiClient.request<{ success: boolean }>(
      opsEndpoints.masterdata.courierAreaAssignmentDetail(id),
      {
        method: 'DELETE',
        accessToken,
      },
    ),
  listVietnamAdministrativeUnits: (
    accessToken: string | null,
  ): Promise<VietnamProvinceDto[]> =>
    opsApiClient.request<VietnamProvinceDto[]>(
      opsEndpoints.masterdata.vietnamAdministrativeUnits,
      { accessToken },
    ),
};
