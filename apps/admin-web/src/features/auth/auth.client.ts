import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AdminUserCreateInput,
  AdminUserDto,
  AdminUserFilters,
  AdminUserUpdateInput,
  AuthSessionDto,
  LoginFormValues,
  LogoutResultDto,
  RefreshTokenInputDto,
} from './auth.types';

export const authClient = {
  login: (payload: LoginFormValues): Promise<AuthSessionDto> =>
    opsApiClient.request<AuthSessionDto>(opsEndpoints.auth.login, {
      method: 'POST',
      body: payload,
    }),
  logout: (accessToken: string | null): Promise<LogoutResultDto> =>
    opsApiClient.request<LogoutResultDto>(opsEndpoints.auth.logout, {
      method: 'POST',
      accessToken,
      skipAuthRefresh: true,
      body: {
        accessToken,
      },
    }),
  refresh: (payload: RefreshTokenInputDto): Promise<AuthSessionDto> =>
    opsApiClient.request<AuthSessionDto>(opsEndpoints.auth.refresh, {
      method: 'POST',
      body: payload,
      skipAuthRefresh: true,
    }),
  listUsers: (
    accessToken: string | null,
    filters: AdminUserFilters,
  ): Promise<AdminUserDto[]> => {
    const params = new URLSearchParams();
    params.set('roleGroup', filters.roleGroup);

    if (filters.status) {
      params.set('status', filters.status);
    }

    if (filters.hubCode?.trim()) {
      params.set('hubCode', filters.hubCode.trim().toUpperCase());
    }

    if (filters.q?.trim()) {
      params.set('q', filters.q.trim());
    }

    const queryString = params.toString();
    return opsApiClient.request<AdminUserDto[]>(
      `${opsEndpoints.auth.users}${queryString ? `?${queryString}` : ''}`,
      {
        accessToken,
      },
    );
  },
  createUser: (
    accessToken: string | null,
    payload: AdminUserCreateInput,
  ): Promise<AdminUserDto> =>
    opsApiClient.request<AdminUserDto>(opsEndpoints.auth.users, {
      method: 'POST',
      accessToken,
      body: payload,
    }),
  updateUser: (
    accessToken: string | null,
    userId: string,
    payload: AdminUserUpdateInput,
  ): Promise<AdminUserDto> =>
    opsApiClient.request<AdminUserDto>(opsEndpoints.auth.userDetail(userId), {
      method: 'PATCH',
      accessToken,
      body: payload,
    }),
};
