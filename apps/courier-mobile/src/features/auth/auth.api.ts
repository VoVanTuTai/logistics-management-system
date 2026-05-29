import { useMutation } from '@tanstack/react-query';

import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import type {
  IntrospectInputDto,
  IntrospectResultDto,
  LoginFormValues,
  LoginResultDto,
  LogoutInputDto,
  LogoutResultDto,
  MobilePermissionEffectiveDto,
  RefreshSessionInputDto,
  UserAccountDto,
  UserListFilters,
} from './auth.types';

export const authApi = {
  login: (payload: LoginFormValues): Promise<LoginResultDto> =>
    courierApiClient.request(courierEndpoints.auth.login, {
      method: 'POST',
      body: {
        ...payload,
        roleGroup: 'SHIPPER',
      },
    }),
  refresh: (payload: RefreshSessionInputDto): Promise<LoginResultDto> =>
    courierApiClient.request(courierEndpoints.auth.refresh, {
      method: 'POST',
      body: {
        ...payload,
        roleGroup: 'SHIPPER',
      },
    }),
  logout: (
    accessToken: string | null,
    payload: LogoutInputDto,
  ): Promise<LogoutResultDto> =>
    courierApiClient.request(courierEndpoints.auth.logout, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  introspect: (
    accessToken: string | null,
    payload: IntrospectInputDto,
  ): Promise<IntrospectResultDto> =>
    courierApiClient.request(courierEndpoints.auth.introspect, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  listUsers: (
    accessToken: string | null,
    filters: UserListFilters,
  ): Promise<UserAccountDto[]> => {
    const params = new URLSearchParams();

    if (filters.roleGroup) {
      params.set('roleGroup', filters.roleGroup);
    }

    if (filters.status) {
      params.set('status', filters.status);
    }

    if (filters.hubCode?.trim()) {
      params.set('hubCode', filters.hubCode.trim().toUpperCase());
    }

    if (filters.q?.trim()) {
      params.set('q', filters.q.trim());
    }

    const query = params.toString();
    return courierApiClient.request<UserAccountDto[]>(
      `${courierEndpoints.auth.users}${query ? `?${query}` : ''}`,
      { accessToken },
    );
  },
  getMobilePermissionEffective: (
    accessToken: string | null,
    userId: string,
  ): Promise<MobilePermissionEffectiveDto> =>
    courierApiClient.request(
      courierEndpoints.auth.mobilePermissionEffective(userId),
      { accessToken },
    ),
};

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login,
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (payload: LogoutInputDto) =>
      authApi.logout(payload.accessToken ?? null, payload),
  });
}
