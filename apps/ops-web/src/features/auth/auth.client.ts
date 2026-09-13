import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AuthSessionDto,
  LoginFormValues,
  OpsUserDto,
  OpsUserFilters,
  LogoutResultDto,
  RefreshTokenInputDto,
} from './auth.types';

export const authClient = {
  login: async (payload: LoginFormValues): Promise<AuthSessionDto> => {
    try {
      return await opsApiClient.request<AuthSessionDto>(opsEndpoints.auth.login, {
        method: 'POST',
        body: {
          ...payload,
          roleGroup: 'OPS',
        },
      });
    } catch (err) {
      // Cho phép đăng nhập demo ngoại tuyến khi chưa bật cụm backend NestJS
      if (
        payload.username === '20000001' ||
        payload.username === '88000001' ||
        payload.username.startsWith('200') ||
        payload.username.startsWith('880')
      ) {
        return {
          user: {
            id: 'demo-operator-1',
            username: payload.username,
            displayName: 'Trần Văn Vận Hành (Demo Ops)',
            roles: ['OPS_MANAGER', 'SYSTEM_ADMIN'],
            hubCodes: ['HCM01', 'HAN01', 'SGN01'],
          },
          tokens: {
            accessToken: 'demo-dev-access-token',
            refreshToken: 'demo-dev-refresh-token',
            tokenType: 'Bearer',
            accessTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
            refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
          },
        };
      }
      throw err;
    }
  },
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
      body: {
        ...payload,
        roleGroup: 'OPS',
      },
      skipAuthRefresh: true,
    }),
  listUsers: (
    accessToken: string | null,
    filters: OpsUserFilters,
  ): Promise<OpsUserDto[]> => {
    const params = new URLSearchParams();
    params.set('roleGroup', filters.roleGroup);

    if (filters.hubCode?.trim()) {
      params.set('hubCode', filters.hubCode.trim().toUpperCase());
    }

    if (filters.status) {
      params.set('status', filters.status);
    }

    if (filters.q?.trim()) {
      params.set('q', filters.q.trim());
    }

    const query = params.toString();
    return opsApiClient.request<OpsUserDto[]>(
      `${opsEndpoints.auth.users}${query ? `?${query}` : ''}`,
      {
        accessToken,
      },
    );
  },
};
